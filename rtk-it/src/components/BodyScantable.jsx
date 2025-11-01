// import React from 'react';
// import { useState, useEffect, useRef } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
// import { addScan, togglePause, setAutoScroll } from '../store/slices/scantable';
// import { loadRobotsData } from '../store/slices/robots';
// import './scantable.css';
// import SockJS from 'sockjs-client'
// import Stomp from 'stompjs'


// const BodyScantable = () => {

//   const dispatch = useDispatch();
//   const { scans, isPaused, isAutoScroll, maxRecords } = useSelector(state => state.scans);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const tableRef = useRef(null);

//   // Генерация тестовых данных (в реальном приложении данные будут приходить с бэкенда)
//   const generateMockScan = () => {
//     const zones = ['A-01', 'A-02', 'B-01', 'B-02', 'C-01'];
//     const products = [
//       { name: 'Ноутбук Dell XPS', sku: 'DLXPS13-9520' },
//       { name: 'Мышь Logitech MX', sku: 'LGMX3S-BLK' },
//       { name: 'Клавиатура Keychron', sku: 'KCV6-WH' },
//       { name: 'Монитор Samsung', sku: 'SMS32A850' },
//       { name: 'Док-станция USB-C', sku: 'USBC-DK45' }
//     ];
//     const statuses = ['OK', 'Низкий остаток', 'Критично'];

//     const randomZone = zones[Math.floor(Math.random() * zones.length)];
//     const randomProduct = products[Math.floor(Math.random() * products.length)];
//     const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
//     const randomQuantity = Math.floor(Math.random() * 100) + 1;

//     return {
//       id: Date.now(),
//       time: new Date().toLocaleTimeString(),
//       robotId: `RB${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
//       zone: randomZone,
//       product: randomProduct,
//       quantity: randomQuantity,
//       status: randomStatus
//     };
//   };

//   // Автоматическое добавление новых сканирований
//   useEffect(() => {
//     if (isPaused) return;

//     const interval = setInterval(() => {

//     }, 5000); // Новое сканирование каждые 5 секунды

//     return () => clearInterval(interval);
//   }, [dispatch, isPaused]);

//   // Автоскролл при новых записях
//   useEffect(() => {
//     if (isAutoScroll && tableRef.current) {
//       tableRef.current.scrollTop = 0;
//     }
//   }, [scans, isAutoScroll]);

//   // Обновление времени
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentTime(new Date());
//     }, 1000);

//     return () => clearInterval(timer);
//   }, []);

//   function handleScanData(scanData) {
//     return {
//       scanID: scanData.id,
//       robotID: scanData.robot_id,
//       productID: scanData.product_id,
//       quantity: scanData.quantity,
//       zone: scanData.zone,
//       rowNumber: scanData.row_number,
//       shelfNumber: scanData.shelf_number,
//       status: scanData.status,
//       scannedAt: new Date(scanData.scanned_at),
//       createdAt: new Date(scanData.created_at),
//     }
//   }

//   // let HttpsWebSocket = new WebSocket('http://localhost:8080');
//   // useEffect(() => {
//   //   const token = localStorage.getItem('token');
//   //   const headers = {
//   //     "Authorization": `Bearer ${token}`
//   //   };

//   //   HttpsWebSocket.onopen = () => {
//   //     console.log('WebSocket соединение установлено. Отправляю токен');
//   //     // Отправляем токен как первое сообщение после успешного подключения
//   //     HttpsWebSocket.send(JSON.stringify({ type: 'auth', token }));
//   //     HttpsWebSocket.send(JSON.stringify({ type: 'subscribe', topic: 'robots' }));

//   //   };

//   //   HttpsWebSocket.onmessage = (event) => {
//   //     if (event.data.topic === 'robots') {
//   //       setRobots(() => [event.data]);
//   //       dispatch(loadRobotsData(robots.data));
//   //     }
//   //     if (event.data.topic === 'inventory_history') {
//   //       dispatch(addScan(event.data));
//   //     }
//   //   };

//   // }, [])

//   useEffect(() => {
//     const token = localStorage.getItem('token');
    
