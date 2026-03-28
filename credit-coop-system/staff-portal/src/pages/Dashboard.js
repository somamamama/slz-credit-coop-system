import React, { useState, useEffect } from 'react';
import { ReactComponent as UserIcon } from './assets/user-svgrepo-com.svg';
import { ReactComponent as DepositIcon } from './assets/money-bag-svgrepo-com.svg';
import { ReactComponent as LoanIcon } from './assets/loan-round-svgrepo-com.svg';
import { ReactComponent as ApplicationIcon} from './assets/clipboard-text-svgrepo-com.svg';
import './Dashboard.css';

const Dashboard = ({ setAuth, userRole }) => {
  // Get role-specific title and description
  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Administrator Dashboard',
          description: 'Manage members and system reports across the credit cooperative'
        };
      case 'manager':
        return {
          title: 'Manager Dashboard',
          description: 'Oversee operations and monitor performance across all departments'
        };
      case 'loan_officer':
        return {
          title: 'Loan Officer Dashboard',
          description: 'Process loan applications and manage member credit assessments'
        };
      case 'cashier':
        return {
          title: 'Cashier Dashboard',
          description: 'Process transactions and provide member account services'
        };
      case 'it_admin':
        return {
          title: 'IT Administrator Dashboard',
          description: 'Monitor system performance and manage technical infrastructure'
        };
      default:
        return {
          title: 'Dashboard Overview',
          description: 'Monitor key metrics and recent activities across the credit cooperative'
        };
    }
  };

  const roleInfo = getRoleInfo(userRole);
  // live metrics (fallback to friendly placeholders while loading)
  const [stats, setStats] = useState({
    totalMembers: null,
    pendingApplications: null
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // total members from staff server
        const membersResp = await fetch('http://localhost:5000/api/user-management/members/count', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            token: localStorage.token
          }
        });
        if (membersResp.ok) {
          const body = await membersResp.json();
          if (body && body.success) {
            setStats(prev => ({ ...prev, totalMembers: body.totalMembers || 0 }));
          }
        }

        // pending applications from member server
        const appsResp = await fetch('http://localhost:3002/api/membership-applications', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            token: localStorage.token
          }
        });
        if (appsResp.ok) {
          const appsBody = await appsResp.json();
          const apps = appsBody && Array.isArray(appsBody.applications) ? appsBody.applications : [];
          const pendingCount = apps.filter(a => {
            const s = (a.status || a.application_status || '').toString().toLowerCase();
            return s === 'pending' || s === 'submitted' || s === 'new';
          }).length;
          setStats(prev => ({ ...prev, pendingApplications: pendingCount }));
        }
      } catch (err) {
        console.warn('Failed to load dashboard metrics:', err);
      }
    };

    loadMetrics();
  }, []);

  // Compose metrics array for rendering; keep deposit/loans placeholders until those endpoints exist
  const metrics = [
    {
      title: 'Total Members',
      value: (stats.totalMembers !== null) ? String(stats.totalMembers) : '—',
      change: '+127',
      changeType: 'positive',
      icon: (<UserIcon />),
      color: 'blue'
    },
    {
      title: 'Total Deposits',
      value: '₱45.2M',
      change: '+₱2.1M',
      changeType: 'positive',
      icon: (<DepositIcon />),
      color: 'green'
    },
    {
      title: 'Active Loans',
      value: '₱28.7M',
      change: '+₱890K',
      changeType: 'positive',
      icon: (<LoanIcon />),
      color: 'purple'
    },
    {
      title: 'Pending Applications',
      value: (stats.pendingApplications !== null) ? String(stats.pendingApplications) : '—',
      change: '-5',
      changeType: 'negative',
      icon: (<ApplicationIcon />),
      color: 'orange'
    }
  ];

  const recentTransactions = [
    {
      id: 'TXN001',
      member: 'Juan Dela Cruz',
      type: 'Deposit',
      amount: '₱15,000',
      account: 'SAV-001234',
      time: '2 minutes ago',
      status: 'completed'
    },
    {
      id: 'TXN002',
      member: 'Maria Santos',
      type: 'Withdrawal',
      amount: '₱8,500',
      account: 'CHK-005678',
      time: '15 minutes ago',
      status: 'completed'
    },
    {
      id: 'TXN003',
      member: 'Pedro Garcia',
      type: 'Loan Payment',
      amount: '₱25,000',
      account: 'LOAN-009876',
      time: '1 hour ago',
      status: 'pending'
    },
    {
      id: 'TXN004',
      member: 'Ana Rodriguez',
      type: 'Transfer',
      amount: '₱12,000',
      account: 'SAV-003456',
      time: '2 hours ago',
      status: 'completed'
    }
  ];

  const pendingApprovals = [
    {
      id: 'APP001',
      type: 'Loan Application',
      member: 'Roberto Lim',
      amount: '₱500,000',
      submitted: '3 days ago',
      priority: 'high'
    },
    {
      id: 'APP002',
      type: 'Account Opening',
      member: 'Carmen Reyes',
      amount: '₱25,000',
      submitted: '1 day ago',
      priority: 'medium'
    },
    {
      id: 'APP003',
      type: 'Credit Limit Increase',
      member: 'Miguel Torres',
      amount: '₱200,000',
      submitted: '2 days ago',
      priority: 'low'
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="page-title">
          <h1>{roleInfo.title}</h1>
          <p>{roleInfo.description}</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className={`metric-card card ${metric.color}`}>
            <div className="metric-icon">
              {metric.icon}
            </div>
            <div className="metric-content">
              <h3 className="metric-value">{metric.value}</h3>
              <p className="metric-title">{metric.title}</p>
              <span className={`metric-change ${metric.changeType}`}>
                {metric.change} this month
              </span>
            </div>
            <div className="metric-arrow">
              {metric.changeType === 'positive' ? '↗️' : '↘️'}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Recent Transactions Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <button className="btn btn-secondary btn-sm">
              <span>👁️</span>
              View All
            </button>
          </div>
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className="member-info">
                          <div className="member-avatar">
                            {transaction.member.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="member-name">{transaction.member}</div>
                            <div className="text-muted transaction-id">#{transaction.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge type-${transaction.type.toLowerCase().replace(' ', '-')}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="font-weight-bold">{transaction.amount}</td>
                      <td>
                        <span className={`status-badge status-${transaction.status}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="text-muted">{transaction.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile-friendly stacked list — visible only on small screens */}
            <div className="transactions-mobile-list" aria-hidden="false">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="txn-card card">
                  <div className="txn-top">
                    <div className="member-info">
                      <div className="member-avatar">{transaction.member.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <div className="member-name">{transaction.member}</div>
                        <div className="text-muted transaction-id">#{transaction.id}</div>
                      </div>
                    </div>
                    <div className="txn-amount">{transaction.amount}</div>
                  </div>
                  <div className="txn-meta">
                    <span className={`type-badge type-${transaction.type.toLowerCase().replace(' ', '-')}`}>{transaction.type}</span>
                    <span className={`status-badge status-${transaction.status}`}>{transaction.status}</span>
                    <span className="text-muted txn-time">{transaction.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Pending Approvals</h2>
            <button className="btn btn-warning btn-sm">
              <span>⏳</span>
              Review All
            </button>
          </div>
          <div className="card">
            <div className="approvals-container">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="approval-item">
                  <div className="approval-info">
                    <div className="approval-header">
                      <span className="approval-type">{approval.type}</span>
                      <span className={`priority-badge priority-${approval.priority}`}>
                        {approval.priority} priority
                      </span>
                    </div>
                    <div className="approval-details">
                      <div className="approval-member">
                        <div className="member-avatar small">
                          {approval.member.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span>{approval.member}</span>
                      </div>
                      <div className="approval-amount">{approval.amount}</div>
                    </div>
                    <div className="approval-time">Submitted {approval.submitted}</div>
                  </div>
                  <div className="approval-actions">
                    <button className="btn btn-success btn-sm">
                      <span>✅</span>
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm">
                      <span>❌</span>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
