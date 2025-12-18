// src/components/TutorLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import "./Login.css"; 
import { useNavigate } from 'react-router-dom';

function TutorLogin({ onTutorLogin }) {
  const [credentials, setCredentials] = useState({
    empId: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!credentials.empId || !credentials.password) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/tutor/login', {
        empId: credentials.empId,
        password: credentials.password
      });
      
      if (onTutorLogin) onTutorLogin(response.data.tutor);
      navigate(`/tutor/${response.data.tutor._id}`);
    } catch (e) {
      alert('Login failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotRegistered = () => {
    navigate('/tutor/register');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="login-icon">
          <i className="fas fa-user-tie"></i>
        </div>
        <h1 className="login-title">Tutor Access</h1>
        <p className="login-subtitle">Enter your credentials to continue</p>
      </div>

      <div className="input-group">
        <input
          className="login-input"
          type="text"
          name="empId"
          value={credentials.empId}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Employee ID"
          required
        />
      </div>

      <div className="input-group">
        <input
          className="login-input"
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder="Password"
          required
        />
      </div>

      <button 
        className={`login-submit ${isLoading ? 'loading' : ''}`} 
        onClick={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? '' : 'Sign In'}
      </button>

      <button className="not-registered-btn" onClick={handleNotRegistered}>
        Create Tutor Account
      </button>

   
    </div>
    
  );
}

export default TutorLogin;