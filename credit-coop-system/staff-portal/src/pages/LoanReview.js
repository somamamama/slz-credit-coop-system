import React, { useState, useEffect } from 'react';
import './LoanReview.css';

// Simplified Loan Review page for Loan Officers: read-only list of applications
// Shows only the statuses relevant to a loan officer and omits any action buttons or modals
const LoanReview = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: 'all', search: '' });
    const [statistics, setStatistics] = useState({});

    useEffect(() => {
        fetchApplications();
        fetchStatistics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/loan-review/applications', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data && data.success) setApplications(data.applications || []);
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/loan-review/statistics', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (data && data.success) setStatistics(data.statistics || {});
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending_review': return 'status-pending';
            case 'under_review': return 'status-warning';
            case 'approved': return 'status-success';
            case 'rejected': return 'status-danger';
            default: return 'status-pending';
        }
    };

    const filteredApplications = applications.filter((app) => {
        const matchesStatus = filter.status === 'all' || app.review_status === filter.status;
        const search = (filter.search || '').toLowerCase().trim();
        if (!search) return matchesStatus;
        const inName = app.applicant_name?.toLowerCase().includes(search);
        const inId = String(app.application_id).includes(search);
        const inMember = (app.member_number || '').toLowerCase().includes(search);
        return matchesStatus && (inName || inId || inMember);
    });

    if (loading) {
        return (
            <div className="loan-review-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading loan applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="loan-review-container">
            <div className="page-header">
                <h1>🏦 Loan Review (Loan Officer)</h1>
                <p>Read-only list of loan applications by status</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>Pending Review</h3>
                        <span className="stat-number">{statistics.pending_review || 0}</span>
                    </div>
                </div>
                <div className="stat-card under-review">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-content">
                        <h3>Under Review</h3>
                        <span className="stat-number">{statistics.under_review || 0}</span>
                    </div>
                </div>
                <div className="stat-card approved">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Approved</h3>
                        <span className="stat-number">{statistics.approved || 0}</span>
                    </div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                        <h3>Rejected</h3>
                        <span className="stat-number">{statistics.rejected || 0}</span>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Search by applicant, member no or id..."
                        value={filter.search}
                        onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        className="search-input"
                    />
                    <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="filter-select">
                        <option value="all">All Status</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="applications-section">
                <div className="table-container">
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>Application ID</th>
                                <th>Applicant Name</th>
                                <th>Member Number</th>
                                <th>Status</th>
                                <th>Submitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map((app) => (
                                <tr key={app.application_id}>
                                    <td><strong>#{app.application_id}</strong></td>
                                    <td>{app.applicant_name}</td>
                                    <td>{app.member_number || ''}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(app.review_status)}`}>
                                            {String(app.review_status || '').replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{formatDate(app.submitted_at)}</td>
                                </tr>
                            ))}
                            {filteredApplications.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LoanReview;
