import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUserRole } from '../hooks/useUserRole';
import './UserManagement.css';
import { resolveRuntimeUrl } from '../runtimeUrlConfig';

const UserManagement = () => {
    // State for member list
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // State for create/edit form
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [formData, setFormData] = useState({
        member_number: '',
        member_name: '',
        user_email: '',
        default_password: '',
        new_password: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const location = useLocation();
    const { userRole } = useUserRole();
    const socketRef = useRef(null);
    const fromApplicationIdRef = useRef(null);

    // Load members
    const loadMembers = async (page = 1, search = '', status = 'all') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                status
            });
            
            const res = await fetch(`http://localhost:5000/api/user-management/members?${params}`, {
                headers: {
                    'token': localStorage.token
                }
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                setMembers(data.members);
                setPagination(data.pagination);
            } else {
                setError(data.message || 'Failed to load members');
            }
        } catch (err) {
            setError('Network error loading members');
        } finally {
            setLoading(false);
        }
    };

    // Load members on component mount and when filters change
    useEffect(() => {
        loadMembers(currentPage, searchTerm, statusFilter);
    }, [currentPage, searchTerm, statusFilter]);

    // Setup socket connection for receiving account-created events and joining role room
    useEffect(() => {
        try {
            const socket = io(resolveRuntimeUrl('http://localhost:3002'));
            socketRef.current = socket;
            socket.on('connect', () => {
                try {
                    const role = userRole || 'it_admin';
                    socket.emit('join', { role });
                } catch (e) { /* ignore */ }
            });

            socket.on('account-created', (payload) => {
                try {
                    const who = payload && (payload.member_name || payload.user_email || payload.member_number) ? (payload.member_name || payload.user_email || payload.member_number) : 'a member';
                    toast.success(`Member account created: ${who}`, { position: 'top-right', autoClose: 6000 });
                    // Optionally refresh members list
                    loadMembers(currentPage, searchTerm, statusFilter);
                } catch (e) {
                    console.warn('Error handling account-created event in UserManagement:', e);
                }
            });

            socket.on('connect_error', (err) => console.warn('Socket connect error (UserManagement):', err));

            return () => {
                try {
                    if (socket && socket.disconnect) socket.disconnect();
                } catch (e) { }
            };
        } catch (e) {
            console.warn('Failed to initialize socket in UserManagement:', e);
        }
    }, [userRole]);

    // If navigated here with prefill data (from MembershipApplications), open create form and populate
    useEffect(() => {
        try {
            if (location && location.state && location.state.prefill) {
                const p = location.state.prefill;
                setFormData((fd) => ({
                    ...fd,
                    member_number: p.member_number || '',
                    member_name: p.member_name || '',
                    user_email: p.user_email || '',
                    default_password: ''
                }));
                // remember originating application id so we can include it when emitting account-created
                if (location.state.fromApplicationId) {
                    fromApplicationIdRef.current = location.state.fromApplicationId;
                }
                setEditingMember(null);
                setShowForm(true);
                // clear the location.state to avoid re-triggering if user navigates back
                try {
                    if (window.history && window.history.replaceState) {
                        const newState = { ...(window.history.state || {}) };
                        if (newState && newState.usr && newState.usr.state) {
                            // attempt safe clear (best-effort)
                            // no-op for complex history shapes
                        }
                        // replace current history entry state to remove prefill (best-effort)
                        window.history.replaceState({}, '');
                    }
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            // ignore
        }
    }, [location]);

    // Handle search
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    // Handle status filter
    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    // Handle form submission (create/update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        
        if (!formData.member_number || !formData.user_email || (!editingMember && !formData.default_password)) {
            setError('Member number, email, and password are required');
            return;
        }
        
        setSubmitting(true);
        try {
            const url = editingMember 
                ? `http://localhost:5000/api/user-management/members/${editingMember.user_id}`
                : 'http://localhost:5000/api/user-management/members';
            
            const method = editingMember ? 'PUT' : 'POST';
            const body = editingMember 
                ? {
                    user_name: formData.member_name,
                    user_email: formData.user_email,
                    member_number: formData.member_number,
                    new_password: formData.new_password
                }
                : {
                    member_number: formData.member_number,
                    member_name: formData.member_name,
                    user_email: formData.user_email,
                    default_password: formData.default_password
                };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'token': localStorage.token
                },
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(editingMember ? 'Member updated successfully' : 'Member created successfully');
                setShowForm(false);
                setEditingMember(null);
                resetForm();
                loadMembers(currentPage, searchTerm, statusFilter);
                // Emit account-created event so other IT admins receive realtime notification
                try {
                    const basePayload = data.member || {
                        member_number: body.member_number,
                        member_name: body.member_name,
                        user_email: body.user_email,
                        created_at: new Date().toISOString()
                    };
                    // attach originating application id if available so other clients can correlate
                    const payload = {
                        ...basePayload,
                        application_id: fromApplicationIdRef.current || null
                    };
                    if (socketRef.current && socketRef.current.connected) {
                        socketRef.current.emit('account-created', payload);
                    }
                    // clear the ref after emitting
                    fromApplicationIdRef.current = null;
                    // Also show a toast locally (already setSuccess will render a message, but toast is more visible)
                    toast.success(editingMember ? 'Member updated successfully' : 'Member created successfully', { position: 'top-right', autoClose: 4000 });
                } catch (e) {
                    console.warn('Error emitting account-created from UserManagement:', e);
                }
            } else {
                setError(data.message || `Failed to ${editingMember ? 'update' : 'create'} member`);
            }
        } catch (err) {
            setError(`Network error ${editingMember ? 'updating' : 'creating'} member`);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle edit member
    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            member_number: member.member_number || '',
            member_name: member.user_name || '',
            user_email: member.user_email || '',
            default_password: '',
            new_password: ''
        });
        setShowForm(true);
    };

    // Handle delete member
    const handleDelete = async (member) => {
        if (!window.confirm(`Are you sure you want to delete ${member.user_name}?`)) {
            return;
        }
        
        try {
            const res = await fetch(`http://localhost:5000/api/user-management/members/${member.user_id}`, {
                method: 'DELETE',
                headers: {
                    'token': localStorage.token
                }
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(data.message);
                loadMembers(currentPage, searchTerm, statusFilter);
            } else {
                setError(data.message || 'Failed to delete member');
            }
        } catch (err) {
            setError('Network error deleting member');
        }
    };

    // Handle toggle status
    const handleToggleStatus = async (member) => {
        try {
            const res = await fetch(`http://localhost:5000/api/user-management/members/${member.user_id}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'token': localStorage.token
                }
            });
            
            const data = await res.json();
            if (res.ok && data.success) {
                setSuccess(data.message);
                loadMembers(currentPage, searchTerm, statusFilter);
            } else {
                setError(data.message || 'Failed to toggle member status');
            }
        } catch (err) {
            setError('Network error toggling member status');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            member_number: '',
            member_name: '',
            user_email: '',
            default_password: '',
            new_password: ''
        });
    };

    // Handle form cancel
    const handleCancel = () => {
        setShowForm(false);
        setEditingMember(null);
        resetForm();
        setError('');
        setSuccess('');
    };

    return (
        <div className="user-management">
            <ToastContainer position="top-right" newestOnTop style={{ zIndex: 2147483647 }} />
            <div className="um-header">
                <h2>Member Account Management</h2>
                <button 
                    className="um-btn um-btn-primary" 
                    onClick={() => setShowForm(true)}
                >
                    Create New Member
                </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="um-controls">
                <div className="um-search">
                    <input
                        type="text"
                        placeholder="Search by name, email, or member number..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="um-search-input"
                    />
                </div>
                <div className="um-filter">
                    <select value={statusFilter} onChange={handleStatusFilter}>
                        <option value="all">All Members</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Messages */}
            {error && <div className="um-error">{error}</div>}
            {success && <div className="um-success">{success}</div>}

            {/* Create/Edit Form */}
            {showForm && (
                <div className="um-form-modal">
                    <div className="um-form-container">
                        <h3>{editingMember ? 'Edit Member' : 'Create New Member'}</h3>
                        <form onSubmit={handleSubmit} className="um-form">
                            <div className="um-form-row">
                                <div className="um-field">
                                    <label>Member Number *</label>
                                    <input 
                                        type="text" 
                                        value={formData.member_number} 
                                        onChange={(e) => setFormData({...formData, member_number: e.target.value})} 
                                        placeholder="e.g., M-0001" 
                                        required 
                                    />
                                </div>
                                <div className="um-field">
                                    <label>Email Address *</label>
                                    <input 
                                        type="email" 
                                        value={formData.user_email} 
                                        onChange={(e) => setFormData({...formData, user_email: e.target.value})} 
                                        placeholder="member@example.com" 
                                        required 
                                    />
                                </div>
                            </div>
                            <div className="um-field">
                                <label>Member Name</label>
                                <input 
                                    type="text" 
                                    value={formData.member_name} 
                                    onChange={(e) => setFormData({...formData, member_name: e.target.value})} 
                                    placeholder="e.g., John Doe" 
                                />
                            </div>
                            {!editingMember && (
                                <div className="um-field">
                                    <label>Default Password *</label>
                                    <input 
                                        type="password" 
                                        value={formData.default_password} 
                                        onChange={(e) => setFormData({...formData, default_password: e.target.value})} 
                                        placeholder="Temporary password" 
                                        required 
                                    />
                                </div>
                            )}
                            {editingMember && (
                                <div className="um-field">
                                    <label>New Password (leave blank to keep current)</label>
                                    <input 
                                        type="password" 
                                        value={formData.new_password} 
                                        onChange={(e) => setFormData({...formData, new_password: e.target.value})} 
                                        placeholder="New password" 
                                    />
                                </div>
                            )}
                            <div className="um-form-actions">
                                <button type="button" onClick={handleCancel} className="um-btn um-btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="um-btn um-btn-primary" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editingMember ? 'Update Member' : 'Create Member')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="um-members-list">
                {loading ? (
                    <div className="um-loading">Loading members...</div>
                ) : members.length === 0 ? (
                    <div className="um-empty">No members found</div>
                ) : (
                    <>
                        <div className="um-members-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Member Number</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.user_id}>
                                            <td>{member.user_name}</td>
                                            <td>{member.user_email}</td>
                                            <td>{member.member_number}</td>
                                            <td>
                                                <span className={`um-status um-status-${member.is_active ? 'active' : 'inactive'}`}>
                                                    {member.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{new Date(member.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="um-actions">
                                                    <button 
                                                        onClick={() => handleEdit(member)}
                                                        className="um-btn um-btn-sm um-btn-secondary"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleToggleStatus(member)}
                                                        className={`um-btn um-btn-sm ${member.is_active ? 'um-btn-warning' : 'um-btn-success'}`}
                                                    >
                                                        {member.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(member)}
                                                        className="um-btn um-btn-sm um-btn-danger"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="um-pagination">
                                <button 
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="um-btn um-btn-secondary"
                                >
                                    Previous
                                </button>
                                <span className="um-pagination-info">
                                    Page {pagination.currentPage} of {pagination.totalPages} 
                                    ({pagination.totalMembers} total members)
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === pagination.totalPages}
                                    className="um-btn um-btn-secondary"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserManagement;


