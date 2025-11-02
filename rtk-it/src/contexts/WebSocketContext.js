import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const WebSocketContext = createContext();

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within WebSocketProvider');
    }
    return context;
};

export const WebSocketProvider = ({ children }) => {
    const stompClientRef = useRef(null);
    const [connectionState, setConnectionState] = useState('disconnected');
    const [subscribers, setSubscribers] = useState(new Map());
    const [metrics, setMetrics] = useState({
        activeRobots: 0,
        totalRobots: 0,
        scannedToday: 0,
        criticalStock: 0,
        averageBattery: 0,
        lastUpdate: null
    });

    // Функция подключения к WebSocket
    const connect = useRef(async () => {
        if (stompClientRef.current?.connected) {
            return stompClientRef.current;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Токен авторизации не найден');
            }

            setConnectionState('connecting');

            const socket = new SockJS('http://84.201.169.166:8080/ws');
            const client = Stomp.over(socket);

            client.debug = process.env.NODE_ENV === 'development' ? console.log : () => { };

            const headers = {
                Authorization: `Bearer ${token}`
            };

            return new Promise((resolve, reject) => {
                client.connect(headers, (frame) => {
                    console.log('✅ WebSocket connected successfully');
                    stompClientRef.current = client;
                    setConnectionState('connected');

                    // Подписка на основной топик с прогнозами
                    client.subscribe('/topic/actual-info', (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            const transformedMetrics = transformPredictionData(data);
                            setMetrics(transformedMetrics);

                            // Уведомляем всех подписчиков
                            subscribers.forEach((callback) => {
                                callback(transformedMetrics);
                            });

                        } catch (error) {
                            console.error('❌ Error parsing actual-info data:', error);
                        }
                    });

                    // Запрос начальных данных
                    client.send('/app/subscribe-actual-info', {}, JSON.stringify({}));
                    resolve(client);

                }, (error) => {
                    console.error('❌ WebSocket connection failed:', error);
                    setConnectionState('error');
                    reject(error);
                });
            });

        } catch (error) {
            console.error('❌ WebSocket setup error:', error);
            setConnectionState('error');
            throw error;
        }
    });

    // Функция для подписки на обновления метрик
    const subscribeToMetrics = (callback) => {
        const id = Math.random().toString(36);
        setSubscribers(prev => new Map(prev).set(id, callback));

        // Возвращаем функцию отписки
        return () => {
            setSubscribers(prev => {
                const newSubs = new Map(prev);
                newSubs.delete(id);
                return newSubs;
            });
        };
    };

    // Функция отправки сообщений
    const sendMessage = (destination, body) => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.send(destination, {}, JSON.stringify(body));
        }
    };

    // Функция отключения
    const disconnect = () => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.disconnect();
        }
        stompClientRef.current = null;
        setConnectionState('disconnected');
    };

    // Подключаемся при монтировании провайдера
    useEffect(() => {
        connect.current();

        return () => {
            disconnect();
        };
    }, []);

    const value = {
        connectionState,
        metrics,
        subscribeToMetrics,
        sendMessage,
        disconnect,
        reconnect: () => {
            disconnect();
            setTimeout(() => connect.current(), 1000);
        }
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

// Функция трансформации данных прогноза в метрики дашборда
const transformPredictionData = (predictionData) => {
    // Если данные приходят как массив ActualEntity
    if (Array.isArray(predictionData)) {
        if (predictionData.length === 0) {
            return getDefaultMetrics();
        }
        
        // Берем первую запись из массива
        const data = predictionData[0];
        
        return {
            activeRobots: data.active_robots || 0,
            totalRobots: data.total_robots || 0,
            scannedToday: data.total_checked_locations || 0,
            criticalStock: data.critical_items_count || 0,
            averageBattery: data.avg_battery_level || 0,
            lastUpdate: new Date().toISOString()
        };
    }
    
    // Если данные приходят как одиночный объект
    return {
        activeRobots: predictionData.active_robots || 0,
        totalRobots: predictionData.total_robots || 0,
        scannedToday: predictionData.total_checked_locations || 0,
        criticalStock: predictionData.critical_items_count || 0,
        averageBattery: predictionData.avg_battery_level || 0,
        lastUpdate: new Date().toISOString()
    };
};

// Функция для возврата метрик по умолчанию
const getDefaultMetrics = () => ({
    activeRobots: 0,
    totalRobots: 0,
    scannedToday: 0,
    criticalStock: 0,
    averageBattery: 0,
    lastUpdate: null
});