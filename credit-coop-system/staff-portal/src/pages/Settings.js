import React from 'react';

const Settings = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h1>System Settings</h1>
          <p>Configure system preferences and administrative settings</p>
        </div>
      </div>
      
      <div className="card">
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚙️</div>
          <h3>System Settings</h3>
          <p>This section will contain system configuration options including:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
            <li>User management and permissions</li>
            <li>Interest rate configuration</li>
            <li>Fee structure settings</li>
            <li>Email and notification settings</li>
            <li>Backup and maintenance</li>
            <li>Audit logs and security</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
