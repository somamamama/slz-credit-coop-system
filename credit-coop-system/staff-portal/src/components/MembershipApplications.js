import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { useUserRole } from '../hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import './MembershipApplications.css';
import { resolveRuntimeUrl } from '../runtimeUrlConfig';

const MembershipApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [membershipNumber, setMembershipNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const { userRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Helper function to generate suggested membership number
  const generateSuggestedMembershipNumber = () => {
    const currentYear = new Date().getFullYear();
    const yy = String(currentYear).slice(-2);
    const applicationId = selectedApplication?.application_id || Date.now();
    // Fallback format: MEM + YY + sequence padded to 5 digits (uses application id as best-effort sequence)
    return `MEM${yy}${String(applicationId).padStart(5, '0')}`;
  };

  const fetchSuggestedMembershipNumber = async (applicationId) => {
    try {
      const res = await fetch(`http://localhost:3002/api/membership-applications/${applicationId}/suggest-membership-number`);
      const body = await res.json();
      if (res.ok && body && body.membershipNumber) {
        return body.membershipNumber;
      }
    } catch (err) {
      console.warn('Failed to fetch suggested membership number:', err);
    }
    return null;
  };

  // refs to track previous count and initial load
  const prevCountRef = useRef(0);
  const firstLoadRef = useRef(true);
  // track the toast id for socket disconnect so we only show it once
  const disconnectToastIdRef = useRef(null);

  useEffect(() => {
    // initial load
    fetchApplications();

    // Setup websocket for real-time new-application events
    let socket;
    try {
      socket = io(resolveRuntimeUrl('http://localhost:3002'));
      socket.on('connect', () => {
        console.log('Socket connected to landing-page server');
        // if we had shown a disconnect toast, dismiss it now
        try {
          if (disconnectToastIdRef.current) {
            toast.dismiss(disconnectToastIdRef.current);
            disconnectToastIdRef.current = null;
            // show a small reconnected toast so user knows notifications resumed
            toast.success('Reconnected to notifications.', { position: 'top-right', autoClose: 3000 });
          }
        } catch (e) {
          console.warn('Error dismissing disconnect toast:', e);
        }

        // join a role-based room using the user's role
        try {
          const role = userRole || 'admin';
          socket.emit('join', { role });
        } catch (e) {
          console.warn('Failed to emit join with role:', e);
        }
      });

      socket.on('new-application', (newApp) => {
        try {
          setApplications((prev) => [newApp, ...prev]);
          const applicantName = `${newApp.first_name || ''} ${newApp.last_name || ''}`.trim();
          const message = applicantName ? `New membership application from ${applicantName}.` : 'New membership application.';
          console.log('MembershipApplications: showing toast ->', message);
          toast.info(message, { position: 'top-right', autoClose: 8000 });
        } catch (e) {
          console.error('Error handling new-application socket event:', e);
        }
      });

      // Notification when an application is forwarded to manager (On Process)
      socket.on('application-on-process', (app) => {
        try {
          // update the list if present
          setApplications((prev) => prev.map((p) => (p.application_id === app.application_id ? app : p)));
          const applicantName = `${app.first_name || ''} ${app.last_name || ''}`.trim();
          const message = applicantName ? `Application for ${applicantName} is now On Process.` : 'An application is now On Process.';
          console.log('MembershipApplications: showing on-process toast ->', message);
          toast.info(message, { position: 'top-right', autoClose: 8000 });
        } catch (e) {
          console.error('Error handling application-on-process socket event:', e);
        }
      });

      // Notification when an application is approved (notify IT admins)
      socket.on('application-approved', (app) => {
        try {
          // update the list if present
          setApplications((prev) => prev.map((p) => (p.application_id === app.application_id ? app : p)));
          const applicantName = `${app.first_name || ''} ${app.last_name || ''}`.trim();
          const message = applicantName ? `Application for ${applicantName} has been approved.` : 'An application has been approved.';
          console.log('MembershipApplications: showing approved toast ->', message);
          toast.success(message, { position: 'top-right', autoClose: 8000 });
        } catch (e) {
          console.error('Error handling application-approved socket event:', e);
        }
      });

        // Notification when a member account is created (by IT admins)
        socket.on('account-created', (member) => {
          try {
            const who = member && (member.member_name || member.user_email || member.member_number) ? (member.member_name || member.user_email || member.member_number) : 'a member';
            const message = `Member account created: ${who}`;
            console.log('MembershipApplications: received account-created ->', message);
            toast.info(message, { position: 'top-right', autoClose: 6000 });
          } catch (e) {
            console.error('Error handling account-created socket event:', e);
          }
        });

        socket.on('account-created', (member) => {
          // Also update local applications list so Create Account button hides promptly
          try {
            if (member && member.application_id) {
              setApplications((prev) => prev.map((app) => {
                if (app.application_id === member.application_id) {
                  return {
                    ...app,
                    member_account_created: true,
                    // if member number is provided, update the application record locally
                    applicants_membership_number: member.member_number || app.applicants_membership_number
                  };
                }
                return app;
              }));

              // if modal is open for the same application, update it as well
              try {
                if (selectedApplication && selectedApplication.application_id === member.application_id) {
                  setSelectedApplication((prev) => ({
                    ...prev,
                    member_account_created: true,
                    applicants_membership_number: member.member_number || prev.applicants_membership_number
                  }));
                }
              } catch (e) {
                // ignore
              }
            }
          } catch (e) {
            console.warn('Failed to mark application as account-created:', e);
          }
        });

  socket.on('disconnect', () => {
        console.warn('Socket disconnected from landing-page server');
        try {
          // show the disconnect toast only once by using a stable toastId
          if (!disconnectToastIdRef.current) {
            disconnectToastIdRef.current = toast.warn('Disconnected from notifications. The list will refresh when reconnected.', {
              position: 'top-right',
              autoClose: false,
              closeOnClick: true,
              draggable: false,
              toastId: 'socket-disconnected',
            });
          }
        } catch (e) {
          console.warn('Failed to show disconnect toast:', e);
        }
    });
      socket.on('connect_error', (err) => {
        console.warn('Socket connect error:', err);
      });
    } catch (socketErr) {
      console.warn('Socket.io client failed to initialize:', socketErr);
    }

    return () => {
      try {
        if (disconnectToastIdRef.current) {
          toast.dismiss(disconnectToastIdRef.current);
          disconnectToastIdRef.current = null;
        }
      } catch (e) {
        console.warn('Error dismissing disconnect toast during cleanup:', e);
      }

      if (socket && socket.disconnect) socket.disconnect();
    };
  }, [userRole]);


  const fetchApplications = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/membership-applications');
      const result = await response.json();

      const apps = result && result.applications ? result.applications : [];

      // handle notification logic: suppress toast on first load
      const curr = Array.isArray(apps) ? apps.length : 0;
      if (firstLoadRef.current) {
        prevCountRef.current = curr;
        firstLoadRef.current = false;
      } else if (curr > prevCountRef.current) {
        const newCount = curr - prevCountRef.current;
        const newest = Array.isArray(apps) ? apps.slice(0, newCount) : [];
        const first = newest[0];
        const applicantName = first ? `${first.first_name || ''} ${first.last_name || ''}`.trim() : null;
        const message = applicantName
          ? `New membership application from ${applicantName}.`
          : `You have ${newCount} new membership application(s).`;
        toast.info(message, { position: 'top-right', autoClose: 8000 });
      }

      prevCountRef.current = curr;

      if (Array.isArray(apps)) {
        setApplications(apps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, status, reviewNotes = '', membershipNum = '') => {
    try {
      const response = await fetch(`http://localhost:3002/api/membership-applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reviewNotes, membershipNumber: membershipNum }),
      });

      const result = await response.json();
      
      if (result.success) {
        fetchApplications(); // Refresh the list
        setShowModal(false);
        setSelectedApplication(null);
        setMembershipNumber(''); // Reset membership number
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const uploadReceipt = async (applicationId) => {
    if (!receiptFile) {
      alert('Please choose a receipt file to upload (image or PDF).');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', receiptFile);
    if (receiptNotes && receiptNotes.trim()) formData.append('notes', receiptNotes.trim());

    try {
      setUploadingReceipt(true);
      const res = await fetch(`http://localhost:3002/api/membership-applications/${applicationId}/receipt`, {
        method: 'POST',
        body: formData
      });

      const body = await res.json();
      if (res.ok && body && body.success) {
        toast.success('Receipt uploaded successfully.');
        // refresh applications and selectedApplication
        fetchApplications();
        // update the selected application in-place if returned
        if (body.application) setSelectedApplication(body.application);
        // reset upload state
        setReceiptFile(null);
        setReceiptNotes('');
      } else {
        console.error('Upload failed:', body);
        toast.error((body && body.message) || 'Failed to upload receipt.');
      }
    } catch (err) {
      console.error('Error uploading receipt:', err);
      toast.error('Error uploading receipt.');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
    // Pre-fill membership number: use existing if present, otherwise request a suggested number
    if (application.applicants_membership_number) {
      setMembershipNumber(application.applicants_membership_number);
    } else {
      // fetch suggested number and set it (non-blocking)
      fetchSuggestedMembershipNumber(application.application_id).then((suggested) => {
        if (suggested) setMembershipNumber(suggested);
      });
    }
  };

  const handleCreateAccount = async (application) => {
    // Prepare prefill object (exclude password)
    const prefill = {
      member_number: application.applicants_membership_number || '',
      member_name: `${application.first_name} ${application.middle_name || ''} ${application.last_name}`.trim(),
      user_email: application.email_address || ''
    };

    // If no membership number assigned yet, try to fetch suggested number first
    if (!prefill.member_number && application.application_id) {
      try {
        const suggested = await fetchSuggestedMembershipNumber(application.application_id);
        if (suggested) prefill.member_number = suggested;
        else prefill.member_number = generateSuggestedMembershipNumber();
      } catch (e) {
        prefill.member_number = generateSuggestedMembershipNumber();
      }
    }

    // Navigate to User Management and pass prefill data via location.state
    try {
      navigate('/user-management', { state: { prefill, fromApplicationId: application.application_id } });
    } catch (err) {
      console.error('Failed to navigate to User Management with prefill:', err);
      toast.error('Failed to open User Management for account creation.');
    }
  };

  const handleUseSuggestedNumber = () => {
    if (selectedApplication && selectedApplication.application_id) {
      fetchSuggestedMembershipNumber(selectedApplication.application_id).then((suggested) => {
        if (suggested) setMembershipNumber(suggested);
        else setMembershipNumber(generateSuggestedMembershipNumber());
      });
    } else {
      setMembershipNumber(generateSuggestedMembershipNumber());
    }
  };

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  );

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      under_review: 'status-review',
      forwarded_to_manager: 'status-forwarded',
      forwarded_to_it_admin: 'status-forwarded-it',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };

    // Friendly labels for certain statuses
    const labelMap = {
      forwarded_to_manager: 'On Process',
      forwarded_to_it_admin: 'Forwarded to IT',
      under_review: 'Under Review',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected'
    };

    const label = labelMap[status] || String(status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return <span className={`status-badge ${statusClasses[status] || ''}`}>{label}</span>;
  };

  if (loading) {
    return <div className="loading">Loading membership applications...</div>;
  }

  return (
    <div className="membership-applications-container">
      <div className="header">
        <h2>Membership Applications</h2>
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="forwarded_to_manager">Forwarded to Manager</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="applications-table">
        <table>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Membership Type</th>
              <th>Amount Subscribe</th>
              <th>Membership Number</th>
              <th>Actions</th>
              <th>Status</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplications.map((app) => (
              <tr key={app.application_id}>
                <td data-label="Application ID">{app.application_id}</td>
                <td data-label="Full Name">{`${app.first_name} ${app.middle_name || ''} ${app.last_name}`}</td>
                <td data-label="Email">{app.email_address}</td>
                <td data-label="Membership Type">{app.membership_type}</td>
                <td data-label="Amount">₱{Number(app.amount_subscribe).toLocaleString()}</td>
                <td data-label="Membership #">
                  {app.applicants_membership_number ? (
                    <span className="membership-number">{app.applicants_membership_number}</span>
                  ) : (
                    <span className="no-membership-number" style={{ color: '#999', fontStyle: 'italic' }}>Not assigned</span>
                  )}
                </td>
                <td data-label="Actions">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewApplication(app)}
                    >
                      View Details
                    </button>
                    {/* IT Admin can create an account for an approved/visible application */}
                    {userRole === 'it_admin' && app.status === 'approved' && (
                      <button
                        className="btn btn-info"
                        onClick={() => handleCreateAccount(app)}
                      >
                        Create Account
                      </button>
                    )}
                    {/* Show Review button for managers and forwarded_to_manager status */}
                    {userRole === 'manager' && app.status === 'forwarded_to_manager' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleViewApplication(app)}
                      >
                        Review
                      </button>
                    )}
                  </div>
                </td>
                <td data-label="Status">{getStatusBadge(app.status)}</td>
                <td data-label="Submitted">{new Date(app.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing application details */}
      {showModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Membership Application Details</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="application-details">
                {/* Basic Information */}
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-grid">
                    <div><strong>Application ID:</strong> {selectedApplication.application_id}</div>
                    <div><strong>Membership Type:</strong> {selectedApplication.membership_type}</div>
                    <div><strong>Number of Shares:</strong> {selectedApplication.number_of_shares}</div>
                    <div><strong>Amount Subscribe:</strong> ₱{Number(selectedApplication.amount_subscribe).toLocaleString()}</div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-grid">
                    <div><strong>Full Name:</strong> {`${selectedApplication.first_name} ${selectedApplication.middle_name || ''} ${selectedApplication.last_name} ${selectedApplication.suffix || ''}`}</div>
                    <div><strong>Email:</strong> {selectedApplication.email_address}</div>
                    <div><strong>Contact:</strong> {selectedApplication.contact_number}</div>
                    <div><strong>Address:</strong> {selectedApplication.address}</div>
                    <div><strong>Date of Birth:</strong> {selectedApplication.date_of_birth ? new Date(selectedApplication.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Age:</strong> {selectedApplication.age}</div>
                    <div><strong>Gender:</strong> {selectedApplication.gender}</div>
                    <div><strong>Civil Status:</strong> {selectedApplication.civil_status}</div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="detail-section">
                  <h4>Professional Information</h4>
                  <div className="detail-grid">
                    <div><strong>Occupation:</strong> {selectedApplication.occupation}</div>
                    <div><strong>Annual Income:</strong> ₱{Number(selectedApplication.annual_income || 0).toLocaleString()}</div>
                    <div><strong>Employment Type:</strong> {selectedApplication.employment_choice}</div>
                    {selectedApplication.employment_choice === 'employed' && (
                      <>
                        <div><strong>Employer:</strong> {selectedApplication.employer_trade_name}</div>
                        <div><strong>Employment Industry:</strong> {selectedApplication.employment_industry}</div>
                      </>
                    )}
                    {selectedApplication.employment_choice === 'sole trader' && (
                      <>
                        <div><strong>Business Type:</strong> {selectedApplication.business_type}</div>
                        <div><strong>Business Address:</strong> {selectedApplication.business_address}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reference Information */}
                <div className="detail-section">
                  <h4>Reference Information</h4>
                  <div className="detail-grid">
                    <div><strong>Reference Person:</strong> {selectedApplication.reference_person}</div>
                    <div><strong>Reference Address:</strong> {selectedApplication.reference_address}</div>
                    <div><strong>Reference Contact:</strong> {selectedApplication.reference_contact_number}</div>
                  </div>
                </div>

                {/* Profile Image */}
                {selectedApplication.profile_image_path && (
                  <div className="detail-section">
                    <h4>Profile Image</h4>
                    <img 
                      src={resolveRuntimeUrl(`http://localhost:3002/uploads/${selectedApplication.profile_image_path}`)}
                      alt="Profile"
                      className="profile-image"
                    />
                  </div>
                )}

                {/* Current Status */}
                <div className="detail-section">
                  <h4>Application Status</h4>
                  <div className="status-info">
                    <div><strong>Status:</strong> {getStatusBadge(selectedApplication.status)}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedApplication.created_at).toLocaleString()}</div>
                    {selectedApplication.reviewed_at && (
                      <div><strong>Reviewed:</strong> {new Date(selectedApplication.reviewed_at).toLocaleString()}</div>
                    )}
                    {selectedApplication.review_notes && (
                      <div><strong>Review Notes:</strong> {selectedApplication.review_notes}</div>
                    )}
                    {selectedApplication.receipt_path && ( (userRole === 'admin' || userRole === 'staff' || userRole === 'manager' || userRole === 'it_admin') && (
                      <div><strong>Receipt:</strong> <a href={resolveRuntimeUrl(`http://localhost:3002/uploads/${selectedApplication.receipt_path}`)} target="_blank" rel="noreferrer">View Receipt</a></div>
                    ))}
                    {selectedApplication.applicants_membership_number && (
                      <div><strong>Membership Number:</strong> {selectedApplication.applicants_membership_number}</div>
                    )}
                  </div>
                </div>

                {/* Admin/Staff Membership Number Assignment */}
                {(userRole === 'admin' || userRole === 'staff') && (selectedApplication.status === 'pending' || selectedApplication.status === 'under_review') && (
                  <div className="detail-section">
                    <h4>Assign Membership Number</h4>
                    <div className="membership-number-input">
                      <label htmlFor="membershipNumber"><strong>Membership Number:</strong></label>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          id="membershipNumber"
                          value={membershipNumber}
                          onChange={(e) => setMembershipNumber(e.target.value)}
                          placeholder="Enter membership number (e.g., MEM-2024-001)"
                          className="form-control"
                          style={{ 
                            flex: 1,
                            padding: '8px 12px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleUseSuggestedNumber}
                          className="btn btn-secondary"
                          style={{ 
                            fontSize: '12px',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Use Suggested
                        </button>
                      </div>
                      <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                        Suggested: {generateSuggestedMembershipNumber()} | This number will be assigned to the applicant upon approval
                      </small>
                      {!membershipNumber.trim() && (
                        <small style={{ color: '#dc3545', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                          ⚠️ Membership number is required before forwarding to manager
                        </small>
                      )}
                    </div>
                  </div>
                )}

                {/* Admin/Staff: Submit Receipt when reviewing an application */}
                {(userRole === 'admin' || userRole === 'staff') && (
                  <div className="detail-section">
                    <h4>Submit Receipt</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedApplication.receipt_path && (
                        <div>
                          <strong>Existing receipt:</strong>{' '}
                          <a href={resolveRuntimeUrl(`http://localhost:3002/uploads/${selectedApplication.receipt_path}`)} target="_blank" rel="noreferrer">View Receipt</a>
                        </div>
                      )}

                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setReceiptFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                      />

                      <textarea
                        placeholder="Optional notes about this receipt"
                        value={receiptNotes}
                        onChange={(e) => setReceiptNotes(e.target.value)}
                        rows={3}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => uploadReceipt(selectedApplication.application_id)}
                          disabled={uploadingReceipt}
                        >
                          {uploadingReceipt ? 'Uploading...' : 'Submit Receipt'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => { setReceiptFile(null); setReceiptNotes(''); }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="action-buttons">
                {(userRole === 'admin' || userRole === 'staff') && (
                  <>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        if (!membershipNumber.trim()) {
                          alert('Please enter a membership number before forwarding to manager.\n\nClick "Use Suggested" for a recommended format, or enter your own.');
                          return;
                        }
                        if (membershipNumber.trim().length < 3) {
                          alert('Membership number should be at least 3 characters long.');
                          return;
                        }
                        updateApplicationStatus(
                          selectedApplication.application_id, 
                          'forwarded_to_manager', 
                          `Application reviewed and forwarded to manager for approval. Assigned membership number: ${membershipNumber}`,
                          membershipNumber
                        );
                      }}
                      disabled={selectedApplication.status === 'forwarded_to_manager' || selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}
                      style={{
                        backgroundColor: !membershipNumber.trim() ? '#ccc' : '',
                        borderColor: !membershipNumber.trim() ? '#ccc' : ''
                      }}
                    >
                      Forward to Manager
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => updateApplicationStatus(selectedApplication.application_id, 'under_review', 'Application under review by admin')}
                      disabled={selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}
                    >
                      Mark Under Review
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => {
                        const reason = prompt('Please provide a reason for rejection:');
                        if (reason) {
                          updateApplicationStatus(selectedApplication.application_id, 'rejected', `Rejected by admin: ${reason}`);
                        }
                      }}
                      disabled={selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}
                    >
                      Reject Application
                    </button>
                  </>
                )}
                
                {userRole === 'manager' && (
                  <>
                    <button 
                      className="btn btn-success"
                      onClick={() => updateApplicationStatus(selectedApplication.application_id, 'approved', 'Application approved by manager')}
                      disabled={selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}
                    >
                      Approve Application
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => updateApplicationStatus(selectedApplication.application_id, 'under_review', 'Application returned to admin for review')}
                      disabled={selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}
                    >
                      Return for Review
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => {
                        const reason = prompt('Please provide a reason for rejection:');
                        if (reason) {
                          updateApplicationStatus(selectedApplication.application_id, 'rejected', `Rejected by manager: ${reason}`);
                        }
                      }}
                      disabled={selectedApplication.status === 'approved' || selectedApplication.status === 'rejected'}
                    >
                      Reject Application
                    </button>
                  </>
                )}
                
                {userRole === 'it_admin' && (
                  <p className="no-actions">IT Admin can view applications but actions are managed through the system.</p>
                )}
                {/* Provide a Create Account button inside modal for IT admins */}
                {userRole === 'it_admin' && selectedApplication && selectedApplication.status === 'approved' && !selectedApplication.member_account_created && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      className="btn btn-info"
                      onClick={() => handleCreateAccount(selectedApplication)}
                    >
                      Create Account
                    </button>
                  </div>
                )}
                
                {(userRole !== 'admin' && userRole !== 'staff' && userRole !== 'manager' && userRole !== 'it_admin') && (
                  <p className="no-actions">You don't have permission to modify applications.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
  {/* Toast container for react-toastify (high z-index to appear above fixed headers) */}
  <ToastContainer position="top-right" newestOnTop style={{ zIndex: 2147483647 }} />
    </div>
  );
};

export default MembershipApplications;
