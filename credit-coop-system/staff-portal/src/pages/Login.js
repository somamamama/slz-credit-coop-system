import React, { Fragment, useState } from 'react';
import './Login.css';

const Login = ({ setAuth }) => {
  const [inputs, setInputs] = useState({
    employee_number: "",
    password: ""
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { employee_number, password } = inputs;

  const onChange = e => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
    setError('');
  }

  const onSubmitForm = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const body = { employee_number, password };
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(body)
      });

      const parseRes = await response.json();
      
      if (response.ok) {
        localStorage.setItem("token", parseRes.token);
        // Store user info including role
        if (parseRes.user) {
          localStorage.setItem("userInfo", JSON.stringify(parseRes.user));
        }
        setAuth(true);
      } else {
        setError(parseRes.error || 'Login failed');
      }
    } catch (err) {
      console.error(err.message);
      setError('Network error. Please try again.');
    }
    
    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-section">
            <img
              src={process.env.PUBLIC_URL + '/logo192.png'}
              alt="CreditCoop logo"
              className="logo-img"
            />
            <div className="logo-text">
              <h1>CreditCoop</h1>
              <span className="logo-subtitle">Staff Portal</span>
            </div>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmitForm}>
          <h2>Staff Login</h2>
          <p className="login-description">Access the Credit Cooperative management system</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="employee_number">Employee Number</label>
            <input
              type="text"
              id="employee_number"
              name="employee_number"
              value={employee_number}
              onChange={onChange}
              className="form-control"
              placeholder="Enter your employee number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              className="form-control"
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg login-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;
