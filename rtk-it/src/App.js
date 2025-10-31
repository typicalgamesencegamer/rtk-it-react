import {Route, Routes} from 'react-router-dom';
import './App.css';

import HomePage from './pages/HomePage';
import PrivateRoute from './router/privateRoute';
import DashboardPage from './pages/DashboardPage';
import AuthRootComponent from './pages/auth/AuthRootComponent';
import HystoryPage from './pages/HystoryPage';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path='dashboard' element={<DashboardPage />} />
          <Route path='history' element={<HystoryPage />}></Route>
        </Route>


        <Route path='/' element={<HomePage />} />
        <Route path="login" element={<AuthRootComponent />} />
        <Route path="register" element={<AuthRootComponent />} />
      </Routes>
      
    </div>
  );
}



export default App;
