import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/payment-history', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch payment history');
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Failed to load payment history');
        setItems(data.history || []);
      } catch (err) {
        console.error('Error fetching payment history:', err);
        setError('Failed to load payment history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="payment-history-page">
        <Header />
        <main className="payment-history-main">
          <div className="container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading payment history...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="payment-history-page">
      <Header />
      <main className="payment-history-main">
        <div className="container">
          <div className="page-header">
            <h1>🧾 Payment History</h1>
            <p>Your past debt and dues payments</p>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          {items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗂️</div>
              <h3>No payments found</h3>
              <p>Once you make payments, they will appear here.</p>
              <button className="btn btn-primary" onClick={() => navigate('/payment')}>Make a Payment</button>
            </div>
          ) : (
            <div className="history-list">
              {items.map((item) => (
                <div key={item.id} className={`history-item card ${item.status}`}>
                  <div className="history-left">
                    <div className="type-icon">{item.type === 'loan' ? '🏦' : item.type === 'membership' ? '🧾' : '💳'}</div>
                    <div className="meta">
                      <h3 className="title">{item.title}</h3>
                      <div className="sub">{formatDateTime(item.paidAt)} • Ref: {item.reference}</div>
                    </div>
                  </div>
                  <div className="history-right">
                    <div className="amount">{formatCurrency(item.amount)}</div>
                    <div className={`status-badge ${item.status}`}>{item.status === 'confirmed' ? 'Confirmed' : item.status === 'pending' ? 'Pending' : 'Rejected'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentHistory;


