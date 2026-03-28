import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  // Ensure proper navigation when the user does not have an active loan
  const handleLoanAccess = () => {
    if (user?.loan?.amount > 0) {
      toast.error('You have an active loan. Loan application is disabled.', {
        position: toast.POSITION.TOP_RIGHT,
        autoClose: 5000,
      });
    } else {
      navigate('/loans'); // Navigate to the loan application page
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <img src="/logo192.png" alt="CreditCoop" className="logo-img" />
                <span className="logo-text">CreditCoop</span>
              </div>
            </div>

            <div className="header-right">
              <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
                <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link
                  to="#"
                  className="nav-link"
                  onClick={handleLoanAccess}
                >
                  Loans
                </Link>
                <Link to="/loan-tracker" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Loan Tracker</Link>
                <Link to="/payment-dues" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Payment Dues</Link>
                <Link to="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                  Logout
                </button>
              </nav>

              <div className="user-avatar">
                <div className="avatar-circle">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              </div>

              <button 
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
