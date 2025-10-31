import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import { instance } from '../../axios/axios';
import { login } from '../../store/slices/auth';
import { useDispatch } from 'react-redux';

const AuthRootComponent = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userInfo = {
                email,
                password
            };
            const user = await instance.post('api/auth/login', userInfo);
            dispatch(login(user.data));
            navigate('/dashboard');

        } catch (e) {
            return e;
        }
        
    };
    return (
        <form className='form' onSubmit={handleSubmit}>
            <fieldset>
                {location.pathname === '/login' ? <LoginPage setEmail={setEmail} setPassword={setPassword} /> : location.pathname === '/register' ? <RegisterPage /> : null}
            </fieldset>
        </form>
        

    )
}

export default AuthRootComponent