//     // Подключение через SockJS
//     const socket = new SockJS('http://localhost:8080/ws');
//     const stompClient = Stomp.over(socket);
    
//     // Отключаем дебаг (опционально)
//     stompClient.debug = null;
    
//     stompClient.connect({
//         "Authorization": `Bearer ${token}`
//     }, function(frame) {
//         console.log('WebSocket connected:', frame);
        
//         // Подписка на топики
//         stompClient.subscribe('/topic/robots', function(message) {
//             const robots = JSON.parse(message.body);
//             console.log('Received robots:', robots);
//             setRobots(robots);
//             dispatch(loadRobotsData(robots));
//         });
        
//         stompClient.subscribe('/topic/inventory_history', function(message) {
//             const inventory = JSON.parse(message.body);
//             console.log('Received inventory:', inventory);
//             dispatch(addScan(inventory));
//         });
        
//         // Запрос данных после подключения
//         stompClient.send('/request-robots', {});
//         stompClient.send('/request-inventory_history', {});
        
//     }, function(error) {
//         console.error('WebSocket error:', error);
//     });
    
//     // Очистка при размонтировании
//     return () => {
//         if (stompClient) {
//             // stompClient.disconnect();
//         }
//     };
// }, [dispatch]);

//   const handlePauseClick = () => {
//     dispatch(togglePause());
//     // HttpsWebSocket.send(JSON.stringify({ type: 'subscribe', topic: 'inventory_history' }));
//   };

//   const getStatusBadgeClass = (status) => {
//     switch (status) {
//       case 'OK':
//         return 'status-badge status-ok';
//       case 'Низкий остаток':
//         return 'status-badge status-warning';
//       case 'Критично':
//         return 'status-badge status-critical';
//       default:
//         return 'status-badge';
//     }
//   };

//   const [robots, setRobots] = useState({});





//   return (
//     <div className="scan-table-container">
//       <div className="scan-table-header">
//         <h3>Последние сканирования</h3>
//         <div className="controls">
//           <span className="record-count">
//             Записей: {scans.length}/{maxRecords}
//           </span>
//           <button
//             className={`pause-btn ${isPaused ? 'paused' : ''}`}
//             onClick={handlePauseClick}
//           >
//             {isPaused ? '▶' : '⏸'}
//           </button>
//         </div>
//       </div>

//       <div className="scan-table-wrapper" ref={tableRef}>
//         <table className="scan-table">
//           <thead>
//             <tr>
//               <th>Время</th>
//               <th>ID робота</th>
//               <th>Зона склада</th>
//               <th>Товар</th>
//               <th>Количество</th>
//               <th>Статус</th>
//             </tr>
//           </thead>
//           <tbody>
//             {scans.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="no-data">
//                   Нет данных сканирования
//                 </td>
//               </tr>
//             ) : (
//               //         scanID: scanData.id,
//               // robotID: scanData.robot_id,
//               // productID: scanData.product_id,
//               // quantity: scanData.quantity,
//               // zone: scanData.zone,
//               // rowNumber: scanData.row_number,
//               // shelfNumber: scanData.shelf_number,
//               // status: scanData.status,
//               // scannedAt: new Date(scanData.scanned_at),
//               // createdAt: new Date(scanData.created_at),
//               scans.map((scans) => (
//                 <tr key={scans.id} className="scan-row">
//                   <td className="time-cell">{scans.time}</td>
//                   <td className="robot-id">{scans.robotId}</td>
//                   <td className="zone-cell">{scans.zone}</td>
//                   <td className="product-cell">
//                     <div className="product-name">{scans.productID}</div>
//                   </td>
//                   <td className="quantity-cell">{scans.quantity}</td>
//                   <td className="status-cell">
//                     <span className={getStatusBadgeClass(scans.status)}>
//                       {scans.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="scan-table-footer">
//         <div className="current-time">
//           Текущее время: {currentTime.toLocaleTimeString()}
//         </div>
//         <div className="auto-scroll-indicator">
//           Автоскролл: {isAutoScroll ? 'ВКЛ' : 'ВЫКЛ'}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default BodyScantable