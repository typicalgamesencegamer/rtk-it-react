import React from 'react'
import { Input, Button } from "../../components/Components";


const RegisterPage = (props) => {
    const {setEmail, setPassword} = props;

  return (
    <>
      <img src='images/roslogo.png' alt='roslogo'></img>
      <Input type='text' placeholder='Логин' id='input_login'></Input>
      <Input type='password' placeholder='Пароль' id='input_password'></Input>
      <Button type='submit' className='primary_button' id='btn_submit'></Button>
      </>
  )
}

export default RegisterPage