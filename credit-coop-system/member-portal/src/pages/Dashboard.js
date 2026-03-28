import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import './Dashboard.css';
import { toast } from 'react-toastify';
import { io as socketClient } from 'socket.io-client';
import { resolveRuntimeUrl } from '../runtimeUrlConfig';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [, setUserData] = useState(user);
  const [loading, setLoading] = useState(true); // Add a loading state to handle data fetching
  const [approvedNotifications, setApprovedNotifications] = useState([]);
  const notifiedRef = useRef(new Set(JSON.parse(localStorage.getItem('notifiedLoanApps') || '[]')));
  // track last-seen statuses per application so we can detect transitions to 'approved'
  const statusesRef = useRef(JSON.parse(localStorage.getItem('loanAppStatuses') || '{}'));

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          console.error(`Error: ${response.status} ${response.statusText}`);
          setLoading(false); // Stop loading even if the request fails
          return;
        }

        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.success) {
            updateUser(data.user);
            setUserData(data.user); // Trigger re-render
            console.log('Fetched user data:', data.user);
          } else {
            console.error('API returned an error:', data);
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          console.error('Response text:', text);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false); // Ensure loading state is updated
      }
    };

    fetchUserData();
  }, [updateUser]);

  // Poll loan applications for approval status and notify the user once per application
  useEffect(() => {
    let mounted = true;

    const fetchApplications = async () => {
      if (!user?.member_number) return;
      try {
        const res = await fetch(`/api/loan-application/list?member_number=${encodeURIComponent(user.member_number)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) return;
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Failed to parse loan applications response', err, text);
          return;
        }

        const applications = data.applications || data.applications_list || data;
        if (!Array.isArray(applications)) return;

        const newlyApproved = [];

        for (const app of applications) {
          if (!app || !app.application_id) continue;
          const id = String(app.application_id);
          // Consider either the legacy `status` field or the newer `review_status` field
          const status = ((app.status || app.review_status) || '').toLowerCase();

          const prevStatus = statusesRef.current[id] || null;

          // Notify when we observe a transition into 'approved'
          if (status === 'approved' && prevStatus !== 'approved') {
            // mark notified and collect for UI update
            notifiedRef.current.add(id);
            newlyApproved.push(app);
          }

          // always update our seen status map
          statusesRef.current[id] = status;
        }

        if (newlyApproved.length && mounted) {
          // persist notified ids and statuses
          try {
            localStorage.setItem('notifiedLoanApps', JSON.stringify(Array.from(notifiedRef.current)));
          } catch (e) {
            console.warn('Could not persist notifiedLoanApps', e);
          }
          try {
            localStorage.setItem('loanAppStatuses', JSON.stringify(statusesRef.current));
          } catch (e) {
            console.warn('Could not persist loanAppStatuses', e);
          }

          // show toast for each approved application
          newlyApproved.forEach((app) => {
            const title = app.title || `Loan Application ${app.application_id}`;
            toast.success(`${title} has been approved. Check your loan dashboard for details.`);
          });

          setApprovedNotifications((prev) => [...newlyApproved, ...prev]);
        }
      } catch (error) {
        console.error('Error fetching loan applications for notifications:', error);
      }
    };

    // initial fetch + polling every 30s
    fetchApplications();
    const iv = setInterval(fetchApplications, 30_000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [user]);

  // Real-time: listen for staff-server emitted loan-approved events
  useEffect(() => {
    if (!user || !user.member_number) return;
    let socket;
    try {
      socket = socketClient(resolveRuntimeUrl('http://localhost:5000'));
      socket.on('connect', () => {
        // console.log('Connected to staff socket for loan-approved events');
      });

      socket.on('loan-approved', (payload) => {
        try {
          console.debug('socket loan-approved payload:', payload);
          if (!payload) return;
          const memberNumber = payload.member_number || (payload.application && payload.application.member_number) || null;
          if (!memberNumber) return;
          if (String(memberNumber) !== String(user.member_number)) return;

          const app = payload.application || { application_id: payload.application_id, message: payload.message, notes: payload.notes };

          // show toast and inline banner
          const title = app.title || `Loan Application ${app.application_id}`;
          toast.success(`${title} has been approved. Check your loan dashboard for details.`);

          // ensure we don't double-notify
          try { notifiedRef.current.add(String(app.application_id)); } catch (e) {}
          try { statusesRef.current[String(app.application_id)] = 'approved'; } catch (e) {}

          setApprovedNotifications((prev) => [app, ...prev]);
        } catch (e) {
          console.warn('Error handling loan-approved socket payload', e);
        }
      });
    } catch (e) {
      console.warn('Failed to initialize loan-approved socket client', e);
    }

    return () => {
      try { if (socket && socket.disconnect) socket.disconnect(); } catch (e) {}
    };
  }, [user]);

  // Add an effect to synchronize local state with user context
  useEffect(() => {
    console.log('User data updated:', user);
    setUserData(user); // Update local state whenever user context changes
  }, [user]);

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

  const quickActions = [
    { icon: '💰', label: 'Add Money', color: 'success' },
    { icon: '💳', label: 'Savings', color: 'info' },
    { icon: '💸', label: 'Payment', color: 'warning', onClick: () => navigate('/payment') },
    { icon: '📋', label: 'Payment Dues', color: 'danger', onClick: () => navigate('/payment-dues') },
    { icon: '🕐', label: 'History', color: 'secondary', onClick: () => navigate('/history') }
  ];

  if (loading) {
    return <div>Loading...</div>; // Display loading indicator
  }

  const displayedBalance = user?.loan?.outstanding_balance ?? user?.loan?.amount ?? 0;

  return (
    <div className="dashboard">
      <Header />
      
      <main className="dashboard-main">
        <div className="container">

          {/* Account Overview */}
          <div className="accounts-section">
            <div className="grid grid-2">
              {/* Savings Account */}
              <div className="account-card card">
                <div className="account-header">
                  <div className="account-icon savings">💰</div>
                  <div className="account-info">
                    <h3>Total Savings</h3>
                  </div>
                  
                </div>
                <div className="account-balance">
                  <span className="balance-amount">{formatCurrency(user?.accounts?.savings?.balance || 0)}</span>
                  <span className="balance-label">Current balance</span>
                </div>
              </div>

              
            </div>
          </div>

          {/* Loan Section */}
          <div className="loan-section">
            <div className="loan-card card">
                {/* Inline banners for newly approved applications */}
              {approvedNotifications.length > 0 && (
                <div className="approved-banner">
                  {approvedNotifications.map((a) => (
                    <div key={a.application_id} className="approved-item">
                      <strong>Application #{a.application_id} approved</strong>
                      <div>{a.message || a.notes || 'Your loan application has been approved.'}</div>
                    </div>
                  ))}
                </div>
              )}
                {/* debug UI removed */}
              <div className="loan-header">
                <div className="loan-icon">🏦</div>
                <div className="loan-info">
                  <h3>Loan Balance</h3>
                  <p>
                      {user?.loan
                        ? `Loan Amount: ${formatCurrency(displayedBalance)}`
                        : 'No active loan'}
                    <br />
                    {user?.loan?.duration_months
                      ? `Loan Term: ${user.loan.duration_months} months`
                      : ''}
                  </p>
                </div>
              </div>
              <div className="loan-balance">
                <span className="balance-amount">{formatCurrency(displayedBalance)}</span>
                <span className="balance-label">Loan balance</span>
              </div>
              <div className="loan-action">
                {displayedBalance > 0 ? (
                  <button className="btn btn-primary btn-lg" disabled>
                    🚫 Loan Application Disabled<br />
                    <span>You already have an active loan.</span>
                  </button>
                ) : (
                  <button className="btn btn-primary btn-lg" onClick={() => navigate('/loans')}>
                    🏷️ Need funds?<br />
                    <span>Apply for a loan now!</span><br />
                    <small>Starting from ₱500,000</small>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <div className="quick-actions-card card">
              <h3>⚡ Quick Actions</h3>
              <div className="quick-actions-grid">
                {quickActions.map((action, index) => (
                  <button key={index} className={`quick-action-btn ${action.color}`} onClick={action.onClick}>
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity-section">
            
            <div className="activity-list">
              {user?.recentTransactions?.slice(0, 4).map((transaction) => (
                <div key={transaction.id} className="activity-item card">
                  <div className="activity-icon">
                    {transaction.type === 'credit' ? '💰' : 
                     transaction.type === 'transfer' ? '🔄' : '💸'}
                  </div>
                  <div className="activity-info">
                    <h4>{transaction.description}</h4>
                    <p>{formatDate(transaction.date)} • {transaction.account}</p>
                  </div>
                  <div className={`activity-amount ${transaction.type}`}>
                    {transaction.type === 'credit' ? '+' : ''}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
