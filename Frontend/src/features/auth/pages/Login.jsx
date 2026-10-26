import React, { useState } from 'react'
import "../auth.form.scss"
import { useNavigate , Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const {  handleLogin }=useAuth() 
    const {loading }=useAuth()
    const navigate = useNavigate();
    const [email,setEmail]=useState("")
    const [password,setPassword] = useState("")

    const handleSubmit = async (e) =>{
        e.preventDefault()
  try {
    const response = await handleLogin({ email, password });
    console.log("Login response:", response); //Debug log to inspect the response object

    // Extract token depending on how your API/Auth Hook wraps it
    const token = response?.token || response?.data?.token ||localStorage.getItem("token");;

    if (token) {
      console.log("Token saved successfully!");
    } else {
      console.error("Token missing in login response!");
    }

    navigate("/");
  } catch (error) {
    // console.error("Login failed:", error);
    console.log(error);
    alert("Invalid Credentials");
  }
};

    if (loading){
        return (<main><h2>Loading.....</h2></main>)
    }

  return (
    <main>

        
        <div className='form-container'>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div className='input-group'>
                    <label htmlFor='email'>Email</label>
                <input
                    onChange={(e)=>{setEmail(e.target.value) }}
                     type="email" id="email" placeholder='Enter email address'/>
                </div>


                <div className='input-group'>
                <label htmlFor='password'>Password</label>
                <input 
                    onChange = {(e)=>{ setPassword(e.target.value) }}
                    type="password" id="password" placeholder='Enter password'/>
                </div>

            <button className='button primary-button'>Login</button>
            </form>
            <p>Don't have an account ?  <Link to={"/register"}>Register</Link> </p>
        </div>
    </main>
  )
}

export default Login
