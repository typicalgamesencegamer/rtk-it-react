import SockJS from 'sockjs-client';
import store from '../store/store';
import { 
  updateRobots, 
  addScan, 
  updateStats, 
  updateWebsocketStatus,
  simulateData 
} from '../store/slices/warehouse';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.demoInterval = null;
  }

  connect() {
    try {
      // Для демо используем локальную симуляцию
      console.log('Starting demo WebSocket simulation');
      store.dispatch(updateWebsocketStatus('connected'));
      
      // Симуляция получения данных каждые 3 секунды
      this.demoInterval = setInterval(() => {
        store.dispatch(simulateData());
      }, 3000);

      // Если бы был реальный WebSocket:
      /*
      this.socket = new SockJS('/ws');
      this.socket.onopen = () => {
        store.dispatch(updateWebsocketStatus('connected'));
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };
      
      this.socket.onclose = () => {
        store.dispatch(updateWebsocketStatus('disconnected'));
        this.handleReconnect();
      };
      */

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    
    switch (type) {
      case 'ROBOT_UPDATE':
        store.dispatch(updateRobots(payload));
        break;
      case 'SCAN_DATA':
        store.dispatch(addScan(payload));
        break;
      case 'STATS_UPDATE':
        store.dispatch(updateStats(payload));
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      store.dispatch(updateWebsocketStatus('reconnecting'));
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    }
  }

  disconnect() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
    }
    if (this.socket) {
      this.socket.close();
    }
    store.dispatch(updateWebsocketStatus('disconnected'));
  }

  send(message) {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(JSON.stringify(message));
    }
  }
}

export default new WebSocketService();