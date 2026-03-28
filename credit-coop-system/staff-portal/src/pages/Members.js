import React, { useState } from 'react';

const Members = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock member data
  const members = [
    {
      id: 'MEM001',
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@email.com',
      phone: '+63 912 345 6789',
      memberSince: '2020-03-15',
      status: 'active',
      totalDeposits: '₱125,000',
      loanBalance: '₱45,000'
    },
    {
      id: 'MEM002',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      phone: '+63 917 765 4321',
      memberSince: '2019-11-22',
      status: 'active',
      totalDeposits: '₱89,500',
      loanBalance: '₱0'
    },
    {
      id: 'MEM003',
      name: 'Pedro Garcia',
      email: 'pedro.garcia@email.com',
      phone: '+63 922 111 2233',
      memberSince: '2021-07-08',
      status: 'inactive',
      totalDeposits: '₱15,000',
      loanBalance: '₱25,000'
    },
    {
      id: 'MEM004',
      name: 'Ana Rodriguez',
      email: 'ana.rodriguez@email.com',
      phone: '+63 918 444 5566',
      memberSince: '2022-01-12',
      status: 'active',
      totalDeposits: '₱67,800',
      loanBalance: '₱12,000'
    }
  ];

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="members-page">
      <div className="page-header">
        <div className="page-title">
          <h1>Member Management</h1>
          <p>Manage credit cooperative members and their information</p>
        </div>
        <button className="btn btn-primary">
          <span>👤</span>
          Add New Member
        </button>
      </div>

      <div className="page-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search members by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-control"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="members-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Member ID</th>
              <th>Name</th>
              <th>Contact</th>
              <th>Member Since</th>
              <th>Status</th>
              <th>Total Deposits</th>
              <th>Loan Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td>
                  <span className="member-id">{member.id}</span>
                </td>
                <td>
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="member-name">{member.name}</span>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{member.email}</div>
                    <div className="text-muted">{member.phone}</div>
                  </div>
                </td>
                <td>{new Date(member.memberSince).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${member.status}`}>
                    {member.status}
                  </span>
                </td>
                <td className="text-success font-weight-bold">{member.totalDeposits}</td>
                <td className="text-warning font-weight-bold">{member.loanBalance}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-sm btn-secondary" title="View Details">
                      👁️
                    </button>
                    <button className="btn btn-sm btn-primary" title="Edit">
                      ✏️
                    </button>
                    <button className="btn btn-sm btn-warning" title="Accounts">
                      💰
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMembers.length === 0 && (
        <div className="no-results">
          <h3>No members found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}
    </div>
  );
};

export default Members;
