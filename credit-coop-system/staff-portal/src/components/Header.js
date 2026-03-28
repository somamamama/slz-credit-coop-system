import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ setAuth }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("http://localhost:5000/auth/profile", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "token": localStorage.token 
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUserInfo(userData);
        } else {
          console.error('Failed to fetch user info');
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.token) {
      fetchUserInfo();
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
    setAuth(false);
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'manager': 'Manager',
      'loan_officer': 'Loan Officer',
      'cashier': 'Cashier',
      'it_admin': 'IT Administrator'
    };
    return roleMap[role] || 'Staff';
  };

  const getUserInitials = (name) => {
    if (!name) return '👤';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <header className="staff-header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="hamburger-btn"
            aria-label="Toggle menu"
            onClick={() => {
              document.body.classList.toggle('sidebar-open');
            }}
          >
            ☰
          </button>
          <div className="logo-section">
            <div className="logo-icon">⚛️</div>
            <div className="logo-text">
              <h1>CreditCoop</h1>
              <span className="logo-subtitle">Staff Portal</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="staff-info">
            {loading ? (
              <div className="staff-details">
                <span className="staff-name">Loading...</span>
                <span className="staff-role">Please wait</span>
              </div>
            ) : userInfo ? (
              <div className="staff-details">
                <span className="staff-name">{userInfo.name}</span>
                <span className="staff-role">
                  {getRoleDisplayName(userInfo.role)} • 
                  <span className={`role-badge-header role-${userInfo.role}`}>
                    {userInfo.role.replace('_', ' ').toUpperCase()}
                  </span>
                </span>
              </div>
            ) : (
              <div className="staff-details">
                <span className="staff-name">Staff User</span>
                <span className="staff-role">Unknown Role</span>
              </div>
            )}
            <div className="staff-avatar">
              {userInfo ? getUserInitials(userInfo.name) : '👤'}
            </div>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
