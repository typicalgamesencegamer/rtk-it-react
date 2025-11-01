import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addScan, togglePause, setAutoScroll } from '../store/slices/scantable';
import { loadRobotsData } from '../store/slices/robots';
import './scantable.css';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

const BodyScant = () => {
  const dispatch = useDispatch();
  const { scans, isPaused, isAutoScroll, maxRecords } = useSelector(state => state.scans);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const tableRef = useRef(null);
  const stompClientRef = useRef(null);

  // Функция для преобразования данных сканирования
  const transformScanData = useCallback((scanData) => {
    return {
      id: scanData.scanID || scanData.id,
      time: new Date(scanData.scannedAt || scanData.scanned_at).toLocaleTimeString(),
      robotId: scanData.robotID || scanData.robot_id,
      zone: scanData.zone,
      productID: scanData.productID || scanData.product_id,
      productName: scanData.productName || `Товар ${scanData.productID || scanData.product_id}`,
      quantity: scanData.quantity,
      status: scanData.status || 'OK',
      rowNumber: scanData.rowNumber || scanData.row_number,
      shelfNumber: scanData.shelfNumber || scanData.shelf_number,
      scannedAt: new Date(scanData.scannedAt || scanData.scanned_at),
      createdAt: new Date(scanData.createdAt || scanData.created_at)
    };
  }, []);

  // Функция для обработки ошибок статуса
  const getStatusBadgeClass = useCallback((status) => {
    switch (status) {
      case 'OK':
        return 'status-badge status-ok';
      case 'LOW_STOCK':
      case 'Низкий остаток':
        return 'status-badge status-warning';
      case 'CRITICAL':
      case 'Критично':
        return 'status-badge status-critical';
      default:
        return 'status-badge';
    }
  }, []);

  // Подключение к WebSocket
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return;
    }

    setConnectionStatus('connecting');

    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = Stomp.over(socket);

    // Отключаем дебаг в продакшене
    stompClient.debug = process.env.NODE_ENV === 'development'
      ? console.log
      : () => { };

    const headers = {
      Authorization: `Bearer ${token}`
    };

    stompClient.connect(headers,
      // onConnect
      (frame) => {
        console.log('WebSocket connected:', frame);
        setConnectionStatus('connected');
        stompClientRef.current = stompClient;

        // Подписка на топик роботов
        stompClient.subscribe('/topic/robots', (message) => {
          try {
            const robotsData = JSON.parse(message.body);
            console.log('Received robots data:', robotsData);

            // Преобразуем данные роботов если нужно
            const transformedRobots = Array.isArray(robotsData)
              ? robotsData
              : robotsData.data || robotsData.robots || [];

            dispatch(loadRobotsData(transformedRobots));
          } catch (error) {
            console.error('Error parsing robots data:', error);
          }
        });

        // Подписка на топик истории инвентаря
        stompClient.subscribe('/topic/inventory_history', (message) => {
          try {
            const inventoryData = JSON.parse(message.body);
            console.log('Received inventory data:', inventoryData);

            // Обрабатываем разные форматы данных
            let scansData = [];

            if (Array.isArray(inventoryData)) {
              scansData = inventoryData;
            } else if (inventoryData.data && Array.isArray(inventoryData.data)) {
              scansData = inventoryData.data;
            } else if (inventoryData.scans && Array.isArray(inventoryData.scans)) {
              scansData = inventoryData.scans;
            } else {
              // Если пришел одиночный объект
              scansData = [inventoryData];
            }

            // Преобразуем и добавляем каждое сканирование
            scansData.forEach(scan => {
              if (scan && !isPaused) {
                const transformedScan = transformScanData(scan);
                dispatch(addScan(transformedScan));
              }
            });

          } catch (error) {
            console.error('Error parsing inventory data:', error);
          }
        });

        // Запрос начальных данных
        stompClient.send('/app/request-robots', {}, JSON.stringify({}));
        stompClient.send('/app/request-inventory_history', {}, JSON.stringify({}));

      },
      // onError
      (error) => {
        console.error('WebSocket connection error:', error);
        setConnectionStatus('error');

        // Попытка переподключения через 5 секунд
        setTimeout(() => {
          if (stompClientRef.current === stompClient) {
            console.log('Attempting to reconnect...');
            setConnectionStatus('reconnecting');
          }
        }, 5000);
      }
    );

    // Очистка при размонтировании
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {
          console.log('WebSocket disconnected');
        });
      }
      stompClientRef.current = null;
    };
  }, [dispatch, isPaused, transformScanData]);

  // Автоскролл при новых записях
  useEffect(() => {
    if (isAutoScroll && tableRef.current && scans.length > 0) {
      tableRef.current.scrollTop = tableRef.current.scrollHeight;
    }
  }, [scans, isAutoScroll]);

  // Обновление времени
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Обработчик паузы
  const handlePauseClick = () => {
    dispatch(togglePause());
  };

  // Ограничение количества записей (можно вынести в стор)
  const displayedScans = scans.slice(-maxRecords);

  return (
    <div className="scan-table-container">
      <div className="scan-table-header">
        <h3>Последние сканирования</h3>
        <div className="controls">
          <span className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'connected' ? '✅' :
              connectionStatus === 'connecting' ? '🔄' :
                connectionStatus === 'reconnecting' ? '🔄' : '❌'}
            {connectionStatus}
          </span>
          <span className="record-count">
            Записей: {displayedScans.length}/{maxRecords}
          </span>
          <button
            className={`pause-btn ${isPaused ? 'paused' : ''}`}
            onClick={handlePauseClick}
            title={isPaused ? 'Возобновить обновление' : 'Приостановить обновление'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      <div className="scan-table-wrapper" ref={tableRef}>
        <table className="scan-table">
          <thead>
            <tr>
              <th>Время</th>
              <th>ID робота</th>
              <th>Зона склада</th>
              <th>Товар</th>
              <th>Количество</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {displayedScans.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  {connectionStatus === 'connected' ? 'Нет данных сканирования' : 'Загрузка данных...'}
                </td>
              </tr>
            ) : (
              displayedScans.map((scan) => (
                <tr key={scan.id} className="scan-row">
                  <td className="time-cell">{scan.time}</td>
                  <td className="robot-id">{scan.robotId}</td>
                  <td className="zone-cell">
                    {scan.zone}
                    {scan.rowNumber && ` Ряд ${scan.rowNumber}`}
                    {scan.shelfNumber && ` Стеллаж ${scan.shelfNumber}`}
                  </td>
                  <td className="product-cell">
                    <div className="product-name">{scan.productName}</div>
                    <div className="product-sku">SKU: {scan.productID}</div>
                  </td>
                  <td className="quantity-cell">{scan.quantity}</td>
                  <td className="status-cell">
                    <span className={getStatusBadgeClass(scan.status)}>
                      {scan.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="scan-table-footer">
        <div className="current-time">
          Текущее время: {currentTime.toLocaleTimeString()}
        </div>
        <div className="auto-scroll-indicator">
          Автоскролл: {isAutoScroll ? 'ВКЛ' : 'ВЫКЛ'}
        </div>
      </div>
    </div>
  );
};

export default BodyScant;