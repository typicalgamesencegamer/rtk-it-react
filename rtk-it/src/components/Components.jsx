import React, { useEffect, useState, useCallback} from "react";
import { useLocation, useNavigate } from "react-router";
import Svg from "./svg2";
import { AppBar, Box, Button, Typography, } from "@mui/material";
import CSVUploadModal from "./CSVModal";
import { useDispatch, useSelector } from "react-redux";
import { loadRobotsData } from "../store/slices/robots";
import BodyScantable from "./BodyScantable";
import BodyScant from "./bodyScant";
import WarehouseMap from "./newSvg";
import { instance } from "../axios/axios";
import {
  TrendingUp,
  Warning,
  Inventory,
  CalendarToday,
  ShoppingCart
} from '@mui/icons-material';
import {
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Card, 
  CardContent, 
  Grid,
  LinearProgress,
  useTheme,
  Chip
} from '@mui/material';
import { 
  BatteryChargingFull,
  Refresh,
  Wifi,
  WifiOff
} from '@mui/icons-material';
 
import {SmartToy as RobotIcon} from "@mui/icons-material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

function Input(props) {
  return (
    <>
      <input type={props.type} placeholder={props.placeholder} value={props.value} onChange={props.onChange}></input>
    </>
  )
}



function LinkA(props) {
  return (
    <>
      <a>{props.text}</a>
    </>
  )
}

// function Header() {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const navigate = useNavigate();

//   function handleClick(id) {
//     switch (id) {
//       case "current_mon_btn":
//         navigate('/dashboard');
//         break;
//       case "history_mon_btn":
//         navigate('/history');
//         break;
//       default:
//         break;
//     }
//   }

//   const handleClickDownloadCSV = async (e) => {
//     e.preventDefault();
//     try {
//       const token = localStorage.getItem('token');
//       const CSVFile = await instance.get('/api/export-to-csv', token);

//     } catch (e) {
//       return e;
//     }

//   };

//   return (
//     <>
//       <AppBar color="default" sx={{
//         flexDirection: 'row',
//         justifyContent: 'space-between'
//       }} position="static">
//         <div className="img-logo"></div>
//         <h1 className="h_header">Умный склад</h1>
//         <div className="user_info">
//           <p className="user_name">user name</p>
//           <p className="user_role">user role</p>
//           <Button variant="contained" color="secondary" sx={{ mt: '37px', mr: '10px', textDecorationStyle: 'double' }}>Выход</Button>
//         </div>
//       </AppBar>

//       <div className='header__navigation-menu'>
//         <div className="header__navigation_item">
//           <Button id="current_mon_btn" className="header__navigation-menu_btn" variant="text" color="inherit" sx={{ width: '300px' }} onClick={(event) => handleClick(event.target.id)}>Текущий мониторинг</Button>
//         </div>
//         <div className="header__navigation_item">
//           <Button id="history_mon_btn" className="header__navigation-menu_btn" variant="text" color="inherit" sx={{ width: '300px' }} onClick={(event) => handleClick(event.target.id)}>Исторические данные</Button>
//         </div>
//         <div className="header__navigation_item">
//           <Button className="header__navigation-menu_btn" variant="text" color="inherit" sx={{ width: '300px' }} onClick={() => { setIsModalOpen(true) }}>Загрузить CSV</Button>
//         </div>
//         <div className="header__navigation_item">
//           <Button className="header__navigation-menu_btn" variant="text" color="inherit" sx={{ width: '300px' }} onClick={() => {handleClickDownloadCSV()}}>Скачать CSV</Button>
//         </div>
//         <CSVUploadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />

//       </div>
//     </>
//   )
// }



