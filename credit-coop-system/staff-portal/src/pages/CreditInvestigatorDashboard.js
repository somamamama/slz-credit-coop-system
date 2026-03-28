
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Dashboard.css';
import '../status-badge.css';
import { resolveRuntimeUrl } from '../runtimeUrlConfig';

const CreditInvestigatorDashboard = () => {
  const [loanApplications, setLoanApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [statistics, setStatistics] = useState({});
  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });
  const [lastPendingCount, setLastPendingCount] = useState(0);
  const [newSubmissionAlert, setNewSubmissionAlert] = useState({ visible: false, count: 0 });

  useEffect(() => {
    const userInfoRaw = localStorage.getItem('userInfo');
    if (userInfoRaw) {
      try {
        const userInfo = JSON.parse(userInfoRaw);
        setUserRole(userInfo.role || '');
      } catch {
        setUserRole('');
      }
    }
  }, []);

  useEffect(() => {
    if (userRole === 'credit_investigator') {
      axios.get('http://localhost:5000/api/loan-review/applications?reviewer_role=credit_investigator')
        .then(res => {
          if (res.data.success) {
            setLoanApplications(res.data.applications);
            // initialize lastPendingCount from returned applications (pending_review)
            const pending = (res.data.applications || []).filter(a => a.review_status === 'pending_review').length;
            setLastPendingCount(pending);
          } else {
            setLoanApplications([]);
          }
        })
        .catch(() => setLoanApplications([]));
      axios.get('http://localhost:5000/api/loan-review/statistics')
        .then(res => {
          if (res.data.success) {
            setStatistics(res.data.statistics);
            // also initialize lastPendingCount from statistics if available
            if (typeof res.data.statistics?.pending_review === 'number') {
              setLastPendingCount(res.data.statistics.pending_review);
            }
          }
        });
    }
  }, [userRole]);

  // Socket.io: listen for real-time new_application events
  useEffect(() => {
    if (userRole !== 'credit_investigator') return;
    let socket;
    try {
      socket = io(resolveRuntimeUrl('http://localhost:5000'));
      socket.on('connect', () => {
        console.log('Connected to staff notification socket', socket.id);
        socket.emit('join', { role: 'credit_investigator' });
      });

      socket.on('new_application', (payload) => {
        try {
          // show a prominent toast and also banner
          const name = `${payload.first_name || ''} ${payload.last_name || ''}`.trim();
          const message = name ? `New loan application from ${name}` : 'New loan application received';
          // large toast with action
          toast.info(
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: '700' }}>{message}</div>
              <div style={{ fontSize: 12, color: '#444' }}>Application ID: {payload.application_id} • Member: {payload.member_number}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => { handleReview({ application_id: payload.application_id }); toast.dismiss(); }}>Open</button>
                <button className="btn btn-secondary" onClick={() => toast.dismiss()}>Dismiss</button>
              </div>
            </div>,
            { position: 'top-right', autoClose: false, closeOnClick: false, draggable: false, toastId: `new-app-${payload.application_id}`, style: { zIndex: 999999 } }
          );

          // update local state badge/banner
          setNewSubmissionAlert({ visible: true, count: (newSubmissionAlert.count || 0) + 1 });
          // optionally prepend to list so investigator sees it immediately
          setLoanApplications(prev => prev ? [payload, ...prev] : [payload]);
        } catch (e) {
          console.error('Error handling new_application socket:', e);
        }
      });

      socket.on('connect_error', (err) => console.warn('Socket connect error', err));
    } catch (err) {
      console.warn('Socket.io init failed:', err);
    }

    return () => {
      try { if (socket && socket.disconnect) socket.disconnect(); } catch (e) {}
    };
  }, [userRole]);

  // Poll statistics for new submissions and show alert when new pending applications arrive
  useEffect(() => {
    if (userRole !== 'credit_investigator') return;
    let cancelled = false;
    const pollInterval = setInterval(async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/loan-review/statistics');
        if (res.data?.success && !cancelled) {
          const pending = Number(res.data.statistics?.pending_review || 0);
          // if pending increased compared to last seen, show alert
          if (pending > lastPendingCount) {
            setNewSubmissionAlert({ visible: true, count: pending - lastPendingCount });
            setLastPendingCount(pending);
          } else if (pending < lastPendingCount) {
            // update last seen if backlog decreased (someone processed apps)
            setLastPendingCount(pending);
          }
          setStatistics(res.data.statistics);
        }
      } catch (err) {
        // ignore polling errors silently
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [userRole, lastPendingCount]);

  const handleReview = async (application) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/loan-review/applications/${application.application_id}`);
      if (res.data.success) {
        setSelectedApplication(res.data.application);
      } else {
        setSelectedApplication(application);
      }
    } catch {
      setSelectedApplication(application);
    }
  };

  const handleSendToManager = async (applicationId) => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/loan-review/applications/${applicationId}/review`, {
        action: 'approve_for_manager',
        notes: 'Reviewed by credit investigator',
        reviewer_id: 'credit_investigator',
      });
      setSelectedApplication(null);
      axios.get('http://localhost:5000/api/loan-review/applications?reviewer_role=credit_investigator')
        .then(res => {
          if (res.data.success) {
            setLoanApplications(res.data.applications);
          } else {
            setLoanApplications([]);
          }
        })
        .catch(() => setLoanApplications([]));
    } catch (err) {}
    setLoading(false);
  };

  const handleDismissAlert = () => {
    setNewSubmissionAlert({ visible: false, count: 0 });
  };

  const handleViewNewSubmissions = async () => {
    // Refresh applications list and close alert
    try {
      const res = await axios.get('http://localhost:5000/api/loan-review/applications?reviewer_role=credit_investigator');
      if (res.data.success) {
        setLoanApplications(res.data.applications);
      }
    } catch (err) {
      // ignore
    }
    setNewSubmissionAlert({ visible: false, count: 0 });
  };

  const filteredApplications = loanApplications.filter(app => {
    const matchesStatus = filter.status === 'all' || app.review_status === filter.status;
    const matchesPriority = filter.priority === 'all' || app.priority_level === filter.priority;
    const matchesSearch = (app.applicant_name || '').toLowerCase().includes(filter.search.toLowerCase()) ||
      app.application_id.toString().includes(filter.search);
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (userRole !== 'credit_investigator') {
    return (
      <div className="dashboard-container">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container credit-investigator-dashboard">
      <div className="page-header">
        <h1>🕵️‍♂️ Credit Investigator Dashboard</h1>
        <p>Review loan applications and send to manager for approval</p>
      </div>
      {/* Toast container for real-time notifications */}
  <ToastContainer position="top-right" newestOnTop />
      {newSubmissionAlert.visible && (
        <div className="new-submission-alert" style={{ margin: '12px 0', padding: '12px', background: '#fff4e6', border: '1px solid #ffd7a6', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>New loan application{newSubmissionAlert.count > 1 ? 's' : ''} submitted</strong>
            <div style={{ color: '#666' }}>{newSubmissionAlert.count} new application{newSubmissionAlert.count > 1 ? 's' : ''} awaiting review.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handleViewNewSubmissions}>View</button>
            <button className="btn btn-secondary" onClick={handleDismissAlert}>Dismiss</button>
          </div>
        </div>
      )}
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
            <h3>Awaiting Approval</h3>
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
            placeholder="Search applications..."
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
            className="search-input"
          />
          <select
            value={filter.status}
            onChange={e => setFilter({ ...filter, status: e.target.value })}
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
            onChange={e => setFilter({ ...filter, priority: e.target.value })}
            className="filter-select"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr><td colSpan={6}>No loan applications to review.</td></tr>
              ) : (
                filteredApplications.map(app => {
                  // ensure we never call string methods on undefined
                  const rawStatus = app.review_status ?? app.status ?? 'unknown';
                  const displayStatus = String(rawStatus).replace(/_/g, ' ').toUpperCase();
                  const badgeClass = (rawStatus === 'active') ? 'status-active' : '';
                  return (
                    <tr key={app.application_id}>
                      <td>{app.application_id}</td>
                      <td>{app.applicant_name || `${app.first_name} ${app.middle_name} ${app.last_name}`}</td>
                      <td>{app.member_number}</td>
                      <td>
                        <span className={`status-badge ${badgeClass}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleReview(app)}>
                          {rawStatus === 'approved' ? 'View Review' : 'Review'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Review Application #{selectedApplication.application_id}</h2>
              <button className="close-btn" onClick={() => setSelectedApplication(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Application Details */}
              <div className="detail-section">
                <h3>Application Details</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Application ID:</label> <span>{selectedApplication.application_id}</span></div>
                  <div className="info-item"><label>Member Number:</label> <span>{selectedApplication.member_number}</span></div>
                  <div className="info-item"><label>Status:</label> <span>{selectedApplication.status}</span></div>
                  <div className="info-item"><label>Submitted At:</label> <span>{selectedApplication.submitted_at ? new Date(selectedApplication.submitted_at).toLocaleString() : 'N/A'}</span></div>
                  <div className="info-item"><label>Reviewed At:</label> <span>{selectedApplication.reviewed_at ? new Date(selectedApplication.reviewed_at).toLocaleString() : 'N/A'}</span></div>
                  <div className="info-item"><label>Reviewed By:</label> <span>{selectedApplication.reviewed_by || 'N/A'}</span></div>
                </div>
              </div>
              {/* Applicant Information */}
              <div className="detail-section">
                <h3>Applicant Information</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Name:</label> <span>{selectedApplication.applicant_name || `${selectedApplication.first_name} ${selectedApplication.middle_name} ${selectedApplication.last_name}`}</span></div>
                  <div className="info-item"><label>Gender:</label> <span>{selectedApplication.gender}</span></div>
                  <div className="info-item"><label>Civil Status:</label> <span>{selectedApplication.civil_status}</span></div>
                  <div className="info-item"><label>Birth Date:</label> <span>{selectedApplication.birth_date ? new Date(selectedApplication.birth_date).toLocaleString() : 'N/A'}</span></div>
                  <div className="info-item"><label>Landline:</label> <span>{selectedApplication.landline}</span></div>
                  <div className="info-item"><label>Mobile Number:</label> <span>{selectedApplication.mobile_number}</span></div>
                  <div className="info-item"><label>Email Address:</label> <span>{selectedApplication.email_address}</span></div>
                  <div className="info-item"><label>Facebook Account:</label> <span>{selectedApplication.facebook_account ? (<a href={`https://facebook.com/${selectedApplication.facebook_account}`} target="_blank" rel="noopener noreferrer">{selectedApplication.facebook_account}</a>) : 'N/A'}</span></div>
                </div>
              </div>
              {/* Address Information */}
              <div className="detail-section">
                <h3>Address Information</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Current Address:</label> <span>{selectedApplication.current_address}</span></div>
                  <div className="info-item"><label>Years of Stay (Current):</label> <span>{selectedApplication.years_of_stay_current}</span></div>
                  <div className="info-item"><label>Permanent Address:</label> <span>{selectedApplication.permanent_address}</span></div>
                  <div className="info-item"><label>Years of Stay (Permanent):</label> <span>{selectedApplication.years_of_stay_permanent}</span></div>
                  <div className="info-item"><label>Home Ownership:</label> <span>{selectedApplication.home_ownership}</span></div>
                </div>
              </div>
              {/* Family Information */}
              <div className="detail-section">
                <h3>Family Information</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Spouse Name:</label> <span>{selectedApplication.spouse_name}</span></div>
                  <div className="info-item"><label>Number of Children:</label> <span>{selectedApplication.number_of_children}</span></div>
                </div>
              </div>
              {/* Employment Information */}
              <div className="detail-section">
                <h3>Employment Information</h3>
                <div className="info-grid">
                  <div className="info-item"><label>Date Hired:</label> <span>{selectedApplication.date_hired ? new Date(selectedApplication.date_hired).toLocaleString() : 'N/A'}</span></div>
                  <div className="info-item"><label>Company/Business:</label> <span>{selectedApplication.company_business}</span></div>
                  <div className="info-item"><label>Contract Period:</label> <span>{selectedApplication.contract_period}</span></div>
                  <div className="info-item"><label>Designation/Position:</label> <span>{selectedApplication.designation_position}</span></div>
                  <div className="info-item"><label>Years in Company:</label> <span>{selectedApplication.years_in_company}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedApplication.review_status !== 'approved' && (
                <button className="btn btn-primary" onClick={() => handleSendToManager(selectedApplication.application_id)} disabled={loading}>
                  {loading ? 'Sending...' : 'Send to Manager for Approval'}
                </button>
              )}
              {/* Loan amount assignment has moved to the Administrator dashboard. */}
              {selectedApplication.review_status === 'approved' && (
                <div style={{width: '100%', marginTop: '1rem'}}>
                  <p><em>Loan amount assignment and deductions calculation are handled by administrators. Please forward this application to an admin for finalization.</em></p>
                </div>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedApplication(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditInvestigatorDashboard;
