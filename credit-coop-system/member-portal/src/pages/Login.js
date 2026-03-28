import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    memberNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.memberNumber, formData.password);
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <img src="/logo192.png" alt="CreditCoop" className="logo-img" />
            <h1>CreditCoop</h1>
          </div>
          <p>Member Portal Access</p>
        </div>

        <div className="login-card card card-lg">
          <h2>Welcome Back</h2>
          <p className="text-gray mb-4">Sign in to access your account</p>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="memberNumber">Member Number</label>
              <input
                type="text"
                id="memberNumber"
                name="memberNumber"
                value={formData.memberNumber}
                onChange={handleChange}
                placeholder="Enter your member number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="login-help">
              <a href="#forgot" className="text-primary">Forgot your password?</a>
              <span className="separator">•</span>
              <a href="#contact" className="text-primary">Need help?</a>
            </div>
          </form>
        </div>

        <div className="login-footer">
          <p>&copy; 2025 CreditCoop. All rights reserved.</p>
          <p>Your financial partner since 1995</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
