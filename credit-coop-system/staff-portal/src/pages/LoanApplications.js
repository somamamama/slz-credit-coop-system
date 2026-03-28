import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const LoanApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data - replace with actual API calls
    const mockApplications = [
        {
            id: 'LA-2025-001',
            applicantName: 'John Doe',
            membershipNumber: 'MEM-001',
            loanType: 'Personal Loan',
            amount: 50000,
            interestRate: 12.5,
            term: 24,
            status: 'pending',
            priority: 'high',
            applicationDate: '2025-09-15',
            purpose: 'Home renovation',
            creditScore: 720,
            monthlyIncome: 75000,
            employment: 'Software Engineer',
            collateral: 'Property Title',
            documents: ['ID Copy', 'Income Certificate', 'Bank Statements']
        },
        {
            id: 'LA-2025-002',
            applicantName: 'Jane Smith',
            membershipNumber: 'MEM-002',
            loanType: 'Business Loan',
            amount: 150000,
            interestRate: 15.0,
            term: 36,
            status: 'under_review',
            priority: 'medium',
            applicationDate: '2025-09-14',
            purpose: 'Business expansion',
            creditScore: 680,
            monthlyIncome: 120000,
            employment: 'Business Owner',
            collateral: 'Business Assets',
            documents: ['Business License', 'Financial Statements', 'Tax Returns']
        },
        {
            id: 'LA-2025-003',
            applicantName: 'Mike Johnson',
            membershipNumber: 'MEM-003',
            loanType: 'Emergency Loan',
            amount: 25000,
            interestRate: 10.0,
            term: 12,
            status: 'approved',
            priority: 'high',
            applicationDate: '2025-09-13',
            purpose: 'Medical emergency',
            creditScore: 750,
            monthlyIncome: 60000,
            employment: 'Teacher',
            collateral: 'Salary Assignment',
            documents: ['Medical Bills', 'Employment Letter', 'ID Copy']
        },
        {
            id: 'LA-2025-004',
            applicantName: 'Sarah Wilson',
            membershipNumber: 'MEM-004',
            loanType: 'Auto Loan',
            amount: 80000,
            interestRate: 11.5,
            term: 48,
            status: 'rejected',
            priority: 'low',
            applicationDate: '2025-09-12',
            purpose: 'Vehicle purchase',
            creditScore: 620,
            monthlyIncome: 45000,
            employment: 'Sales Executive',
            collateral: 'Vehicle',
            documents: ['Vehicle Invoice', 'Insurance Quote', 'Income Statement']
        }
    ];

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setApplications(mockApplications);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'status-pending';
            case 'under_review': return 'status-warning';
            case 'approved': return 'status-completed';
            case 'rejected': return 'status-danger';
            default: return 'status-pending';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'priority-high';
            case 'medium': return 'priority-medium';
            case 'low': return 'priority-low';
            default: return 'priority-medium';
        }
    };

    const getCreditScoreColor = (score) => {
        if (score >= 700) return 'credit-score good';
        if (score >= 600) return 'credit-score fair';
        return 'credit-score poor';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            // API call would go here
            setApplications(prev => 
                prev.map(app => 
                    app.id === applicationId 
                        ? { ...app, status: newStatus }
                        : app
                )
            );
            alert(`Application ${applicationId} status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating application status');
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesStatus = selectedStatus === 'all' || app.status === selectedStatus;
        const matchesType = selectedType === 'all' || app.loanType === selectedType;
        const matchesSearch = app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            app.id.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesStatus && matchesType && matchesSearch;
    });

    const applicationStats = {
        total: applications.length,
        pending: applications.filter(app => app.status === 'pending').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading loan applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-title">
                    <h1>Loan Applications</h1>
                    <p>Manage and process member loan applications</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary">
                        📊 Generate Report
                    </button>
                    <button className="btn btn-primary">
                        ➕ New Application
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="metrics-grid">
                <div className="metric-card blue">
                    <div className="metric-icon">📋</div>
                    <div className="metric-content">
                        <div className="metric-value">{applicationStats.total}</div>
                        <div className="metric-title">Total Applications</div>
                        <div className="metric-change positive">+5% from last month</div>
                    </div>
                </div>

                <div className="metric-card orange">
                    <div className="metric-icon">⏳</div>
                    <div className="metric-content">
                        <div className="metric-value">{applicationStats.pending}</div>
                        <div className="metric-title">Pending Review</div>
                        <div className="metric-change positive">Requires attention</div>
                    </div>
                </div>

                <div className="metric-card green">
                    <div className="metric-icon">✅</div>
                    <div className="metric-content">
                        <div className="metric-value">{applicationStats.approved}</div>
                        <div className="metric-title">Approved</div>
                        <div className="metric-change positive">+12% approval rate</div>
                    </div>
                </div>

                <div className="metric-card purple">
                    <div className="metric-icon">❌</div>
                    <div className="metric-content">
                        <div className="metric-value">{applicationStats.rejected}</div>
                        <div className="metric-title">Rejected</div>
                        <div className="metric-change negative">Quality improving</div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Loan Applications</h2>
                    <div className="section-filters">
                        <input
                            type="text"
                            placeholder="Search applications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid var(--gray-300)',
                                borderRadius: '6px',
                                minWidth: '200px'
                            }}
                        />
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Types</option>
                            <option value="Personal Loan">Personal Loan</option>
                            <option value="Business Loan">Business Loan</option>
                            <option value="Emergency Loan">Emergency Loan</option>
                            <option value="Auto Loan">Auto Loan</option>
                        </select>
                    </div>
                </div>

                {/* Applications Table */}
                <div className="table-container">
                    {filteredApplications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📋</div>
                            <h3>No applications found</h3>
                            <p>No loan applications match your current filters</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Application ID</th>
                                    <th>Applicant</th>
                                    <th>Loan Details</th>
                                    <th>Credit Info</th>
                                    <th>Status</th>
                                    <th>Date Applied</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.map((application) => (
                                    <tr key={application.id}>
                                        <td>
                                            <div>
                                                <strong>{application.id}</strong>
                                                <div className={`priority-badge ${getPriorityColor(application.priority)}`}>
                                                    {application.priority} priority
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="applicant-info">
                                                <div className="member-info">
                                                    <div className="member-avatar">
                                                        {application.applicantName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div className="member-name">{application.applicantName}</div>
                                                        <div className="membership-number">{application.membershipNumber}</div>
                                                        <div className="detail-row">{application.employment}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="loan-summary">
                                                <div className="loan-type">
                                                    <strong>{application.loanType}</strong>
                                                    <span className="interest-rate">{application.interestRate}%</span>
                                                </div>
                                                <div className="detail-row">
                                                    Amount: <strong>{formatCurrency(application.amount)}</strong>
                                                </div>
                                                <div className="detail-row">
                                                    Term: {application.term} months
                                                </div>
                                                <div className="detail-row">
                                                    Purpose: {application.purpose}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                Credit Score: 
                                                <span className={getCreditScoreColor(application.creditScore)}>
                                                    {application.creditScore}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                Income: {formatCurrency(application.monthlyIncome)}/month
                                            </div>
                                            <div className="detail-row">
                                                Collateral: {application.collateral}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatusColor(application.status)}`}>
                                                {application.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{formatDate(application.applicationDate)}</td>
                                        <td>
                                            <div className="approval-actions">
                                                {application.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleStatusChange(application.id, 'approved')}
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleStatusChange(application.id, 'rejected')}
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </>
                                                )}
                                                {application.status === 'under_review' && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => alert(`Reviewing ${application.id}`)}
                                                    >
                                                        📝 Review
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => alert(`Viewing details for ${application.id}`)}
                                                >
                                                    👁️ View
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoanApplications;