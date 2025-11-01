import { Button, IconButton } from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const Svg = () => {      
  const dispatch = useDispatch();
  const scansFromStore = useSelector(state => state.scans?.scans || []);
  
  const [robots, setRobots] = useState([
    { id: 'R001', x: 15 + 1 * 30, y: 15 + 22 * 30, battery: 85, status: 'active', lastUpdate: '2024-01-15 14:30:25' },
    { id: 'R002', x: 15 + 1 * 30, y: 15 + 23 * 30, battery: 25, status: 'low_battery', lastUpdate: '2024-01-15 14:28:10' },
    { id: 'R003', x: 15 + 1 * 30, y: 15 + 24 * 30, battery: 0, status: 'offline', lastUpdate: '2024-01-15 13:45:00' },
    { id: 'R004', x: 15 + 1 * 30, y: 15 + 25 * 30, battery: 92, status: 'active', lastUpdate: '2024-01-15 14:31:45' },
    { id: 'R005', x: 15 + 1 * 30, y: 15 + 26 * 30, battery: 45, status: 'active', lastUpdate: '2024-01-15 14:31:45' },
  ]);

  const [zones, setZones] = useState({});
  const [scale, setScale] = useState(1.2);
  const [isPaused, setIsPaused] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [realTimeData, setRealTimeData] = useState({
    activeScans: [],
    zoneStatus: {},
    robotPositions: {}
  });

  const stompClientRef = useRef(null);

  // Функция для преобразования координат робота в пиксели (матрица 5x3)
  const robotToCoordinates = useCallback((zone, row, shelf) => {
    if (!zone || row === undefined || shelf === undefined) {
      return { x: 0, y: 0 };
    }
    
    const zoneLetter = zone.toUpperCase();
    const zoneIndex = zoneLetter.charCodeAt(0) - 65; // A=0, B=1, ..., O=14
    
    // Зоны расположены в матрице 5 строк × 3 столбца
    const zonesPerRow = 3;
    const zoneWidth = 8;   // клеток по X (ряды)
    const zoneHeight = 10; // клеток по Y (полки)
    
    // Расчет позиции зоны в матрице
    const matrixRow = Math.floor(zoneIndex / zonesPerRow); // 0-4
    const matrixCol = zoneIndex % zonesPerRow; // 0-2
    
    // Координаты внутри зоны + смещение по матрице
    const cellX = matrixCol * zoneWidth + row;
    const cellY = matrixRow * zoneHeight + shelf;
    
    // Преобразование в пиксели (начинаем с колонки C - индекс 2)
    const x = 90 + (cellX + 2) * 30 + 15;
    const y = 30 + cellY * 30 + 15;
    
    console.log(`Robot coordinates: zone=${zone} (index=${zoneIndex}, matrix=[${matrixRow},${matrixCol}]), row=${row}, shelf=${shelf} -> x=${x}, y=${y}`);
    
    return { x, y };
  }, []);

  // Функция для преобразования координат зоны в пиксели
  const zoneToCoordinates = useCallback((zoneString) => {
    if (!zoneString) return { x: 0, y: 0 };
    
    const match = zoneString.match(/^([A-O])$/i);
    if (match) {
      const letter = match[1];
      const zoneIndex = letter.charCodeAt(0) - 65;
      const zonesPerRow = 3;
      const zoneWidth = 8;
      const zoneHeight = 10;
      
      const matrixRow = Math.floor(zoneIndex / zonesPerRow);
      const matrixCol = zoneIndex % zonesPerRow;
      
      // Центр зоны
      const centerX = matrixCol * zoneWidth + zoneWidth / 2;
      const centerY = matrixRow * zoneHeight + zoneHeight / 2;
      
      return {
        x: 90 + (centerX + 2) * 30 + 15,
        y: 30 + centerY * 30 + 15
      };
    }
    
    return { x: 0, y: 0 };
  }, []);

  // Функция для обновления позиций роботов
  const updateRobotPositions = useCallback((robotData) => {
    if (!robotData || !Array.isArray(robotData)) return;
    
    const updatedRobots = robotData.map(robot => {
      // Проверяем валидность координат
      const zone = robot.current_zone || robot.zone;
      const row = robot.current_row || robot.row;
      const shelf = robot.current_shelf || robot.shelf;
      
      if (!zone || row === undefined || shelf === undefined) {
        console.warn(`Invalid coordinates for robot ${robot.id}: zone=${zone}, row=${row}, shelf=${shelf}`);
        return null;
      }
      
      // Проверяем диапазоны
      const zoneIndex = zone.toUpperCase().charCodeAt(0) - 65;
      if (zoneIndex < 0 || zoneIndex > 14) {
        console.warn(`Zone out of range for robot ${robot.id}: ${zone} (A-O expected)`);
        return null;
      }
      
      if (row < 0 || row >= 8 || shelf < 0 || shelf >= 10) {
        console.warn(`Coordinates out of range for robot ${robot.id}: row=${row} (0-7), shelf=${shelf} (0-9)`);
        return null;
      }
      
      // Получаем координаты из данных робота
      const coords = robotToCoordinates(zone, row, shelf);
      
      // Находим существующего робота или создаем нового
      const existingRobot = robots.find(r => r.id === robot.id || r.id === robot.robotId);
      
      return {
        id: robot.id || robot.robotId || existingRobot?.id || `R${Math.random().toString(36).substr(2, 4)}`,
        x: coords.x,
        y: coords.y,
        battery: robot.batteryLevel || robot.battery || existingRobot?.battery || 100,
        status: mapRobotStatus(robot.status || existingRobot?.status || 'active'),
        lastUpdate: robot.lastUpdate || robot.timestamp || new Date().toISOString(),
        currentZone: zone,
        currentRow: row,
        currentShelf: shelf
      };
    }).filter(robot => robot !== null);
    
    setRobots(updatedRobots);
  }, [robots, robotToCoordinates]);

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
      'MAINTENANCE': 'offline'
    };
    
    return statusMap[status] || status;
  };

  // Функция для обновления статуса зон на основе сканирований
  const updateZoneStatus = useCallback((scans) => {
    const zoneUpdates = {};
    
    scans.forEach(scan => {
      if (scan.zone) {
        // Определяем статус зоны на основе статуса сканирования
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
  }, []);

  // Подключение к WebSocket для реальных данных
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    setWsStatus('connecting');
    
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);
    
    stompClient.debug = process.env.NODE_ENV === 'development' 
      ? console.log 
      : () => {};
    
    const headers = {
      Authorization: `Bearer ${token}`
    };

    stompClient.connect(headers, 
      // onConnect
      (frame) => {
        console.log('SVG WebSocket connected:', frame);
        setWsStatus('connected');
        stompClientRef.current = stompClient;
        
        // Подписка на топик роботов
        stompClient.subscribe('/topic/robots', (message) => {
          try {
            const robotsData = JSON.parse(message.body);
            console.log('Received robots data for SVG:', robotsData);
            updateRobotPositions(robotsData);
          } catch (error) {
            console.error('Error parsing robots data in SVG:', error);
          }
        });
        
        // Подписка на топик активных сканирований
        stompClient.subscribe('/topic/active_scans', (message) => {
          try {
            const activeScans = JSON.parse(message.body);
            console.log('Received active scans:', activeScans);
            
            setRealTimeData(prev => ({
              ...prev,
              activeScans: Array.isArray(activeScans) ? activeScans : [activeScans]
            }));
          } catch (error) {
            console.error('Error parsing active scans:', error);
          }
        });
        
        // Подписка на топик статуса зон
        stompClient.subscribe('/topic/zone_status', (message) => {
          try {
            const zoneStatus = JSON.parse(message.body);
            console.log('Received zone status:', zoneStatus);
            
            setRealTimeData(prev => ({
              ...prev,
              zoneStatus: zoneStatus
            }));
          } catch (error) {
            console.error('Error parsing zone status:', error);
          }
        });
        
        // Запрос начальных данных
        stompClient.send('/app/request-robots', {}, JSON.stringify({}));
        stompClient.send('/app/request-zone_status', {}, JSON.stringify({}));
        
      }, 
      // onError
      (error) => {
        console.error('SVG WebSocket connection error:', error);
        setWsStatus('error');
      }
    );
    
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {
          console.log('SVG WebSocket disconnected');
        });
      }
      stompClientRef.current = null;
    };
  }, [updateRobotPositions]);

  // Обновление статуса зон при получении новых сканирований
  useEffect(() => {
    if (scansFromStore.length > 0) {
      updateZoneStatus(scansFromStore);
    }
  }, [scansFromStore, updateZoneStatus]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleCenter = () => setScale(1.9);

  const getRobotColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'low_battery': return '#F59E0B';
      case 'offline': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getZoneColor = (zone) => {
    // Проверяем данные из WebSocket
    if (realTimeData.zoneStatus[zone]) {
      const status = realTimeData.zoneStatus[zone].status;
      switch (status) {
        case 'critical': return '#FECACA';
        case 'needs_check': return '#FDE68A';
        case 'recent': return '#BBF7D0';
        default: return '#E5E7EB';
      }
    }
    
    // Проверяем локальные данные
    if (zones[zone]) {
      switch (zones[zone].status) {
        case 'critical': return '#FEE2E2';
        case 'needs_check': return '#FEF3C7';
        case 'recent': return '#D1FAE5';
        default: return '#F3F4F6';
      }
    }
    
    // Стандартный цвет
    return '#F3F4F6';
  };

  // Функция для получения текущих активных сканирований в зоне
  const getActiveScansForZone = (zone) => {
    return realTimeData.activeScans.filter(scan => scan.zone === zone);
  };

  return (
    <>
      <div className="dashboard-map">
        <div className="map-container">
          <div className="map-controls">
            <div className="connection-status">
              <span className={`status-indicator ${wsStatus}`}></span>
              WebSocket: {wsStatus}
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
              viewBox="0 0 810 1600"
              style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}
            >

              <defs>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                </pattern>
                
                {/* Градиенты для анимации */}
                <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              <rect width="100%" height="1531" fill="url(#grid)"/>
              
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
                  const activeScans = getActiveScansForZone(zone);
                  const hasActiveScan = activeScans.length > 0;
                  
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
                      
                      {/* Анимация для активных сканирований */}
                      {hasActiveScan && (
                        <circle
                          cx={90 + col * 30 + 15}
                          cy={30 + row * 30 + 15}
                          r="8"
                          fill="url(#pulse)"
                        >
                          <animate
                            attributeName="r"
                            from="8"
                            to="15"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            from="0.7"
                            to="0"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
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
                    {`ID: ${robot.id} | Батарея: ${robot.battery}% | Статус: ${robot.status} | Зона: ${robot.currentZone || 'Неизвестно'} | Ряд: ${robot.currentRow ?? '?'} | Полка: ${robot.currentShelf ?? '?'} | Обновление: ${new Date(robot.lastUpdate).toLocaleTimeString()}`}
                  </title>
                </g>
              ))}
              
              {/* Легенда */}
              <g className="legend" transform="translate(0, 1531)">
                <rect x="0" y="0" width="180" height="80" fill="white" stroke="#E5E7EB" rx="4" />
                <text x="10" y="15" fontSize="10" fontWeight="bold">Легенда:</text>
                <circle cx="15" cy="30" r="5" fill="#10B981" />
                <text x="25" y="33" fontSize="8">Активный</text>
                <circle cx="15" cy="45" r="5" fill="#F59E0B" />
                <text x="25" y="48" fontSize="8">Низкий заряд</text>
                <circle cx="15" cy="60" r="5" fill="#EF4444" />
                <text x="25" y="63" fontSize="8">Оффлайн</text>
                <text x="10" y="75" fontSize="8" fill="#6B7280">
                  WS: {wsStatus} | Роботов: {robots.length}
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