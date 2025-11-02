import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import Svg from "./svg2";
import { AppBar, Box, Button, Typography } from "@mui/material";
import CSVUploadModal from "./CSVModal";
import { useDispatch, useSelector } from "react-redux";
import { loadRobotsData } from "../store/slices/robots";
import BodyScantable from "./BodyScantable";
import BodyScant from "./bodyScant";
import WarehouseMap from "./newSvg";
import { instance } from "../axios/axios";
import { 
  Snackbar, 
  Alert,
  CircularProgress 
} from '@mui/material';

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

function BodyInfo() {
  return (
    <div className="body_info">
      <div className="stats-container">
        <h3>Статистика в реальном времени</h3>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">14 </div>
            <div className="metric-label">Активных роботов</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">14 </div>
            <div className="metric-label">Проверено сегодня</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">14 </div>
            <div className="metric-label">Критических остатков</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">14 </div>
            <div className="metric-label">Средний заряд</div>
          </div>
        </div>
        <div className="activity-chart">
          <div className="chart-placeholder">
            График активности роботов (последний час)
          </div>
        </div>
      </div>
    </div>
  )
}

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


function BodyAIPredict() {
  return (
    <div className="ai-container body_info">
      <div className="ai-header">
        <h3>Прогноз ИИ на следующие 7 дней</h3>
        <Button variant="outlined">Обновить прогноз</Button>
      </div>
      <div className="predictions-list">
        <div className="prediction-item">
          <div className="prediction-main">
            <div className="product-name">prediction name</div>
            <div className="confidence">prediction confidience% достоверность</div>
          </div>
          <div className="prediction-details">
            <div>Текущий остаток: </div>
            <div>Прогноз исчерпания: </div>
            <div>Рекомендуемый заказ: </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export { Input, Button, LinkA, Header, Svg, Body };

{/* <svg width="811" height="1521" xmlns="http://www.w3.org/2000/svg">
      <style className="label"> </style>
      
      <text x="40" y="15" class="label">A</text>
      <text x="70" y="15" class="label">B</text>
      <text x="100" y="15" class="label">C</text>
      <text x="130" y="15" class="label">D</text>
      <text x="160" y="15" class="label">E</text>
      <text x="190" y="15" class="label">F</text>
      <text x="220" y="15" class="label">G</text>
      <text x="250" y="15" class="label">H</text>
      <text x="280" y="15" class="label">I</text>
      <text x="310" y="15" class="label">J</text>
      <text x="340" y="15" class="label">K</text>
      <text x="370" y="15" class="label">L</text>
      <text x="400" y="15" class="label">M</text>
      <text x="430" y="15" class="label">N</text>
      <text x="460" y="15" class="label">O</text>
      <text x="490" y="15" class="label">P</text>
      <text x="520" y="15" class="label">Q</text>
      <text x="550" y="15" class="label">R</text>
      <text x="580" y="15" class="label">S</text>
      <text x="610" y="15" class="label">T</text>
      <text x="640" y="15" class="label">U</text>
      <text x="670" y="15" class="label">V</text>
      <text x="700" y="15" class="label">W</text>
      <text x="730" y="15" class="label">X</text>
      <text x="760" y="15" class="label">Y</text>
      <text x="790" y="15" class="label">Z</text>

      <text x="5" y="45" class="label">1</text>
      <text x="5" y="75" class="label">2</text>
      <text x="5" y="105" class="label">3</text>
      <text x="5" y="135" class="label">4</text>
      <text x="5" y="165" class="label">5</text>
      <text x="5" y="195" class="label">6</text>
      <text x="5" y="225" class="label">7</text>
      <text x="5" y="255" class="label">8</text>
      <text x="5" y="285" class="label">9</text>
      <text x="5" y="315" class="label">10</text>
      <text x="5" y="345" class="label">11</text>
      <text x="5" y="375" class="label">12</text>
      <text x="5" y="405" class="label">13</text>
      <text x="5" y="435" class="label">14</text>
      <text x="5" y="465" class="label">15</text>
      <text x="5" y="495" class="label">16</text>
      <text x="5" y="525" class="label">17</text>
      <text x="5" y="555" class="label">18</text>
      <text x="5" y="585" class="label">19</text>
      <text x="5" y="615" class="label">20</text>
      <text x="5" y="645" class="label">21</text>
      <text x="5" y="675" class="label">22</text>
      <text x="5" y="705" class="label">23</text>
      <text x="5" y="735" class="label">24</text>
      <text x="5" y="765" class="label">25</text>
      <text x="5" y="795" class="label">26</text>
      <text x="5" y="825" class="label">27</text>
      <text x="5" y="855" class="label">28</text>
      <text x="5" y="885" class="label">29</text>
      <text x="5" y="915" class="label">30</text>
      <text x="5" y="945" class="label">31</text>
      <text x="5" y="975" class="label">32</text>
      <text x="5" y="1005" class="label">33</text>
      <text x="5" y="1035" class="label">34</text>
      <text x="5" y="1065" class="label">35</text>
      <text x="5" y="1095" class="label">36</text>
      <text x="5" y="1125" class="label">37</text>
      <text x="5" y="1155" class="label">38</text>
      <text x="5" y="1185" class="label">39</text>
      <text x="5" y="1215" class="label">40</text>
      <text x="5" y="1245" class="label">41</text>
      <text x="5" y="1275" class="label">42</text>
      <text x="5" y="1305" class="label">43</text>
      <text x="5" y="1335" class="label">44</text>
      <text x="5" y="1365" class="label">45</text>
      <text x="5" y="1395" class="label">46</text>
      <text x="5" y="1425" class="label">47</text>
      <text x="5" y="1455" class="label">48</text>
      <text x="5" y="1485" class="label">49</text>
      <text x="5" y="1515" class="label">50</text>
      
      
      <g stroke="black" stroke-width="1">
        
        <line x1="30" y1="20" x2="810" y2="20"/>
        <line x1="30" y1="50" x2="810" y2="50"/>
        <line x1="30" y1="80" x2="810" y2="80"/>
        <line x1="30" y1="110" x2="810" y2="110"/>
        <line x1="30" y1="140" x2="810" y2="140"/>
        <line x1="30" y1="170" x2="810" y2="170"/>
        <line x1="30" y1="200" x2="810" y2="200"/>
        <line x1="30" y1="230" x2="810" y2="230"/>
        <line x1="30" y1="260" x2="810" y2="260"/>
        <line x1="30" y1="290" x2="810" y2="290"/>
        <line x1="30" y1="320" x2="810" y2="320"/>
        <line x1="30" y1="350" x2="810" y2="350"/>
        <line x1="30" y1="380" x2="810" y2="380"/>
        <line x1="30" y1="410" x2="810" y2="410"/>
        <line x1="30" y1="440" x2="810" y2="440"/>
        <line x1="30" y1="470" x2="810" y2="470"/>
        <line x1="30" y1="500" x2="810" y2="500"/>
        <line x1="30" y1="530" x2="810" y2="530"/>
        <line x1="30" y1="560" x2="810" y2="560"/>
        <line x1="30" y1="590" x2="810" y2="590"/>
        <line x1="30" y1="620" x2="810" y2="620"/>
        <line x1="30" y1="650" x2="810" y2="650"/>
        <line x1="30" y1="680" x2="810" y2="680"/>
        <line x1="30" y1="710" x2="810" y2="710"/>
        <line x1="30" y1="740" x2="810" y2="740"/>
        <line x1="30" y1="770" x2="810" y2="770"/>
        <line x1="30" y1="800" x2="810" y2="800"/>
        <line x1="30" y1="830" x2="810" y2="830"/>
        <line x1="30" y1="860" x2="810" y2="860"/>
        <line x1="30" y1="890" x2="810" y2="890"/>
        <line x1="30" y1="920" x2="810" y2="920"/>
        <line x1="30" y1="950" x2="810" y2="950"/>
        <line x1="30" y1="980" x2="810" y2="980"/>
        <line x1="30" y1="1010" x2="810" y2="1010"/>
        <line x1="30" y1="1040" x2="810" y2="1040"/>
        <line x1="30" y1="1070" x2="810" y2="1070"/>
        <line x1="30" y1="1100" x2="810" y2="1100"/>
        <line x1="30" y1="1130" x2="810" y2="1130"/>
        <line x1="30" y1="1160" x2="810" y2="1160"/>
        <line x1="30" y1="1190" x2="810" y2="1190"/>
        <line x1="30" y1="1220" x2="810" y2="1220"/>
        <line x1="30" y1="1250" x2="810" y2="1250"/>
        <line x1="30" y1="1280" x2="810" y2="1280"/>
        <line x1="30" y1="1310" x2="810" y2="1310"/>
        <line x1="30" y1="1340" x2="810" y2="1340"/>
        <line x1="30" y1="1370" x2="810" y2="1370"/>
        <line x1="30" y1="1400" x2="810" y2="1400"/>
        <line x1="30" y1="1430" x2="810" y2="1430"/>
        <line x1="30" y1="1460" x2="810" y2="1460"/>
        <line x1="30" y1="1490" x2="810" y2="1490"/>
        <line x1="30" y1="1520" x2="810" y2="1520"/>
        
        
        <line x1="0" y1="20" x2="0" y2="1520"/>
        <line x1="30" y1="20" x2="30" y2="1520"/>
        <line x1="60" y1="20" x2="60" y2="1520"/>
        <line x1="90" y1="20" x2="90" y2="1520"/>
        <line x1="120" y1="20" x2="120" y2="1520"/>
        <line x1="150" y1="20" x2="150" y2="1520"/>
        <line x1="180" y1="20" x2="180" y2="1520"/>
        <line x1="210" y1="20" x2="210" y2="1520"/>
        <line x1="240" y1="20" x2="240" y2="1520"/>
        <line x1="270" y1="20" x2="270" y2="1520"/>
        <line x1="300" y1="20" x2="300" y2="1520"/>
        <line x1="330" y1="20" x2="330" y2="1520"/>
        <line x1="360" y1="20" x2="360" y2="1520"/>
        <line x1="390" y1="20" x2="390" y2="1520"/>
        <line x1="420" y1="20" x2="420" y2="1520"/>
        <line x1="450" y1="20" x2="450" y2="1520"/>
        <line x1="480" y1="20" x2="480" y2="1520"/>
        <line x1="510" y1="20" x2="510" y2="1520"/>
        <line x1="540" y1="20" x2="540" y2="1520"/>
        <line x1="570" y1="20" x2="570" y2="1520"/>
        <line x1="600" y1="20" x2="600" y2="1520"/>
        <line x1="630" y1="20" x2="630" y2="1520"/>
        <line x1="660" y1="20" x2="660" y2="1520"/>
        <line x1="690" y1="20" x2="690" y2="1520"/>
        <line x1="720" y1="20" x2="720" y2="1520"/>
        <line x1="750" y1="20" x2="750" y2="1520"/>
        <line x1="780" y1="20" x2="780" y2="1520"/>
        <line x1="810" y1="20" x2="810" y2="1520"/>
      </g>
    </svg>  */}