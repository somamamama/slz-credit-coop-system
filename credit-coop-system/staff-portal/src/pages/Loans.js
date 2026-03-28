import React from 'react';

const Loans = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>Loan Management</h1>
          <p>Process loan applications and manage loan accounts</p>
        </div>
        <button className="btn btn-primary">
          <span>🏦</span>
          New Loan Application
        </button>
      </div>
      
      <div className="card">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏦</div>
          <h3>Loan Management</h3>
          <p>This section will contain loan management features including:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
            <li>Review loan applications</li>
            <li>Approve/reject loan requests</li>
            <li>Loan disbursement processing</li>
            <li>Payment tracking and scheduling</li>
            <li>Loan portfolio overview</li>
            <li>Delinquency management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Loans;
