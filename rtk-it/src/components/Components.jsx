import React, { useEffect, useState, useCallback} from "react";
import { useLocation, useNavigate } from "react-router";
import Svg from "./svg3";
import { AppBar, Box, Button, Typography, } from "@mui/material";
import CSVUploadModal from "./CSVModal";
import { useDispatch, useSelector } from "react-redux";
import { loadRobotsData } from "../store/slices/robots";
import BodyScantable from "./NOUSE_BodyScantable";
import BodyScant from "./bodyScant";
import BodyAIPredict from "./BodyAIPrediction";
import BodyInfo from "./BodyInfo";
import WarehouseMap from "./NOUSE_newSvg";
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



function Header() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleClick(id) {
    
    switch (id) {
      case "current_mon_btn":
        navigate('/dashboard');
        break;
      case "history_mon_btn":
        dispatch(authHistory());
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

  const user = useSelector(state => state.auth.user);

  return (
    <>
      <AppBar color="default" sx={{
        flexDirection: 'row',
        justifyContent: 'space-between'
      }} position="static">
        <div className="img-logo"></div>
        <h1 className="h_header">Умный склад</h1>
        <div className="user_info">
          <p className="user_name">{user.name}</p>
          <p className="user_role">{user.role}</p>
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

export default Header;
export { Input, Button, LinkA, Header, Svg, Body };



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





