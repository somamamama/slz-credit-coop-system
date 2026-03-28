import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './PaymentDues.css';

const PaymentDues = () => {
  const navigate = useNavigate();
  const [paymentDues, setPaymentDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue':
        return 'overdue';
      case 'due_soon':
        return 'due-soon';
      case 'current':
        return 'current';
      default:
        return 'current';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'overdue':
        return '🚨';
      case 'due_soon':
        return '⚠️';
      case 'current':
        return '✅';
      default:
        return '📅';
    }
  };

  useEffect(() => {
    const fetchPaymentDues = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:5001/api/payment-dues', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment dues');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setPaymentDues(data.paymentDues);
          setError(null);
        } else {
          throw new Error(data.message || 'Failed to load payment dues');
        }
      } catch (err) {
        setError('Failed to load payment dues. Please try again.');
        console.error('Error fetching payment dues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDues();
  }, []);

  const handlePayNow = (dueId) => {
    // Navigate to payment page with specific due ID
    navigate('/payment', { state: { dueId } });
  };

  const totalOverdue = paymentDues
    .filter(due => due.status === 'overdue')
    .reduce((sum, due) => sum + due.amount, 0);

  const totalDueSoon = paymentDues
    .filter(due => due.status === 'due_soon')
    .reduce((sum, due) => sum + due.amount, 0);

  const totalCurrent = paymentDues
    .filter(due => due.status === 'current')
    .reduce((sum, due) => sum + due.amount, 0);

  if (loading) {
    return (
      <div className="payment-dues-page">
        <Header />
        <main className="payment-dues-main">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading payment dues...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="payment-dues-page">
      <Header />
      
      <main className="payment-dues-main">
        <div className="container">
          <div className="page-header">
            <h1>💳 Payment Dues</h1>
            <p>View and manage your payment obligations</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="summary-section">
            <div className="summary-grid">
              <div className="summary-card overdue">
                <div className="summary-icon">🚨</div>
                <div className="summary-content">
                  <h3>Overdue</h3>
                  <p className="summary-amount">{formatCurrency(totalOverdue)}</p>
                  <p className="summary-count">
                    {paymentDues.filter(due => due.status === 'overdue').length} payment(s)
                  </p>
                </div>
              </div>

              <div className="summary-card due-soon">
                <div className="summary-icon">⚠️</div>
                <div className="summary-content">
                  <h3>Due Soon</h3>
                  <p className="summary-amount">{formatCurrency(totalDueSoon)}</p>
                  <p className="summary-count">
                    {paymentDues.filter(due => due.status === 'due_soon').length} payment(s)
                  </p>
                </div>
              </div>

              <div className="summary-card current">
                <div className="summary-icon">📅</div>
                <div className="summary-content">
                  <h3>Upcoming</h3>
                  <p className="summary-amount">{formatCurrency(totalCurrent)}</p>
                  <p className="summary-count">
                    {paymentDues.filter(due => due.status === 'current').length} payment(s)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Dues List */}
          <div className="dues-section">
            <div className="section-header">
              <h2>📋 Payment Details</h2>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/payment')}
              >
                💳 Make Payment
              </button>
            </div>

            <div className="dues-list">
              {paymentDues.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎉</div>
                  <h3>No Payment Dues</h3>
                  <p>You're all caught up! No payments due at this time.</p>
                </div>
              ) : (
                paymentDues.map((due) => (
                  <div key={due.id} className={`due-card card ${getStatusColor(due.status)}`}>
                    <div className="due-header">
                      <div className="due-icon">
                        {getStatusIcon(due.status)}
                      </div>
                      <div className="due-info">
                        <h3>{due.type}</h3>
                        <p className="due-description">{due.description}</p>
                        <p className="due-account">Account: {due.accountNumber}</p>
                      </div>
                      <div className="due-amount">
                        <span className="amount">{formatCurrency(due.amount)}</span>
                        <span className="due-date">Due: {formatDate(due.dueDate)}</span>
                      </div>
                    </div>

                    <div className="due-details">
                      <div className="due-status">
                        <span className={`status-badge ${getStatusColor(due.status)}`}>
                          {due.status === 'overdue' && `Overdue by ${due.daysOverdue} days`}
                          {due.status === 'due_soon' && `Due in ${due.daysUntilDue} days`}
                          {due.status === 'current' && `Due in ${due.daysUntilDue} days`}
                        </span>
                      </div>
                      
                      <div className="due-actions">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePayNow(due.id)}
                        >
                          Pay Now
                        </button>
                        <button className="btn btn-secondary btn-sm">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="quick-actions-card card">
              <h3>⚡ Quick Actions</h3>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn primary"
                  onClick={() => navigate('/payment')}
                >
                  <span className="action-icon">💳</span>
                  <span className="action-label">Make Payment</span>
                </button>
                <button 
                  className="quick-action-btn secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  <span className="action-icon">📊</span>
                  <span className="action-label">View Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentDues;