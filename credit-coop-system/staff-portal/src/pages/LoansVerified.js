import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const LoansVerified = () => {
    const [verifiedLoans, setVerifiedLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('disbursementDate');

    // Mock data for verified loans
    const mockVerifiedLoans = [
        {
            id: 'LN-2025-001',
            applicationId: 'LA-2025-001',
            borrowerName: 'John Doe',
            membershipNumber: 'MEM-001',
            loanType: 'Personal Loan',
            principalAmount: 50000,
            interestRate: 12.5,
            term: 24,
            monthlyPayment: 2365,
            status: 'active',
            disbursementDate: '2025-09-16',
            maturityDate: '2027-09-16',
            purpose: 'Home renovation',
            totalPaid: 14190,
            remainingBalance: 35810,
            nextPaymentDate: '2025-10-16',
            paymentsCompleted: 6,
            paymentsRemaining: 18,
            paymentStatus: 'current',
            collateral: 'Property Title',
            guarantor: 'Jane Doe',
            loanOfficer: 'Michael Smith',
            creditScore: 720,
            riskRating: 'Low'
        },
        {
            id: 'LN-2025-002',
            applicationId: 'LA-2025-003',
            borrowerName: 'Mike Johnson',
            membershipNumber: 'MEM-003',
            loanType: 'Emergency Loan',
            principalAmount: 25000,
            interestRate: 10.0,
            term: 12,
            monthlyPayment: 2193,
            status: 'active',
            disbursementDate: '2025-09-14',
            maturityDate: '2026-09-14',
            purpose: 'Medical emergency',
            totalPaid: 4386,
            remainingBalance: 20614,
            nextPaymentDate: '2025-10-14',
            paymentsCompleted: 2,
            paymentsRemaining: 10,
            paymentStatus: 'current',
            collateral: 'Salary Assignment',
            guarantor: 'Sarah Johnson',
            loanOfficer: 'Lisa Brown',
            creditScore: 750,
            riskRating: 'Low'
        },
        {
            id: 'LN-2024-015',
            applicationId: 'LA-2024-045',
            borrowerName: 'Alice Cooper',
            membershipNumber: 'MEM-015',
            loanType: 'Business Loan',
            principalAmount: 100000,
            interestRate: 15.0,
            term: 36,
            monthlyPayment: 3466,
            status: 'active',
            disbursementDate: '2024-03-15',
            maturityDate: '2027-03-15',
            purpose: 'Business expansion',
            totalPaid: 62388,
            remainingBalance: 37612,
            nextPaymentDate: '2025-10-15',
            paymentsCompleted: 18,
            paymentsRemaining: 18,
            paymentStatus: 'current',
            collateral: 'Business Assets',
            guarantor: 'Robert Cooper',
            loanOfficer: 'David Wilson',
            creditScore: 690,
            riskRating: 'Medium'
        },
        {
            id: 'LN-2024-008',
            applicationId: 'LA-2024-023',
            borrowerName: 'Peter Williams',
            membershipNumber: 'MEM-008',
            loanType: 'Auto Loan',
            principalAmount: 75000,
            interestRate: 11.5,
            term: 48,
            monthlyPayment: 1945,
            status: 'overdue',
            disbursementDate: '2024-01-10',
            maturityDate: '2028-01-10',
            purpose: 'Vehicle purchase',
            totalPaid: 33723,
            remainingBalance: 41277,
            nextPaymentDate: '2025-09-10',
            paymentsCompleted: 17,
            paymentsRemaining: 31,
            paymentStatus: 'overdue',
            collateral: 'Vehicle',
            guarantor: 'Mary Williams',
            loanOfficer: 'Jennifer Davis',
            creditScore: 650,
            riskRating: 'High'
        },
        {
            id: 'LN-2023-003',
            applicationId: 'LA-2023-012',
            borrowerName: 'Emma Davis',
            membershipNumber: 'MEM-003',
            loanType: 'Personal Loan',
            principalAmount: 30000,
            interestRate: 12.0,
            term: 24,
            monthlyPayment: 1413,
            status: 'completed',
            disbursementDate: '2023-09-20',
            maturityDate: '2025-09-20',
            purpose: 'Education',
            totalPaid: 33912,
            remainingBalance: 0,
            nextPaymentDate: null,
            paymentsCompleted: 24,
            paymentsRemaining: 0,
            paymentStatus: 'completed',
            collateral: 'Salary Assignment',
            guarantor: 'Tom Davis',
            loanOfficer: 'Michael Smith',
            creditScore: 740,
            riskRating: 'Low'
        }
    ];

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setVerifiedLoans(mockVerifiedLoans);
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'status-active';
            case 'completed': return 'status-completed';
            case 'overdue': return 'status-danger';
            case 'defaulted': return 'status-danger';
            default: return 'status-pending';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'current': return 'status-good';
            case 'overdue': return 'status-warning';
            case 'defaulted': return 'status-danger';
            case 'completed': return 'status-completed';
            default: return 'status-pending';
        }
    };

    const getRiskRatingColor = (rating) => {
        switch (rating.toLowerCase()) {
            case 'low': return 'status-good';
            case 'medium': return 'status-warning';
            case 'high': return 'status-danger';
            default: return 'status-pending';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateProgress = (completed, total) => {
        return total > 0 ? (completed / total) * 100 : 0;
    };

    const getDaysOverdue = (nextPaymentDate) => {
        if (!nextPaymentDate) return 0;
        const today = new Date();
        const paymentDate = new Date(nextPaymentDate);
        const diffTime = today - paymentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const handleLoanAction = async (loanId, action) => {
        try {
            // API call would go here
            switch (action) {
                case 'view_details':
                    alert(`Viewing detailed information for loan ${loanId}`);
                    break;
                case 'payment_history':
                    alert(`Viewing payment history for loan ${loanId}`);
                    break;
                case 'send_reminder':
                    alert(`Payment reminder sent for loan ${loanId}`);
                    break;
                case 'restructure':
                    alert(`Initiating restructure process for loan ${loanId}`);
                    break;
                case 'close_loan':
                    alert(`Closing loan ${loanId}`);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error performing loan action:', error);
            alert('Error performing action');
        }
    };

    const sortedAndFilteredLoans = verifiedLoans
        .filter(loan => {
            const matchesStatus = selectedStatus === 'all' || loan.status === selectedStatus;
            const matchesType = selectedType === 'all' || loan.loanType === selectedType;
            const matchesSearch = loan.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                loan.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                loan.id.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesStatus && matchesType && matchesSearch;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'disbursementDate':
                    return new Date(b.disbursementDate) - new Date(a.disbursementDate);
                case 'amount':
                    return b.principalAmount - a.principalAmount;
                case 'nextPayment':
                    return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
                case 'remainingBalance':
                    return b.remainingBalance - a.remainingBalance;
                default:
                    return 0;
            }
        });

    const loanStats = {
        total: verifiedLoans.length,
        active: verifiedLoans.filter(loan => loan.status === 'active').length,
        overdue: verifiedLoans.filter(loan => loan.status === 'overdue').length,
        completed: verifiedLoans.filter(loan => loan.status === 'completed').length,
        totalDisbursed: verifiedLoans.reduce((sum, loan) => sum + loan.principalAmount, 0),
        totalOutstanding: verifiedLoans.filter(loan => loan.status === 'active' || loan.status === 'overdue')
                                      .reduce((sum, loan) => sum + loan.remainingBalance, 0)
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading verified loans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-title">
                    <h1>Verified Loans</h1>
                    <p>Manage and monitor disbursed loans and their payment status</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary">
                        📊 Loan Portfolio Report
                    </button>
                    <button className="btn btn-warning">
                        ⚠️ Overdue Alerts
                    </button>
                    <button className="btn btn-primary">
                        💰 Disbursement Summary
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="metrics-grid">
                <div className="metric-card blue">
                    <div className="metric-icon">📋</div>
                    <div className="metric-content">
                        <div className="metric-value">{loanStats.total}</div>
                        <div className="metric-title">Total Loans</div>
                        <div className="metric-change positive">Portfolio size</div>
                    </div>
                </div>

                <div className="metric-card green">
                    <div className="metric-icon">✅</div>
                    <div className="metric-content">
                        <div className="metric-value">{loanStats.active}</div>
                        <div className="metric-title">Active Loans</div>
                        <div className="metric-change positive">Performing well</div>
                    </div>
                </div>

                <div className="metric-card orange">
                    <div className="metric-icon">⚠️</div>
                    <div className="metric-content">
                        <div className="metric-value">{loanStats.overdue}</div>
                        <div className="metric-title">Overdue Loans</div>
                        <div className="metric-change negative">Needs attention</div>
                    </div>
                </div>

                <div className="metric-card purple">
                    <div className="metric-icon">💰</div>
                    <div className="metric-content">
                        <div className="metric-value">{formatCurrency(loanStats.totalOutstanding).replace('KES', '')}</div>
                        <div className="metric-title">Outstanding Amount</div>
                        <div className="metric-change positive">Portfolio value</div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Loan Portfolio</h2>
                    <div className="section-filters">
                        <input
                            type="text"
                            placeholder="Search loans..."
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
                            <option value="active">Active</option>
                            <option value="overdue">Overdue</option>
                            <option value="completed">Completed</option>
                            <option value="defaulted">Defaulted</option>
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
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="filter-select"
                        >
                            <option value="disbursementDate">Sort by Date</option>
                            <option value="amount">Sort by Amount</option>
                            <option value="nextPayment">Sort by Next Payment</option>
                            <option value="remainingBalance">Sort by Balance</option>
                        </select>
                    </div>
                </div>

                {/* Loans Table */}
                <div className="table-container">
                    {sortedAndFilteredLoans.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">💰</div>
                            <h3>No verified loans found</h3>
                            <p>No loans match your current filters</p>
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Loan ID</th>
                                    <th>Borrower</th>
                                    <th>Loan Details</th>
                                    <th>Payment Progress</th>
                                    <th>Status & Risk</th>
                                    <th>Next Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedAndFilteredLoans.map((loan) => (
                                    <tr key={loan.id}>
                                        <td>
                                            <div>
                                                <strong>{loan.id}</strong>
                                                <div className="detail-row">App: {loan.applicationId}</div>
                                                <div className="detail-row">Officer: {loan.loanOfficer}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="borrower-info">
                                                <div className="member-info">
                                                    <div className="member-avatar">
                                                        {loan.borrowerName.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <div>
                                                        <div className="member-name">{loan.borrowerName}</div>
                                                        <div className="membership-number">{loan.membershipNumber}</div>
                                                        <div className="detail-row">Credit: {loan.creditScore}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="loan-summary">
                                                <div className="loan-type">
                                                    <strong>{loan.loanType}</strong>
                                                    <span className="interest-rate">{loan.interestRate}%</span>
                                                </div>
                                                <div className="detail-row">
                                                    Principal: <strong>{formatCurrency(loan.principalAmount)}</strong>
                                                </div>
                                                <div className="detail-row">
                                                    Monthly: {formatCurrency(loan.monthlyPayment)}
                                                </div>
                                                <div className="detail-row">
                                                    Term: {loan.term} months
                                                </div>
                                                <div className="detail-row">
                                                    Purpose: {loan.purpose}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="loan-progress">
                                                <div className="progress-bar">
                                                    <div 
                                                        className="progress-fill"
                                                        style={{ width: `${calculateProgress(loan.paymentsCompleted, loan.paymentsCompleted + loan.paymentsRemaining)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="progress-text">
                                                    {loan.paymentsCompleted} of {loan.paymentsCompleted + loan.paymentsRemaining} payments
                                                </div>
                                                <div className="detail-row">
                                                    Paid: <strong>{formatCurrency(loan.totalPaid)}</strong>
                                                </div>
                                                <div className="detail-row">
                                                    Balance: <strong>{formatCurrency(loan.remainingBalance)}</strong>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <span className={`status-badge ${getStatusColor(loan.status)}`}>
                                                    {loan.status}
                                                </span>
                                                <div className="detail-row">
                                                    Payment: <span className={`payment-status ${getPaymentStatusColor(loan.paymentStatus)}`}>
                                                        {loan.paymentStatus}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    Risk: <span className={`payment-status ${getRiskRatingColor(loan.riskRating)}`}>
                                                        {loan.riskRating}
                                                    </span>
                                                </div>
                                                {loan.paymentStatus === 'overdue' && (
                                                    <div className="detail-row">
                                                        <span className="status-badge status-danger">
                                                            {getDaysOverdue(loan.nextPaymentDate)} days overdue
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div>
                                                <strong>{formatDate(loan.nextPaymentDate)}</strong>
                                                {loan.nextPaymentDate && (
                                                    <div className="detail-row">
                                                        Amount: {formatCurrency(loan.monthlyPayment)}
                                                    </div>
                                                )}
                                                <div className="detail-row">
                                                    Maturity: {formatDate(loan.maturityDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="approval-actions">
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleLoanAction(loan.id, 'view_details')}
                                                >
                                                    👁️ Details
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleLoanAction(loan.id, 'payment_history')}
                                                >
                                                    📊 History
                                                </button>
                                                {loan.paymentStatus === 'overdue' && (
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => handleLoanAction(loan.id, 'send_reminder')}
                                                    >
                                                        📧 Remind
                                                    </button>
                                                )}
                                                {loan.status === 'active' && (
                                                    <button
                                                        className="btn btn-sm btn-info"
                                                        onClick={() => handleLoanAction(loan.id, 'restructure')}
                                                    >
                                                        🔄 Restructure
                                                    </button>
                                                )}
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

export default LoansVerified;