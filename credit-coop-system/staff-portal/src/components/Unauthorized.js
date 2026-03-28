import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '1rem'
      }}>
        🚫
      </div>
      <h1 style={{
        fontSize: '2rem',
        color: 'var(--gray-800)',
        marginBottom: '1rem'
      }}>
        Access Denied
      </h1>
      <p style={{
        fontSize: '1.1rem',
        color: 'var(--gray-600)',
        marginBottom: '2rem',
        maxWidth: '500px'
      }}>
        You don't have permission to access this page. Your current role doesn't allow access to this section.
      </p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="btn btn-primary"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Unauthorized;
