import React, { useState, useEffect } from 'react';
import './LoanApproval.css';
import { ReactComponent as HourglassIcon } from './assets/hourglass-svgrepo-com.svg';
import { ReactComponent as MagnifyIcon } from './assets/magnifying-glass-svgrepo-com.svg';
import { ReactComponent as CheckCircleIcon } from './assets/check-circle-svgrepo-com.svg';
import { ReactComponent as CrossIcon } from './assets/cross-svgrepo-com.svg';

const LoanApproval = () => {
    const [applications, setApplications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: 'under_review',
        priority: 'all',
        search: ''
    });
    const [approvalForm, setApprovalForm] = useState({
        action: '',
        notes: ''
    });
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [statistics, setStatistics] = useState({});

    useEffect(() => {
        fetchApplications();
        fetchStatistics();
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/loan-review/applications', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setApplications(data.applications);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/loan-review/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setStatistics(data.statistics);
            }
        } catch (error) {
            console.error('Error fetching statistics:', error);
        }
    };

    const fetchApplicationDetails = async (id) => {
        try {
            const response = await fetch(`http://localhost:5000/api/loan-review/applications/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSelectedApplication(data);
            }
        } catch (error) {
            console.error('Error fetching application details:', error);
        }
    };

    const handleApproval = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/loan-review/applications/${selectedApplication.application.application_id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    ...approvalForm,
                    manager_id: JSON.parse(localStorage.getItem('userInfo') || '{}').id
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message);
                setShowApprovalModal(false);
                fetchApplications();
                setApprovalForm({
                    action: '',
                    notes: ''
                });
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error approving application:', error);
            alert('Error processing approval');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending_review': return 'status-pending';
            case 'under_review': return 'status-warning';
            case 'approved': return 'status-success';
            case 'rejected': return 'status-danger';
            case 'returned': return 'status-info';
            default: return 'status-pending';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'priority-urgent';
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredApplications = applications.filter(app => {
        const matchesStatus = filter.status === 'all' || app.review_status === filter.status;
        const matchesPriority = filter.priority === 'all' || app.priority_level === filter.priority;
        const matchesSearch = app.applicant_name?.toLowerCase().includes(filter.search.toLowerCase()) ||
                            app.application_id.toString().includes(filter.search);
        
        return matchesStatus && matchesPriority && matchesSearch;
    });

    if (loading) {
        return (
            <div className="loan-approval-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading loan applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="loan-approval-container">
            {/* Header */}
            <div className="page-header">
                <h1>Loan Approval Dashboard</h1>
                <p>Review and approve loan applications recommended by loan officers</p>
            </div>

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card pending">
                    <div className="stat-icon"><HourglassIcon className="stat-icon-svg" /></div>
                    <div className="stat-content">
                        <h3>Pending Review</h3>
                        <span className="stat-number">{statistics.pending_review || 0}</span>
                    </div>
                </div>
                <div className="stat-card under-review">
                    <div className="stat-icon"><MagnifyIcon className="stat-icon-svg" /></div>
                    <div className="stat-content">
                        <h3>Awaiting Approval</h3>
                        <span className="stat-number">{statistics.under_review || 0}</span>
                    </div>
                </div>
                <div className="stat-card approved">
                    <div className="stat-icon"><CheckCircleIcon className="stat-icon-svg" /></div>
                    <div className="stat-content">
                        <h3>Approved</h3>
                        <span className="stat-number">{statistics.approved || 0}</span>
                    </div>
                </div>
                <div className="stat-card rejected">
                    <div className="stat-icon"><CrossIcon className="stat-icon-svg" /></div>
                    <div className="stat-content">
                        <h3>Rejected</h3>
                        <span className="stat-number">{statistics.rejected || 0}</span>
                    </div>
                </div>
                {/* Removed Urgent card to match requested style */}
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={filter.search}
                        onChange={(e) => setFilter({...filter, search: e.target.value})}
                        className="search-input"
                    />
                    <select
                        value={filter.status}
                        onChange={(e) => setFilter({...filter, status: e.target.value})}
                        className="filter-select"
                    >
                        <option value="all">All Status</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="under_review">Awaiting Approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="returned">Returned</option>
                    </select>
                    <select
                        value={filter.priority}
                        onChange={(e) => setFilter({...filter, priority: e.target.value})}
                        className="filter-select"
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Applications Table */}
            <div className="applications-section">
                <div className="table-container">
                    <table className="applications-table">
                        <thead>
                            <tr>
                                <th>Application ID</th>
                                <th>Applicant</th>
                                <th>Application ID</th>
                                <th>Member Number</th>
                                <th>Applicant Name</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredApplications.map((app) => (
                                <tr key={app.application_id}>
                                    <td>
                                        <div className="app-id">
                                            <strong>#{app.application_id}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="applicant-info">
                                            <div className="applicant-name">{app.applicant_name}</div>
                                            <div className="applicant-email">{app.applicant_email}</div>
                                        </div>
                                    </td>
                                    <td>{app.application_id}</td>
                                    <td>{app.member_number}</td>
                                    <td>{app.first_name} {app.middle_name} {app.last_name}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(app.review_status)}`}> 
                                            {app.review_status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>{formatDate(app.submitted_at)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {app.review_status === 'under_review' && (
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => {
                                                        fetchApplicationDetails(app.application_id);
                                                        setShowApprovalModal(true);
                                                    }}
                                                >
                                                    Review & Approve
                                                </button>
                                            )}
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    fetchApplicationDetails(app.application_id);
                                                    setShowApprovalModal(true);
                                                }}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Approval Modal */}
            {showApprovalModal && selectedApplication && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Review Application #{selectedApplication.application.application_id}</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowApprovalModal(false)}
                                aria-label="Close"
                            >
                                <CrossIcon className="close-icon" />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="application-details">
                                {/* Applicant Information */}
                                <div className="detail-section">
                                    <h3>Applicant Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Name:</label>
                                            <span>{selectedApplication.application.applicant_name}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Email:</label>
                                            <span>{selectedApplication.application.applicant_email}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Loan Information */}
                                {/* Application Details */}
                                <div className="detail-section">
                                    <h3>Application Details</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Application ID:</label> <span>{selectedApplication.application.application_id}</span></div>
                                        <div className="info-item"><label>Member Number:</label> <span>{selectedApplication.application.member_number}</span></div>
                                        <div className="info-item"><label>Status:</label> <span>{selectedApplication.application.status}</span></div>
                                        <div className="info-item"><label>Submitted At:</label> <span>{formatDate(selectedApplication.application.submitted_at)}</span></div>
                                        <div className="info-item"><label>Reviewed At:</label> <span>{selectedApplication.application.reviewed_at ? formatDate(selectedApplication.application.reviewed_at) : 'Not reviewed'}</span></div>
                                        <div className="info-item"><label>Reviewed By:</label> <span>{selectedApplication.application.reviewed_by || 'N/A'}</span></div>
                                    </div>
                                </div>
                                {/* Applicant Information */}
                                <div className="detail-section">
                                    <h3>Applicant Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Name:</label> <span>{selectedApplication.application.first_name} {selectedApplication.application.middle_name} {selectedApplication.application.last_name}</span></div>
                                        <div className="info-item"><label>Gender:</label> <span>{selectedApplication.application.gender}</span></div>
                                        <div className="info-item"><label>Civil Status:</label> <span>{selectedApplication.application.civil_status}</span></div>
                                        <div className="info-item"><label>Birth Date:</label> <span>{formatDate(selectedApplication.application.birth_date)}</span></div>
                                        <div className="info-item"><label>Landline:</label> <span>{selectedApplication.application.landline}</span></div>
                                        <div className="info-item"><label>Mobile Number:</label> <span>{selectedApplication.application.mobile_number}</span></div>
                                        <div className="info-item"><label>Email Address:</label> <span>{selectedApplication.application.email_address}</span></div>
                                    </div>
                                </div>
                                {/* Address Information */}
                                <div className="detail-section">
                                    <h3>Address Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Current Address:</label> <span>{selectedApplication.application.current_address}</span></div>
                                        <div className="info-item"><label>Years of Stay (Current):</label> <span>{selectedApplication.application.years_of_stay_current}</span></div>
                                        <div className="info-item"><label>Permanent Address:</label> <span>{selectedApplication.application.permanent_address}</span></div>
                                        <div className="info-item"><label>Years of Stay (Permanent):</label> <span>{selectedApplication.application.years_of_stay_permanent}</span></div>
                                        <div className="info-item"><label>Home Ownership:</label> <span>{selectedApplication.application.home_ownership}</span></div>
                                    </div>
                                </div>
                                {/* Family Information */}
                                <div className="detail-section">
                                    <h3>Family Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Spouse Name:</label> <span>{selectedApplication.application.spouse_name}</span></div>
                                        <div className="info-item"><label>Number of Children:</label> <span>{selectedApplication.application.number_of_children}</span></div>
                                    </div>
                                </div>
                                {/* Employment Information */}
                                <div className="detail-section">
                                    <h3>Employment Information</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Date Hired:</label> <span>{formatDate(selectedApplication.application.date_hired)}</span></div>
                                        <div className="info-item"><label>Company/Business:</label> <span>{selectedApplication.application.company_business}</span></div>
                                        <div className="info-item"><label>Contract Period:</label> <span>{selectedApplication.application.contract_period}</span></div>
                                        <div className="info-item"><label>Designation/Position:</label> <span>{selectedApplication.application.designation_position}</span></div>
                                        <div className="info-item"><label>Years in Company:</label> <span>{selectedApplication.application.years_in_company}</span></div>
                                    </div>
                                </div>
                                {/* Document File Paths */}
                                <div className="detail-section">
                                    <h3>Documents</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Gov ID File:</label> <span>{selectedApplication.application.gov_id_file_path}</span></div>
                                        <div className="info-item"><label>Company ID File:</label> <span>{selectedApplication.application.company_id_file_path}</span></div>
                                    </div>
                                </div>
                                {/* Notes and Comments */}
                                <div className="detail-section">
                                    <h3>Notes & Comments</h3>
                                    <div className="info-grid">
                                        <div className="info-item"><label>Application Notes:</label> <span>{selectedApplication.application.application_notes || 'None'}</span></div>
                                        <div className="info-item"><label>Reviewer Comments:</label> <span>{selectedApplication.application.reviewer_comments || 'No comments provided'}</span></div>
                                    </div>
                                </div>
                                
                                {/* Review History */}
                                {selectedApplication.reviewHistory && selectedApplication.reviewHistory.length > 0 && (
                                    <div className="detail-section">
                                        <h3>Review History</h3>
                                        <div className="history-list">
                                            {selectedApplication.reviewHistory.map((history, index) => (
                                                <div key={index} className="history-item">
                                                    <div className="history-header">
                                                        <span className="history-action">{history.action_taken.replace('_', ' ')}</span>
                                                        <span className="history-date">{formatDate(history.created_at)}</span>
                                                    </div>
                                                    <div className="history-reviewer">
                                                        By: {history.reviewer_name} ({history.reviewer_role})
                                                    </div>
                                                    {history.notes && (
                                                        <div className="history-notes">{history.notes}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Manager Decision */}
                                {selectedApplication.application.review_status === 'under_review' && (
                                    <div className="detail-section">
                                        <h3>Manager Decision</h3>
                                        <div className="form-group">
                                            <label>Decision</label>
                                            <select
                                                value={approvalForm.action}
                                                onChange={(e) => setApprovalForm({...approvalForm, action: e.target.value})}
                                            >
                                                <option value="">Select decision</option>
                                                <option value="approve">Approve Loan</option>
                                                <option value="reject">Reject Application</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Manager Notes</label>
                                            <textarea
                                                value={approvalForm.notes}
                                                onChange={(e) => setApprovalForm({...approvalForm, notes: e.target.value})}
                                                placeholder="Enter your decision notes..."
                                                rows="4"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowApprovalModal(false)}
                            >
                                Close
                            </button>
                            {selectedApplication.application.review_status === 'under_review' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={handleApproval}
                                    disabled={!approvalForm.action}
                                >
                                    Submit Decision
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanApproval;
