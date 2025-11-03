import {Route, Routes, Navigate} from 'react-router-dom';
import './App.css';

import HomePage from './pages/HomePage';
import PrivateRoute from './router/privateRoute';
import DashboardPage from './pages/DashboardPage';
import AuthRootComponent from './pages/auth/AuthRootComponent';
import HistoryPage from './pages/HistoryPage';



function App() {
  return (
    <div className="App">
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path='dashboard' element={<DashboardPage />} />
          <Route path='history' element={<HistoryPage />}></Route>
        </Route>


        <Route path='/' element={<Navigate to="/login" replace/>} />
        <Route path="login" element={<AuthRootComponent />} />
        <Route path="register" element={<AuthRootComponent />} />
      </Routes>
      
    </div>
  );
}



export default App;
