import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { io } from 'socket.io-client';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import logoUser from './assets/user-svgrepo-com.svg';
import { resolveRuntimeUrl } from '../runtimeUrlConfig';

const StaffDashboard = ({ setAuth }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        pendingApplications: 0,
        totalAccounts: 0,
        totalLoans: 0,
        totalTransactions: 0
    });
    const [newApplications, setNewApplications] = useState([]);
    const [loanApps, setLoanApps] = useState([]);
    const [selectedLoanApp, setSelectedLoanApp] = useState(null);
    const [loanLoading, setLoanLoading] = useState(false);
    const navigate = useNavigate();

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
                    try {
                        const socket = io(resolveRuntimeUrl('http://localhost:3002'));
                        socket.on('connect', () => {
                            const role = userData.role || userData.user_role || 'staff';
                            socket.emit('join', { role });
                        });

                        socket.on('new-application', (newApp) => {
                            const applicantName = `${newApp.first_name || ''} ${newApp.last_name || ''}`.trim();
                            const message = applicantName ? `${applicantName} submitted a membership application.` : 'New membership application received.';
                            toast.info(message, { position: 'top-right', autoClose: 8000 });
                            setNewApplications((prev) => [newApp, ...prev]);
                        });

                        socket.on('disconnect', () => {
                            console.warn('Socket disconnected');
                        });
                    } catch (socketErr) {
                        console.warn('Failed to initialize socket in StaffDashboard:', socketErr);
                    }
                }
            } catch (err) {
                console.error("Error fetching user info:", err);
            }
        };

        const loadInitialApplications = async () => {
            try {
                const response = await fetch("http://localhost:3002/api/membership-applications", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "token": localStorage.token
                    }
                });
                if (response.ok) {
                    const result = await response.json();
                    setNewApplications(result && result.applications ? result.applications : []);
                }
            } catch (err) {
                console.error('Error loading initial applications:', err);
            }
        };

        fetchUserInfo();
        loadInitialApplications();
        // load counts/stats (members + pending applications)
        const loadStats = async () => {
            try {
                // fetch total members from staff API
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

                // fetch membership applications and compute pending count
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
                        // treat common pending-like statuses as pending
                        return s === 'pending' || s === 'submitted' || s === 'new';
                    }).length;
                    setStats(prev => ({ ...prev, pendingApplications: pendingCount }));
                }
            } catch (err) {
                console.error('Error loading stats:', err);
            }
        };
        loadStats();

        const loadApprovedLoans = async () => {
            try {
                const resp = await axios.get('http://localhost:5000/api/loan-review/applications?status=approved', {
                    headers: {
                        'Content-Type': 'application/json',
                        token: localStorage.token
                    }
                });
                if (resp.data && resp.data.success) {
                    setLoanApps(resp.data.applications || []);
                }
            } catch (err) {
                console.error('Error loading approved loans:', err);
            }
        };
        loadApprovedLoans();

        return () => {};
    }, []);

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="header-left">
                    <div className="logo-circle"><img src={logoUser} alt="CreditCoop logo" /></div>
                    <div>
                        <h1>CreditCoop</h1>
                        <div className="subline">STAFF PORTAL</div>
                    </div>
                </div>
                <div className="header-right">
                    <div className="role-badge">STAFF</div>
                    <div className="user-avatar">{(userInfo && userInfo.name) ? userInfo.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase() : 'SU'}</div>
                </div>
            </div>

            <div className="dashboard-header-sub">
                <h2>Staff Dashboard</h2>
                <p>Welcome back, {userInfo?.name || 'Staff'}! Use this panel to manage members, applications, and loans.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>Total Members</h3>
                        <span className="stat-number">{stats.totalMembers}</span>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <h3>Generated Reports</h3>
                        <span className="stat-number">{stats.totalAccounts}</span>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">💼</div>
                    <div className="stat-info">
                        <h3>Pending Applications</h3>
                        <span className="stat-number">{stats.pendingApplications}</span>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">🔔</div>
                    <div className="stat-info">
                        <h3>Active Memberships</h3>
                        <span className="stat-number">{stats.totalTransactions}</span>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Member Management</h2>
                    <div className="action-buttons">
                        <button className="action-btn primary">
                            <span className="btn-icon">👤</span>
                            Add New Member
                        </button>
                        <button 
                            className="action-btn secondary"
                            onClick={() => navigate('/members')}
                        >
                            <span className="btn-icon">👥</span>
                            View All Members
                        </button>
                        <button 
                            className="action-btn success"
                            onClick={() => navigate('/membership-applications')}
                        >
                            <span className="btn-icon">📝</span>
                            Membership Applications
                        </button>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Reports & Analytics</h2>
                    <div className="quick-actions">
                        <div className="quick-action-item">
                            <span className="action-icon">📋</span>
                            <div className="action-content">
                                <h4>Member Report</h4>
                                <p>Generate membership statistics</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Recent Member Activities</h2>
                    <div className="activity-list">
                        <div className="activity-item">
                            <span className="activity-time">2 hours ago</span>
                            <span className="activity-desc">New member registration - John Doe</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>New Membership Applications</h2>
                    <div className="application-list">
                        {newApplications.length > 0 ? (
                            newApplications.map((application, index) => (
                                <div key={index} className="application-item">
                                    <span className="application-name">{`${application.first_name || ''} ${application.last_name || ''}`.trim()}</span>
                                    <span className="application-date">{new Date(application.created_at || application.application_date || Date.now()).toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p>No new applications at the moment.</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2>Loan Processing</h2>
                    <p>Review approved loan applications and set final loan amounts or recommend for disbursement.</p>
                    <div className="application-list">
                        {loanApps.length > 0 ? (
                            loanApps.map((app) => (
                                <div key={app.application_id} className="application-item">
                                    <span className="application-name">{app.applicant_name || `${app.first_name || ''} ${app.last_name || ''}`}</span>
                                    <span className="application-date">{new Date(app.submitted_at || Date.now()).toLocaleString()}</span>
                                    <div style={{marginTop: '0.5rem'}}>
                                        <button className="action-btn small" onClick={() => setSelectedLoanApp(app)}>Set Loan Amount</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No approved loan applications awaiting amounts.</p>
                        )}
                    </div>
                </div>

                {selectedLoanApp && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Set Loan Amount for #{selectedLoanApp.application_id}</h2>
                                <button className="close-btn" onClick={() => setSelectedLoanApp(null)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <label>Requested Amount</label>
                                        <div>{selectedLoanApp.requested_amount || selectedLoanApp.loan_amount || 'N/A'}</div>
                                    </div>
                                    <div className="info-item">
                                        <label>Loan Type</label>
                                        <div>{selectedLoanApp.loan_type || 'regular'}</div>
                                    </div>
                                    <div className="info-item">
                                        <label>Final Loan Amount (gross)</label>
                                        <input type="number" min="0" step="0.01" value={selectedLoanApp.loan_amount || ''}
                                            onChange={e => setSelectedLoanApp({...selectedLoanApp, loan_amount: e.target.value})} />
                                    </div>
                                </div>

                                {selectedLoanApp.loan_amount && (
                                    (() => {
                                        const amount = parseFloat(selectedLoanApp.loan_amount) || 0;
                                        const months = selectedLoanApp.loan_type === 'quick' ? 6 : 12;
                                        const serviceFee = amount * 0.03;
                                        const shareCapital = amount * 0.03;
                                        const insurance = (amount * months) / 1000;
                                        const annualInterestRate = 0.12;
                                        const monthlyInterestRate = annualInterestRate / 12;
                                        const n = months;
                                        const P = amount;
                                        const r = monthlyInterestRate;
                                        const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                                        const netProceeds = amount - serviceFee - shareCapital - insurance;
                                        return (
                                            <div className="deductions-section" style={{marginTop: '1rem'}}>
                                                <h5>Deductions</h5>
                                                <div>Service Fee (3%): ₱{serviceFee.toFixed(2)}</div>
                                                <div>Share Capital (3%): ₱{shareCapital.toFixed(2)}</div>
                                                <div>Insurance: ₱{insurance.toFixed(2)}</div>
                                                <div>Net Proceeds: <b>₱{netProceeds.toFixed(2)}</b></div>
                                                <h5 style={{marginTop: '1rem'}}>Monthly Payment</h5>
                                                <div>Monthly Payment: <b>₱{monthlyPayment.toFixed(2)}</b></div>
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" disabled={loanLoading} onClick={async () => {
                                    setLoanLoading(true);
                                    try {
                                        const amount = parseFloat(selectedLoanApp.loan_amount) || 0;
                                        const months = selectedLoanApp.loan_type === 'quick' ? 6 : 12;
                                        const annualInterestRate = 0.12;
                                        const monthlyInterestRate = annualInterestRate / 12;
                                        const n = months;
                                        const P = amount;
                                        const r = monthlyInterestRate;
                                        const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                                        const serviceFee = amount * 0.03;
                                        const shareCapital = amount * 0.03;
                                        const insurance = (amount * months) / 1000;
                                        const netProceeds = amount - serviceFee - shareCapital - insurance;

                                        await axios.post(`http://localhost:5000/api/loan-review/applications/${selectedLoanApp.application_id}/set-loan-amount`, {
                                            loan_amount: netProceeds,
                                            loan_duration: months,
                                            monthly_payment: monthlyPayment
                                        }, {
                                            headers: {
                                                'Content-Type': 'application/json',
                                                token: localStorage.token
                                            }
                                        });
                                        alert('Loan amount saved');
                                        setLoanApps(prev => prev.filter(a => a.application_id !== selectedLoanApp.application_id));
                                        setSelectedLoanApp(null);
                                    } catch (err) {
                                        console.error('Error saving loan amount:', err);
                                        alert('Failed to save loan amount');
                                    }
                                    setLoanLoading(false);
                                }}>Save Loan Amount</button>
                                <button className="btn btn-secondary" onClick={() => setSelectedLoanApp(null)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer />
        </div>
    );
};

export default StaffDashboard;