function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();

  function handleClick(id) {
    switch (id) {
      case "current_mon_btn":
        navigate('/dashboard');
        break;
      case "history_mon_btn":
        navigate('/history');
        break;
      default:
        break;
    }
  }

  const handleClickDownloadCSV = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      // Вариант 1: Если используете instance (axios)
      const response = await instance.get('/api/export-to-csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Важно для файлов
      });

      // Вариант 2: Если используете fetch (раскомментируйте если нужно)
      /*
      const response = await fetch('http://localhost:8080/api/export-to-csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }

      const blob = await response.blob();
      */

      // Создаем URL для скачивания
      const blob = response.data; // Для axios
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Получаем имя файла из заголовков или используем по умолчанию
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'warehouse_report.csv';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: `Файл ${filename} успешно скачан`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Ошибка при скачивании CSV:', error);
      setSnackbar({
        open: true,
        message: `Ошибка при скачивании: ${error.response?.data?.message || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <AppBar color="default" sx={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }} position="static">
        <div className="img-logo"></div>
        <h1 className="h_header">Умный склад</h1>
        <div className="user_info">
          <p className="user_name">user name</p>
          <p className="user_role">user role</p>
          <Button variant="contained" color="secondary" sx={{ mt: '37px', mr: '10px', textDecorationStyle: 'double' }}>Выход</Button>
        </div>
      </AppBar>

      <div className='header__navigation-menu'>
        <div className="header__navigation_item">
          <Button
            id="current_mon_btn"
            className="header__navigation-menu_btn"
            variant="text"
            color="inherit"
            sx={{ width: '300px' }}
            onClick={(event) => handleClick(event.target.id)}
          >
            Текущий мониторинг
          </Button>
        </div>
        <div className="header__navigation_item">
          <Button
            id="history_mon_btn"
            className="header__navigation-menu_btn"
            variant="text"
            color="inherit"
            sx={{ width: '300px' }}
            onClick={(event) => handleClick(event.target.id)}
          >
            Исторические данные
          </Button>
        </div>
        <div className="header__navigation_item">
          <Button
            className="header__navigation-menu_btn"
            variant="text"
            color="inherit"
            sx={{ width: '300px' }}
            onClick={() => { setIsModalOpen(true) }}
          >
            Загрузить CSV
          </Button>
        </div>
        <div className="header__navigation_item">
          <Button
            className="header__navigation-menu_btn"
            variant="text"
            color="inherit"
            sx={{ width: '300px' }}
            onClick={handleClickDownloadCSV}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Скачивание...' : 'Скачать CSV'}
          </Button>
        </div>

        <CSVUploadModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default Header;

function Body() {
  return (
    <>
      <div className="body_main">
        <div className="body_map">
          <Svg />
          {/* <WarehouseMap /> */}
        </div>
        <div className="body_main-info">
          <BodyInfo />
          {/* <BodyScantable /> */}
          <BodyScant />
          <BodyAIPredict />
        </div>
      </div>
    </>
  )
}

const BodyInfo = () => {
  const theme = useTheme();
  
  const [metrics, setMetrics] = useState({
    activeRobots: 0,
    totalRobots: 0,
    scannedToday: 0,
    criticalStock: 0,
    averageBattery: 0,
    lastUpdate: null
  });
  
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [stompClient, setStompClient] = useState(null);
  const [error, setError] = useState(null);

  // Подключение к WebSocket
  const connectWebSocket = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      setConnectionState('connecting');
      
      const socket = new SockJS('http://localhost:8080/ws');
      const client = Stomp.over(socket);

      // Отключаем логи в продакшене
      client.debug = process.env.NODE_ENV === 'development' 
        ? console.log 
        : () => {};

      const headers = {
        Authorization: `Bearer ${token}`
      };

      client.connect(headers, (frame) => {
        console.log('WebSocket connected successfully');
        setConnectionState('connected');
        setStompClient(client);
        setLoading(false);

        // Подписка на топик с метриками
        client.subscribe('/topic/dashboard/metrics', (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('Received metrics data:', data);
            
            setMetrics(prev => ({
              ...prev,
              activeRobots: data.activeRobots || data.active_robots || 0,
              totalRobots: data.totalRobots || data.total_robots || 0,
              scannedToday: data.scannedToday || data.scanned_today || data.todayScans || 0,
              criticalStock: data.criticalStock || data.critical_stock || data.criticalItems || 0,
              averageBattery: data.averageBattery || data.avg_battery || data.batteryLevel || 0,
              lastUpdate: new Date()
            }));
            
            setError(null);
          } catch (error) {
            console.error('Error parsing metrics data:', error);
            setError('Ошибка обработки данных с сервера');
          }
        });

        // Подписка на топик с активностью для графика
        client.subscribe('/topic/dashboard/activity', (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('Received activity data:', data);
            
            if (Array.isArray(data)) {
              setActivityData(data);
            } else if (data.timeline && Array.isArray(data.timeline)) {
              setActivityData(data.timeline);
            } else if (data.data && Array.isArray(data.data)) {
              setActivityData(data.data);
            }
          } catch (error) {
            console.error('Error parsing activity data:', error);
          }
        });

        // Запрос начальных данных
        client.send('/app/request-metrics', {}, JSON.stringify({}));
        client.send('/app/request-activity', {}, JSON.stringify({ period: '1h' }));

      }, (error) => {
        console.error('WebSocket connection failed:', error);
        setConnectionState('error');
        setError('Ошибка подключения к серверу');
        setLoading(false);
      });

    } catch (error) {
      console.error('WebSocket setup error:', error);
      setConnectionState('error');
      setError(error.message);
      setLoading(false);
    }
  }, []);

  // Отключение WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (stompClient && stompClient.connected) {
      stompClient.disconnect();
    }
    setStompClient(null);
    setConnectionState('disconnected');
  }, [stompClient]);

  // Подключение при монтировании компонента
  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  // Интервал для периодического запроса данных
  useEffect(() => {
    if (connectionState === 'connected' && stompClient) {
      const interval = setInterval(() => {
        stompClient.send('/app/request-metrics', {}, JSON.stringify({}));
      }, 5000); // Запрос каждые 5 секунд

      return () => clearInterval(interval);
    }
  }, [connectionState, stompClient]);

  // Компонент карточки метрики
  const MetricCard = ({ 
    icon, 
    value, 
    label, 
    subtitle, 
    color = 'primary',
    progress 
  }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette[color].light}15, ${theme.palette[color].main}08)`,
        border: `1px solid ${theme.palette[color].light}30`,
        position: 'relative',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[2]
        }
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: progress ? 0.5 : 0 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: `${theme.palette[color].main}15`,
              color: theme.palette[color].main,
              mr: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="h6" 
              component="div" 
              fontWeight="bold" 
              color={theme.palette[color].main}
              sx={{ fontSize: '1.25rem' }}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
              {label}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        
        {progress && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              mt: 0.5,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: `${theme.palette[color].main}20`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette[color].main
              }
            }}
          />
        )}
        
        {/* Индикатор реального времени */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <Chip
            icon={connectionState === 'connected' ? <Wifi /> : <WifiOff />}
            label={connectionState === 'connected' ? 'Live' : 'Offline'}
            size="small"
            color={connectionState === 'connected' ? 'success' : 'error'}
            variant="outlined"
            sx={{ height: 20, fontSize: '0.6rem', '& .MuiChip-icon': { fontSize: '0.8rem' } }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  // Компонент графика активности
  const ActivityChart = () => (
    <Card 
      sx={{ 
        mt: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main', fontSize: 22 }} />
            <Box>
              <Typography variant="h6" component="h3" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                Активность роботов
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Данные за последний час • Обновление в реальном времени
              </Typography>
            </Box>
          </Box>
          <Chip 
            icon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            label="Real-time" 
            size="small" 
            color={connectionState === 'connected' ? 'success' : 'error'}
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
        </Box>
        
        {activityData.length > 0 ? (
          <Box sx={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="2 2" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme.palette.text.secondary}
                  fontSize={10}
                  tickMargin={6}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  fontSize={10}
                  tickMargin={6}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[2],
                    fontSize: '0.8rem'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="scans" 
                  stroke={theme.palette.secondary.main}
                  fill={theme.palette.secondary.main + '20'}
                  strokeWidth={1.5}
                  name="Сканирования"
                />
                <Line 
                  type="monotone" 
                  dataKey="activeRobots" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={2}
                  dot={{ fill: theme.palette.primary.main, strokeWidth: 1.5, r: 3 }}
                  activeDot={{ r: 4, strokeWidth: 1.5 }}
                  name="Активных роботов"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {connectionState === 'connected' ? 'Ожидание данных...' : 'Нет подключения'}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.65rem' }}>
            ● Активные роботы
          </Typography>
          <Typography variant="caption" color="secondary.main" sx={{ fontSize: '0.65rem' }}>
            ● Сканирования (область)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  // Функция для переподключения
  const handleReconnect = () => {
    disconnectWebSocket();
    setTimeout(() => {
      connectWebSocket();
    }, 1000);
  };

  if (loading) {
    return (
      <Box 
        className="real-time-stats" 
        sx={{ 
          width: '745px',
          maxWidth: '100%'
        }}
      >
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
              <Box sx={{ textAlign: 'center' }}>
                <LinearProgress sx={{ width: 150, mb: 1.5, height: 4 }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  Подключение к серверу...
                </Typography>
                <Chip 
                  icon={<WifiOff sx={{ fontSize: '0.8rem' }} />}
                  label={connectionState} 
                  size="small" 
                  color="warning"
                  sx={{ mt: 0.5, fontSize: '0.7rem', height: 22 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box 
      className="real-time-stats" 
      sx={{ 
        width: '745px',
        maxWidth: '100%'
      }}
    >
      {/* Заголовок и статус */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2" fontWeight="bold" sx={{ fontSize: '1.25rem' }}>
          📊 Статистика в реальном времени
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={connectionState === 'connected' ? <Wifi sx={{ fontSize: '0.8rem' }} /> : <WifiOff sx={{ fontSize: '0.8rem' }} />}
            label={`WS: ${connectionState}`}
            color={connectionState === 'connected' ? 'success' : 'error'}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
          {metrics.lastUpdate && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {metrics.lastUpdate.toLocaleTimeString('ru-RU')}
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2, fontSize: '0.8rem', py: 0.5 }}
          action={
            <Button color="inherit" size="small" onClick={handleReconnect} sx={{ fontSize: '0.7rem', minWidth: 'auto' }}>
              Переподключить
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Карточки с метриками */}
      <Grid container spacing={0}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<RobotIcon sx={{ fontSize: '1.2rem' }} />}
            value={`${metrics.activeRobots}/${metrics.totalRobots}`}
            label="Активных роботов"
            subtitle="в работе"
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<Inventory sx={{ fontSize: '1.2rem' }} />}
            value={metrics.scannedToday.toLocaleString()}
            label="Проверено сегодня"
            subtitle="позиций"
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<Warning sx={{ fontSize: '1.2rem' }} />}
            value={metrics.criticalStock}
            label="Критических остатков"
            subtitle="SKU"
            color="error"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<BatteryChargingFull sx={{ fontSize: '1.2rem' }} />}
            value={`${metrics.averageBattery}%`}
            label="Средний заряд"
            subtitle="батарей"
            color="warning"
            progress={metrics.averageBattery}
          />
        </Grid>
      </Grid>

      {/* График активности */}
      <ActivityChart />

      {/* Информация о подключении */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {connectionState === 'connected' 
            ? 'Данные обновляются в реальном времени через WebSocket' 
            : 'Отсутствует подключение к серверу'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {connectionState === 'connected' ? '🟢' : '🔴'}
        </Typography>
      </Box>
    </Box>
  );
};


// function BodyScantable() {
//   const [robots, setRobots] = useState({});
//   const dispatch = useDispatch();





//   let HttpsWebSocket = new WebSocket('url');

//   useEffect(() => {
//     console.log("устанавливаем соеденение websocket");
//     HttpsWebSocket.onopen = () => {
//       console.log("соединение websocket установлено");
//     };
//   })

//   function handleClick() {
//     try {
//       HttpsWebSocket.onmessage = (event) => {
//         setRobots(() => [event.data]);
//         dispatch(loadRobotsData(robots.data));
//       }
//     }
//     catch (e) {
//       return e;
//     }
//   }

//   return (
//     <div className="scans-container body_info">
//       <div className="scans-header">
//         <h3>Последние сканирования</h3>
//         <Button variant="outlined" onClick={handleClick}>'▶' '❚❚'</Button>
//       </div>
//       <div className="scans-table">
//         <table>
//           <thead>
//             <tr>
//               <th>Время</th>
//               <th>ID робота</th>
//               <th>Зона</th>
//               <th>Товар</th>
//               <th>Количество</th>
//               <th>Статус</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td>{useSelector(state => state.robots.allRobots.robot_01.last_update)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_01.id)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_01.current_zone)}</td>
//               <td>scan product</td>
//               <td>scan quantity</td>
//               <td>
//                 <span className='status-badge'>
//                   {useSelector(state => state.robots.allRobots.robot_01.status)}
//                 </span>
//               </td>
//             </tr>
//             <tr>
//               <td>{useSelector(state => state.robots.allRobots.robot_02.last_update)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_02.id)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_02.current_zone)}</td>
//               <td>scan product</td>
//               <td>scan quantity</td>
//               <td>
//                 <span className='status-badge'>
//                   {useSelector(state => state.robots.allRobots.robot_02.status)}
//                 </span>
//               </td>
//             </tr>
//             <tr>
//               <td>{useSelector(state => state.robots.allRobots.robot_03.last_update)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_03.id)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_03.current_zone)}</td>
//               <td>scan product</td>
//               <td>scan quantity</td>
//               <td>
//                 <span className='status-badge'>
//                   {useSelector(state => state.robots.allRobots.robot_04.status)}
//                 </span>
//               </td>
//             </tr>
//             <tr>
//               <td>{useSelector(state => state.robots.allRobots.robot_04.last_update)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_04.id)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_04.current_zone)}</td>
//               <td>scan product</td>
//               <td>scan quantity</td>
//               <td>
//                 <span className='status-badge'>
//                   {useSelector(state => state.robots.allRobots.robot_05.status)}
//                 </span>
//               </td>
//             </tr>
//             <tr>
//               <td>{useSelector(state => state.robots.allRobots.robot_05.last_update)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_05.id)}</td>
//               <td>{useSelector(state => state.robots.allRobots.robot_05.current_zone)}</td>
//               <td>scan product</td>
//               <td>scan quantity</td>
//               <td>
//                 <span className='status-badge'>
//                   {useSelector(state => state.robots.allRobots.robot_05.status)}
//                 </span>
//               </td>
//             </tr>
//           </tbody>
//         </table>
//         <div />
//       </div>
//     </div>
//   )
// }


// function BodyAIPredict() {
//   return (
//     <div className="ai-container body_info">
//       <div className="ai-header">
//         <h3>Прогноз ИИ на следующие 7 дней</h3>
//         <Button variant="outlined">Обновить прогноз</Button>
//       </div>
//       <div className="predictions-list">
//         <div className="prediction-item">
//           <div className="prediction-main">
//             <div className="product-name">prediction name</div>
//             <div className="confidence">prediction confidience% достоверность</div>
//           </div>
//           <div className="prediction-details">
//             <div>Текущий остаток: </div>
//             <div>Прогноз исчерпания: </div>
//             <div>Рекомендуемый заказ: </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

const BodyAIPredict = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Моковые данные для демонстрации
  const mockPredictions = [
    {
      id: 1,
      name: "Смартфон Samsung Galaxy S23",
      currentStock: 12,
      depletionDate: "2024-01-15",
      recommendedOrder: 50,
      confidence: 87
    },
    {
      id: 2,
      name: "Ноутбук Lenovo ThinkPad X1",
      currentStock: 8,
      depletionDate: "2024-01-12",
      recommendedOrder: 25,
      confidence: 92
    },
    {
      id: 3,
      name: "Наушники Sony WH-1000XM5",
      currentStock: 5,
      depletionDate: "2024-01-10",
      recommendedOrder: 30,
      confidence: 78
    },
    {
      id: 4,
      name: "Планшет iPad Air 5",
      currentStock: 3,
      depletionDate: "2024-01-08",
      recommendedOrder: 20,
      confidence: 85
    },
    {
      id: 5,
      name: "Умные часы Apple Watch Series 9",
      currentStock: 7,
      depletionDate: "2024-01-14",
      recommendedOrder: 35,
      confidence: 81
    }
  ];

  // Функция для получения прогнозов от API
  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Замените URL на ваш реальный эндпоинт API
      const response = await instance.get('/api/ai-prediction', {
        params: {
          period: 7 // Прогноз на 7 дней
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setPredictions(response.data.predictions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Ошибка при получении прогнозов:', err);
      setError('Не удалось загрузить прогнозы. Используются демо-данные.');
      // Используем моковые данные в случае ошибки
      setPredictions(mockPredictions);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Функция для обновления конкретного прогноза
  const updateSinglePrediction = async (productId) => {
    try {
      const response = await instance.post(
        `/ai/update-prediction/${productId}`
      );

      // Обновляем конкретный прогноз в списке
      setPredictions(prev =>
        prev.map(pred =>
          pred.id === productId ? response.data.prediction : pred
        )
      );
    } catch (err) {
      console.error('Ошибка при обновлении прогноза:', err);
      setError('Ошибка при обновлении прогноза');
    }
  };

  // Загружаем прогнозы при монтировании компонента
  useEffect(() => {
    fetchPredictions();
  }, []);

  // Функция для определения цвета индикатора достоверности
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return '#4caf50'; // Высокая достоверность - зеленый
    if (confidence >= 60) return '#ff9800'; // Средняя достоверность - оранжевый
    return '#f44336'; // Низкая достоверность - красный
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="ai-container body_info">
      <div className="ai-header">
        <div className="ai-title-section">
          <TrendingUp className="ai-icon" />
          <h3>Прогноз ИИ на следующие 7 дней</h3>
        </div>
        <div className="ai-controls">
          {lastUpdated && (
            <div className="last-updated">
              Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
            </div>
          )}
          <Button
            variant="outlined"
            onClick={fetchPredictions}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <TrendingUp />}
          >
            {loading ? 'Обновление...' : 'Обновить прогноз'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert severity="warning" className="ai-alert">
          {error}
        </Alert>
      )}

      <div className="predictions-list">
        {predictions.map((prediction) => (
          <div key={prediction.id} className="prediction-item">
            <div className="prediction-main">
              <div className="product-info">
                <Warning className="warning-icon" />
                <div className="product-name">{prediction.name}</div>
              </div>
              <div className="confidence-section">
                <div
                  className="confidence-indicator"
                  style={{ backgroundColor: getConfidenceColor(prediction.confidence) }}
                >
                  {prediction.confidence}%
                </div>
                <div className="confidence-label">достоверность</div>
              </div>
            </div>

            <div className="prediction-details">
              <div className="detail-item">
                <Inventory className="detail-icon" />
                <span>Текущий остаток: </span>
                <strong>{prediction.currentStock} шт.</strong>
              </div>
              <div className="detail-item">
                <CalendarToday className="detail-icon" />
                <span>Прогноз исчерпания: </span>
                <strong>{formatDate(prediction.depletionDate)}</strong>
              </div>
              <div className="detail-item">
                <ShoppingCart className="detail-icon" />
                <span>Рекомендуемый заказ: </span>
                <strong className="recommended-order">
                  {prediction.recommendedOrder} шт.
                </strong>
              </div>
            </div>

            <div className="prediction-actions">
              <Button
                size="small"
                variant="text"
              // onClick={() => updateSinglePrediction(prediction.id)}
              >
                Обновить прогноз
              </Button>
            </div>
          </div>
        ))}
      </div>

      {predictions.length === 0 && !loading && (
        <div className="no-predictions">
          Нет данных для прогноза
        </div>
      )}
    </div>
  );
};


export { Input, Button, LinkA, Header, Svg, Body };

