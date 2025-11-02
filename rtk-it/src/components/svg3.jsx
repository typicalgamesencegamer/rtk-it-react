import { Button, IconButton } from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

let globalStompClient = null;
let connectionPromise = null;
let connectionSubscribers = new Set();

const Svg = () => {
    const dispatch = useDispatch();
    const scansFromStore = useSelector(state => state.scans?.scans || []);

    const [robots, setRobots] = useState([]);
    const [zones, setZones] = useState({});
    const [scale, setScale] = useState(1.);
    const [wsStatus, setWsStatus] = useState('disconnected');
    const [lastDataUpdate, setLastDataUpdate] = useState(null);

    const componentIdRef = useRef(`svg-${Math.random().toString(36).substr(2, 9)}`);
    const isSubscribedRef = useRef(false);

    // Функция для преобразования координат робота в пиксели
    const robotToCoordinates = useCallback((zone, row, shelf, id) => {
        if (!zone || row === undefined || row === null || shelf === undefined || shelf === null) {
            console.warn(`Invalid coordinates: zone=${zone}, row=${row}, shelf=${shelf}`);
            return { x: 0, y: 0 };
        }

        const zoneLetter = zone.toUpperCase();
        const zoneIndex = zoneLetter.charCodeAt(0) - 65;

        const zonesPerRow = 3;
        const matrixCol = 105 + 240 * (zoneIndex % zonesPerRow);
        const matrixRow = 45 + 300 * Math.floor(zoneIndex / zonesPerRow);

        const cellX = matrixCol + (row * 30);
        const cellY = matrixRow + (shelf * 30);

        let x = cellX;
        let y = cellY;

        if (zoneIndex === 25) {
            x = 15 + 1 * 30;
            y = 15 + 22 + (id ? id[5] || 0 : 0) * 30;
        }

        console.log(`Robot coordinates: zone=${zone} (index=${zoneIndex}), row=${row}, shelf=${shelf} -> x=${x}, y=${y}`);

        return { x, y };
    }, []);

    // Функция для обновления позиций роботов
    const updateRobotPositions = useCallback((robotData) => {
        if (!robotData || !Array.isArray(robotData)) {
            console.log('No robot data received or data is not array');
            return;
        }

        console.log('🔄 Updating robot positions with data:', robotData.length, 'robots');

        const updatedRobots = robotData.map(robot => {
            const zone = robot.current_zone || robot.zone;
            const row = robot.current_row ?? robot.row;
            const shelf = robot.current_shelf ?? robot.shelf;
            const robotid = robot.id || robot.robotId;

            if (!zone || row === undefined || row === null || shelf === undefined || shelf === null) {
                console.warn(`Invalid coordinates for robot ${robot.id}: zone=${zone}, row=${row}, shelf=${shelf}`);
                return null;
            }

            const zoneIndex = zone.toUpperCase().charCodeAt(0) - 65;
            if (zoneIndex < 0 || (zoneIndex > 14 && zoneIndex != 25)) {
                console.warn(`Zone out of range for robot ${robot.id}: ${zone} (A-O or Z expected)`);
                return null;
            }

            if (row < 0 || row >= 9 || shelf < 0 || shelf >= 11) {
                console.warn(`Coordinates out of range for robot ${robot.id}: row=${row} (0-7), shelf=${shelf} (0-9)`);
                return null;
            }

            const coords = robotToCoordinates(zone, row, shelf, robotid);

            return {
                id: robot.id || robot.robotId || `R${Math.random().toString(36).substr(2, 4)}`,
                x: coords.x,
                y: coords.y,
                battery: robot.battery_level || robot.batteryLevel || robot.battery || 100,
                status: mapRobotStatus(robot.status || 'active'),
                lastUpdate: robot.last_update || robot.lastUpdate || robot.timestamp || new Date().toISOString(),
                currentZone: zone,
                currentRow: row,
                currentShelf: shelf
            };
        }).filter(robot => robot !== null);

        console.log(`✅ Updated ${updatedRobots.length} robots`);
        setRobots(updatedRobots);
        setLastDataUpdate(new Date());
    }, [robotToCoordinates]);

    // Функция для преобразования статуса робота
    const mapRobotStatus = (status) => {
        const statusMap = {
            'ACTIVE': 'active',
            'CHARGING': 'active',
            'SCANNING': 'active',
            'LOW_BATTERY': 'low_battery',
            'CRITICAL_BATTERY': 'low_battery',
            'OFFLINE': 'offline',
            'ERROR': 'offline',
            'MAINTENANCE': 'offline',
            'ONLINE': 'active',
            'BUSY': 'active'
        };

        return statusMap[status?.toUpperCase()] || 'active';
    };

    // Функция для обновления статуса зон на основе сканирований
    const updateZoneStatus = useCallback((scans) => {
        const zoneUpdates = {};

        scans.forEach(scan => {
            if (scan.zone) {
                let status = 'normal';
                if (scan.status === 'CRITICAL' || scan.status === 'Критично') {
                    status = 'critical';
                } else if (scan.status === 'LOW_STOCK' || scan.status === 'Низкий остаток') {
                    status = 'needs_check';
                } else if (scan.status === 'OK') {
                    status = 'recent';
                }

                zoneUpdates[scan.zone] = {
                    status,
                    lastScan: scan.scannedAt || scan.time,
                    product: scan.productID || scan.product,
                    quantity: scan.quantity
                };
            }
        });

        setZones(prev => ({ ...prev, ...zoneUpdates }));
        setLastDataUpdate(new Date());
    }, []);

    // Функция для установки подписок WebSocket (УПРОЩЕННАЯ)
    const setupWebSocketSubscriptions = useCallback((stompClient) => {
        if (isSubscribedRef.current) {
            console.log('Subscriptions already set up for component:', componentIdRef.current);
            return;
        }

        console.log('🔌 Setting up WebSocket subscriptions for component:', componentIdRef.current);

        // ✅ ПРОСТО ПОДПИСКА НА ТОПИКИ - данные приходят автоматически каждые 5 секунд

        // Подписка на топик роботов
        stompClient.subscribe('/topic/robots', (message) => {
            try {
                const robotsData = JSON.parse(message.body);
                console.log('🤖 Received robots data:', robotsData.length, 'robots');
                updateRobotPositions(robotsData);
            } catch (error) {
                console.error('❌ Error parsing robots data:', error);
            }
        });

        // Подписка на топик истории инвентаря
        stompClient.subscribe('/topic/inventory_history', (message) => {
            try {
                const inventoryData = JSON.parse(message.body);
                console.log('📦 Received inventory history data:', inventoryData.length, 'items');

                if (Array.isArray(inventoryData)) {
                    updateZoneStatus(inventoryData);
                }
            } catch (error) {
                console.error('❌ Error parsing inventory history data:', error);
            }
        });

        // Подписка на топик актуальной информации
        stompClient.subscribe('/topic/actual-info', (message) => {
            try {
                const actualData = JSON.parse(message.body);
                console.log('📊 Received actual info data:', actualData.length, 'items');
                // Можно обработать актуальные данные если нужно
            } catch (error) {
                console.error('❌ Error parsing actual info data:', error);
            }
        });

        console.log('✅ All subscriptions set up successfully');
        isSubscribedRef.current = true;
    }, [updateRobotPositions, updateZoneStatus]);

    // Функция для создания или получения WebSocket соединения
    const getWebSocketConnection = useCallback(async () => {
        if (globalStompClient && globalStompClient.connected) {
            console.log('Using existing WebSocket connection');
            return globalStompClient;
        }

        if (connectionPromise) {
            console.log('Waiting for existing connection promise');
            return connectionPromise;
        }

        connectionPromise = new Promise((resolve, reject) => {
            const token = localStorage.getItem('token');
            if (!token) {
                reject(new Error('No token found in localStorage'));
                return;
            }

            setWsStatus('connecting');

            const socket = new SockJS('http://84.201.169.166:8080/ws');
            const stompClient = Stomp.over(socket);

            stompClient.debug = process.env.NODE_ENV === 'development'
                ? console.log
                : () => { };

            const headers = {
                Authorization: `Bearer ${token}`
            };

            stompClient.connect(headers,
                (frame) => {
                    console.log('✅ Global WebSocket connected:', frame);
                    setWsStatus('connected');
                    globalStompClient = stompClient;
                    connectionPromise = null;

                    connectionSubscribers.forEach(callback => callback(stompClient));
                    resolve(stompClient);
                },
                (error) => {
                    console.error('❌ Global WebSocket connection error:', error);
                    setWsStatus('error');
                    connectionPromise = null;
                    globalStompClient = null;
                    reject(error);
                }
            );
        });

        return connectionPromise;
    }, []);

    // Подключение к WebSocket для реальных данных
    useEffect(() => {
        const componentId = componentIdRef.current;

        const connectionCallback = (stompClient) => {
            console.log('Component notified of connection:', componentId);
            setupWebSocketSubscriptions(stompClient);
        };

        connectionSubscribers.add(connectionCallback);

        getWebSocketConnection()
            .then((stompClient) => {
                if (stompClient.connected && !isSubscribedRef.current) {
                    setupWebSocketSubscriptions(stompClient);
                }
            })
            .catch((error) => {
                console.error('Failed to get WebSocket connection:', error);
            });

        return () => {
            console.log('Cleaning up WebSocket subscriptions for component:', componentId);
            connectionSubscribers.delete(connectionCallback);
            isSubscribedRef.current = false;
        };
    }, [getWebSocketConnection, setupWebSocketSubscriptions]);

    // Обновление статуса зон при получении новых сканирований
    useEffect(() => {
        if (scansFromStore.length > 0) {
            updateZoneStatus(scansFromStore);
        }
    }, [scansFromStore, updateZoneStatus]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
    const handleCenter = () => setScale(1.2);

    const getRobotColor = (status) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'low_battery': return '#F59E0B';
            case 'offline': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getZoneColor = (zone) => {
        if (zones[zone]) {
            switch (zones[zone].status) {
                case 'critical': return '#FEE2E2';
                case 'needs_check': return '#FEF3C7';
                case 'recent': return '#D1FAE5';
                default: return '#F3F4F6';
            }
        }
        return '#F3F4F6';
    };

    const formatLastUpdate = () => {
        if (!lastDataUpdate) return 'Нет данных';
        const now = new Date();
        const diff = Math.floor((now - lastDataUpdate) / 1000);
        if (diff < 60) return `${diff} сек назад`;
        return `${Math.floor(diff / 60)} мин назад`;
    };

    return (
        <>
            <div className="dashboard-map">
                <div className="map-container">
                    <div className="map-controls">
                        <div className="connection-status">
                            <span className={`status-indicator ${wsStatus}`}></span>
                            WebSocket: {wsStatus} | Роботов: {robots.length} | Обновлено: {formatLastUpdate()}
                        </div>
                        <IconButton onClick={handleZoomIn} size="small">
                            <ZoomInIcon />
                        </IconButton>
                        <IconButton onClick={handleZoomOut} size="small">
                            <ZoomOutIcon />
                        </IconButton>
                        <IconButton onClick={handleCenter} size="small">
                            <ZoomOutMapIcon />
                        </IconButton>
                    </div>
                    <div className="map-wrapper">
                        <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 810 2000"
                            style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
                        >

                            <defs>
                                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="1" />
                                </pattern>

                                <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                                </radialGradient>
                            </defs>

                            <rect width="100%" height="1531" fill="url(#grid)" />

                            {/* Нумерация строк */}
                            {Array.from({ length: 50 }, (_, i) => (
                                <text key={i} x="5" y={45 + i * 30} className="grid-label">{i + 1}</text>
                            ))}

                            {/* Буквы столбцов */}
                            {Array.from({ length: 26 }, (_, i) => (
                                <text key={i} x={35 + i * 30} y="15" className="grid-label">
                                    {String.fromCharCode(65 + i)}
                                </text>
                            ))}

                            {/* Зоны склада */}
                            {Array.from({ length: 24 }, (_, col) =>
                                Array.from({ length: 50 }, (_, row) => {
                                    const zone = `${String.fromCharCode(65 + col)}-${row + 1}`;

                                    return (
                                        <g key={`${col}-${row}`}>
                                            <rect
                                                x={90 + col * 30}
                                                y={30 + row * 30}
                                                width="30"
                                                height="30"
                                                fill={getZoneColor(zone)}
                                                stroke="#D1D5DB"
                                                strokeWidth="1"
                                            />
                                        </g>
                                    );
                                })
                            )}

                            {/* Роботы */}
                            {robots.map(robot => (
                                <g key={robot.id} className="robot-group">
                                    {/* Индикатор батареи */}
                                    <rect
                                        x={robot.x - 12}
                                        y={robot.y - 18}
                                        width="24"
                                        height="4"
                                        fill="#E5E7EB"
                                        rx="2"
                                    />
                                    <rect
                                        x={robot.x - 12}
                                        y={robot.y - 18}
                                        width={24 * (robot.battery / 100)}
                                        height="4"
                                        fill={robot.battery > 20 ? '#10B981' : '#EF4444'}
                                        rx="2"
                                    />

                                    <circle
                                        cx={robot.x}
                                        cy={robot.y}
                                        r="12"
                                        fill={getRobotColor(robot.status)}
                                        stroke="#FFFFFF"
                                        strokeWidth="2"
                                    />

                                    <text
                                        x={robot.x}
                                        y={robot.y + 4}
                                        textAnchor="middle"
                                        fill="white"
                                        fontSize="8"
                                        fontWeight="bold"
                                    >
                                        {robot.id.replace('R', '')}
                                    </text>

                                    {/* Всплывающая подсказка */}
                                    <title>
                                        {`ID: ${robot.id} | Батарея: ${robot.battery}% | Статус: ${robot.status} | Зона: ${robot.currentZone || 'Неизвестно'} | Ряд: ${(robot.currentRow ?? 0)} | Полка: ${(robot.currentShelf ?? 0)} | Обновление: ${new Date(robot.lastUpdate).toLocaleTimeString()}`}
                                    </title>
                                </g>
                            ))}

                            {/* Легенда */}
                            <g className="legend" transform="translate(0, 1531)">
                                <rect x="0" y="0" width="1200" height="600" fill="white" stroke="#E5E7EB" rx="12" />
                                <text x="30" y="45" fontSize="30" fontWeight="bold">Заряд батареи:</text>
                                <circle cx="45" cy="90" r="15" fill="#10B981" />
                                <text x="75" y="99" fontSize="24">Активный</text>
                                <circle cx="45" cy="135" r="15" fill="#F59E0B" />
                                <text x="75" y="144" fontSize="24">Низкий заряд</text>
                                <circle cx="45" cy="180" r="15" fill="#EF4444" />
                                <text x="75" y="189" fontSize="24">Оффлайн</text>
                                <text x="30" y="225" fontSize="24" fill="#6B7280">
                                    Обновлено: {formatLastUpdate()}
                                </text>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Svg;
