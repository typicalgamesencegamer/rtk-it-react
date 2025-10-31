import { Button, Checkbox, Link, TextField } from "@mui/material";

function LoginPage(props) {
    const {setEmail, setPassword} = props;

    return (
    <>
      <div className="img-logo"></div>
      <TextField id="outlined-basic1" size='small' type='email' label="Login" variant="outlined" onChange={(event) => {setEmail(event.target.value)}}
        sx={{}}
        margin="normal"
        ></TextField>
      <TextField id="outlined-basic" size="small" type='password' label="Password" variant="outlined" onChange={(event) => {setPassword(event.target.value)}}
        margin="normal"
        
        ></TextField>
      <div className='remember_me'>
        <Checkbox color="primary"></Checkbox>
        <label>Запомнить меня</label>
      </div>
      <Button variant="contained" color="primary" type="submit">Войти</Button>
      <Link href='#' underline="hover">Забыли пароль?</Link>
    </>
    )
}

export default LoginPage;