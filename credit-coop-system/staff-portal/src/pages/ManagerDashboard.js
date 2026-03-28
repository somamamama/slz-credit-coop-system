import React, { useState, useEffect } from 'react';
import '../pages/Dashboard.css';
import { io } from 'socket.io-client';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { resolveRuntimeUrl } from '../runtimeUrlConfig';

const ManagerDashboard = ({ setAuth }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [stats, setStats] = useState({
        monthlyRevenue: 0,
        totalMembers: 0,
        activeLoanApplications: 0,
        staffPerformance: 0
    });
    const [lastUnderReviewCount, setLastUnderReviewCount] = useState(0);
    const [underReviewAlert, setUnderReviewAlert] = useState({ visible: false, count: 0 });
    const [socketStatus, setSocketStatus] = useState('disconnected');

    useEffect(() => {
        console.log('ManagerDashboard mounted');
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
        // initial stats for under_review
        (async () => {
            try {
                const r = await axios.get('http://localhost:5000/api/loan-review/statistics');
                if (r.data?.success) {
                    const under = Number(r.data.statistics?.under_review || 0);
                    setLastUnderReviewCount(under);
                    setStats(prev => ({ ...prev, activeLoanApplications: r.data.statistics?.pending_review || prev.activeLoanApplications }));
                }
            } catch (e) {}
        })();
    }, []);

    // Poll statistics periodically to detect under_review increases
    useEffect(() => {
        let cancelled = false;
        const poll = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/loan-review/statistics');
                if (!cancelled && res.data?.success) {
                    const under = Number(res.data.statistics?.under_review || 0);
                    if (under > lastUnderReviewCount) {
                        const diff = under - lastUnderReviewCount;
                        setUnderReviewAlert({ visible: true, count: diff });
                        toast.info(
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontWeight: 700 }}>There are new applications awaiting manager review</div>
                                <div style={{ fontSize: 12, color: '#444' }}>{diff} application{diff>1 ? 's' : ''} moved to under-review.</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary" onClick={() => { scrollToPending(); toast.dismiss(); }}>Open</button>
                                    <button className="btn btn-secondary" onClick={() => toast.dismiss()}>Dismiss</button>
                                </div>
                            </div>,
                            { position: 'top-right', autoClose: false, closeOnClick: false, draggable: false, toastId: `mgr-under-${Date.now()}` }
                        );
                        setLastUnderReviewCount(under);
                    } else if (under < lastUnderReviewCount) {
                        setLastUnderReviewCount(under);
                    }
                }
            } catch (e) {
                // ignore
            }
        };
        // initial run
        poll();
        const id = setInterval(poll, 10000);
        return () => { cancelled = true; clearInterval(id); };
    }, [lastUnderReviewCount]);

    // Socket listener for status updates (if server emits)
    useEffect(() => {
        let socket;
        try {
            setSocketStatus('connecting');
            console.log('Manager socket init - attempting to connect to staff socket server');
            const socketUrl = resolveRuntimeUrl('http://localhost:5000');
            console.log('Manager socket will connect to', socketUrl);
            socket = io(socketUrl);
            socket.on('connect', () => {
                console.log('Manager socket connected', socket.id);
                setSocketStatus('connected');
                try { socket.emit('join', { role: 'manager' }); console.log('Emitted join for manager'); } catch(e) { console.warn('Emit join failed', e); }
            });
            socket.on('connect_error', (err) => { console.error('Manager socket connect_error', err); setSocketStatus('error'); });
            socket.on('error', (err) => { console.error('Manager socket error', err); setSocketStatus('error'); });
            socket.on('disconnect', (reason) => { console.log('Manager socket disconnected', reason); setSocketStatus('disconnected'); });

            socket.on('new_application', (payload) => {
                // if a payload arrives with review_status under_review, notify manager
                try {
                    if (payload?.review_status === 'under_review' || payload?.review_status === 'awaiting_manager') {
                        setUnderReviewAlert({ visible: true, count: (underReviewAlert.count || 0) + 1 });
                        toast.info(
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontWeight: 700 }}>Application moved to manager review</div>
                                <div style={{ fontSize: 12, color: '#444' }}>Application ID: {payload.application_id || 'N/A'}</div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-primary" onClick={() => { scrollToPending(); handleHighlight(payload.application_id); toast.dismiss(); }}>Open</button>
                                    <button className="btn btn-secondary" onClick={() => toast.dismiss()}>Dismiss</button>
                                </div>
                            </div>,
                            { position: 'top-right', autoClose: false, closeOnClick: false, draggable: false, toastId: `mgr-under-socket-${payload.application_id || Date.now()}` }
                        );
                    }
                } catch (er) { console.error(er); }
            });

            socket.on('status_change', (payload) => {
                if (payload?.new_status === 'under_review') {
                    setUnderReviewAlert({ visible: true, count: (underReviewAlert.count || 0) + 1 });
                    toast.info(`Application ${payload.application_id} requires your review`, { position: 'top-right', autoClose: 8000 });
                }
            });
        } catch (e) {
            console.warn('Manager socket init failed', e);
        }
        return () => { try { if (socket && socket.disconnect) socket.disconnect(); } catch (e) {} };
    }, []);

    const scrollToPending = () => {
        const el = document.querySelector('.activity-list');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // add a temporary highlight
            el.style.transition = 'box-shadow 0.4s ease';
            el.style.boxShadow = '0 0 0 4px rgba(111, 66, 193, 0.12)';
            setTimeout(() => { el.style.boxShadow = ''; }, 2500);
        }
    };

    const handleHighlight = (applicationId) => {
        // optional: find a list item and flash it. We'll gracefully noop if not found.
        const selector = `.activity-item[data-app-id="${applicationId}"]`;
        const item = document.querySelector(selector);
        if (item) {
            item.style.transition = 'background-color 0.3s ease';
            const orig = item.style.backgroundColor;
            item.style.backgroundColor = '#fff3cd';
            setTimeout(() => { item.style.backgroundColor = orig; }, 2000);
        }
    };

    return (
        <div className="dashboard-container">
            {/* Toast container for manager notifications */}
            <ToastContainer position="top-right" newestOnTop />
            {/* DEVELOPMENT: visible debug banner to confirm ManagerDashboard code is running */}
            <div id="dev-socket-debug" style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#ff6b6b', color: 'white', padding: '6px 12px', zIndex: 2147483647, textAlign: 'center', fontWeight: 700 }}>
                DEV SOCKET STATUS: {socketStatus}
            </div>
            <div className="dashboard-header">
                <h1>Manager Dashboard</h1>
                <p className="dashboard-subtitle">
                    Welcome, {userInfo?.name || 'Manager'}! Oversee operations and drive growth.
                </p>
            </div>
            <div style={{ position: 'fixed', top: 16, right: 24, zIndex: 99999, pointerEvents: 'auto' }}>
                <div style={{ padding: '8px 12px', borderRadius: 18, background: socketStatus === 'connected' ? '#d4ffe0' : socketStatus === 'connecting' ? '#fff4e6' : socketStatus === 'error' ? '#ffe6e6' : '#f1f1f1', border: '1px solid #ddd', fontSize: 13, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
                    Socket: <strong style={{ textTransform: 'capitalize' }}>{socketStatus}</strong>
                </div>
            </div>

            {underReviewAlert.visible && (
                <div style={{ margin: '12px 0', padding: '12px', background: '#fff4e6', border: '1px solid #ffd7a6', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <strong>New application{underReviewAlert.count > 1 ? 's' : ''} for manager review</strong>
                        <div style={{ color: '#666' }}>{underReviewAlert.count} new application{underReviewAlert.count > 1 ? 's' : ''} awaiting your review.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary" onClick={() => { scrollToPending(); setUnderReviewAlert({ visible: false, count: 0 }); }}>View</button>
                        <button className="btn btn-secondary" onClick={() => setUnderReviewAlert({ visible: false, count: 0 })}>Dismiss</button>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">💹</div>
                    <div className="stat-info">
                        <h3>Monthly Revenue</h3>
                        <span className="stat-number">₱{stats.monthlyRevenue.toLocaleString()}</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>Total Members</h3>
                        <span className="stat-number">{stats.totalMembers}</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">📋</div>
                    <div className="stat-info">
                        <h3>Loan Applications</h3>
                        <span className="stat-number">{stats.activeLoanApplications}</span>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                        <h3>Staff Performance</h3>
                        <span className="stat-number">{stats.staffPerformance}%</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Management Tools</h2>
                    <div className="action-buttons">
                        <button className="action-btn primary">
                            <span className="btn-icon">👥</span>
                            Staff Management
                        </button>
                        <button className="action-btn success">
                            <span className="btn-icon">📈</span>
                            Performance Reports
                        </button>
                        <button className="action-btn warning">
                            <span className="btn-icon">💰</span>
                            Loan Approvals
                        </button>
                        <button className="action-btn info">
                            <span className="btn-icon">📊</span>
                            Financial Analysis
                        </button>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Key Metrics</h2>
                    <div className="quick-actions">
                        <div className="quick-action-item">
                            <span className="action-icon">📊</span>
                            <div className="action-content">
                                <h4>Monthly Report</h4>
                                <p>View detailed analytics</p>
                            </div>
                        </div>
                        <div className="quick-action-item">
                            <span className="action-icon">💼</span>
                            <div className="action-content">
                                <h4>Portfolio Overview</h4>
                                <p>Loan portfolio status</p>
                            </div>
                        </div>
                        <div className="quick-action-item">
                            <span className="action-icon">🎯</span>
                            <div className="action-content">
                                <h4>Target Progress</h4>
                                <p>Track monthly goals</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Pending Approvals</h2>
                    <div className="activity-list">
                        <div className="activity-item">
                            <span className="activity-time">Priority</span>
                            <span className="activity-desc">Loan Application - ₱500,000 - Review Required</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-time">Medium</span>
                            <span className="activity-desc">Staff Leave Request - John Doe - 3 days</span>
                        </div>
                        <div className="activity-item">
                            <span className="activity-time">Low</span>
                            <span className="activity-desc">Equipment Purchase - Office Supplies</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
