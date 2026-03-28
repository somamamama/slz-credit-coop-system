import React, { useState, useEffect } from 'react';
import '../pages/Dashboard.css';

const ITAdminDashboard = ({ setAuth }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [stats, setStats] = useState({
        systemUptime: '99.9%',
        activeUsers: 0,
        securityAlerts: 0,
        backupStatus: 'Success'
    });

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
                }
            } catch (err) {
                console.error("Error fetching user info:", err);
            }
        };

        fetchUserInfo();
    }, []);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>IT Administrator Dashboard</h1>
                <p className="dashboard-subtitle">
                    Welcome, {userInfo?.name || 'IT Administrator'}! Monitor and maintain system infrastructure.
                </p>
            </div>

            <div className="stats-grid">
                <div className="stat-card success">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-info">
                        <h3>System Uptime</h3>
                        <span className="stat-number">{stats.systemUptime}</span>
                    </div>
                </div>

                <div className="stat-card primary">
                    <div className="stat-icon">👤</div>
                    <div className="stat-info">
                        <h3>Active Users</h3>
                        <span className="stat-number">{stats.activeUsers}</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-info">
                        <h3>Security Alerts</h3>
                        <span className="stat-number">{stats.securityAlerts}</span>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">💾</div>
                    <div className="stat-info">
                        <h3>Last Backup</h3>
                        <span className="stat-number">{stats.backupStatus}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>System Administration</h2>
                    <div className="action-buttons">
                        <button className="action-btn primary">
                            <span className="btn-icon">🖥️</span>
                            Server Management
                        </button>
                        <button className="action-btn warning">
                            <span className="btn-icon">🔒</span>
                            Security Settings
                        </button>
                        <button className="action-btn success">
                            <span className="btn-icon">💾</span>
                            Database Backup
                        </button>
                        <button className="action-btn info">
                            <span className="btn-icon">📊</span>
                            System Monitoring
                        </button>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Maintenance Tasks</h2>
                    <div className="quick-actions">
                        <div className="quick-action-item">
                            <span className="action-icon">🔄</span>
                            <div className="action-content">
                                <h4>System Update</h4>
                                <p>Check for updates</p>
                            </div>
                        </div>
                        <div className="quick-action-item">
                            <span className="action-icon">🧹</span>
                            <div className="action-content">
                                <h4>Cleanup Tasks</h4>
                                <p>Run maintenance scripts</p>
                            </div>
                        </div>
                        <div className="quick-action-item">
                            <span className="action-icon">📈</span>
                            <div className="action-content">
                                <h4>Performance Check</h4>
                                <p>Analyze system performance</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>System Logs</h2>
                    <div className="activity-list">
                        <div className="activity-item">
                            <span className="activity-time">12:30 PM</span>
                            <span className="activity-desc">Database backup completed successfully</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-time">11:45 AM</span>
                            <span className="activity-desc">Security scan completed - No threats detected</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-time">10:30 AM</span>
                            <span className="activity-desc">System maintenance window scheduled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ITAdminDashboard;
