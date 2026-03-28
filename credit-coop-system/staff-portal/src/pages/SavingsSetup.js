import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import './SavingsSetup.css';

const SavingsSetup = () => {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberNumberInput, setMemberNumberInput] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const resp = await axios.get('http://localhost:5000/api/members', {
          headers: { 'Content-Type': 'application/json', token: localStorage.token }
        });
        if (resp.data && resp.data.success) setMembers(resp.data.members || []);
      } catch (err) {
        console.error('Failed to load members:', err);
      }
    };
    loadMembers();
  }, []);

  const createSavings = async () => {
    const member_number = selectedMember ? selectedMember.member_number : memberNumberInput;
    if (!member_number) return alert('Provide a member number');
    setCreating(true);
    try {
      const payload = {
        member_number,
        initial_deposit: Number(initialDeposit) || 0,
        account_type: 'savings'
      };

      await axios.post('http://localhost:5000/api/accounts/create', payload, {
        headers: { 'Content-Type': 'application/json', token: localStorage.token }
      });

      alert('Savings account created');
      // reset
      setSelectedMember(null);
  setMemberNumberInput('');
      setInitialDeposit('');
    } catch (err) {
      console.error('Create savings failed:', err);
      alert('Failed to create savings account');
    }
    setCreating(false);
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>Setup Savings Account</h1>
        <p>Create a savings account for a member and set an initial deposit.</p>
      </div>

      <div className="card">
        <div style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Member</label>
              {members && members.length > 0 ? (
              <select className="savings-select" value={selectedMember ? selectedMember.member_number : ''}
                onChange={e => {
                  const mn = e.target.value;
                  const m = members.find(x => String(x.member_number) === String(mn));
                  setSelectedMember(m || null);
                  setMemberNumberInput('');
                }}
                style={{ marginLeft: '0.5rem' }}>
                <option value="">-- choose member --</option>
                {members.map(m => (
                  <option key={m.member_number} value={m.member_number}>{m.member_number} — {m.user_name || m.full_name || m.user_email}</option>
                ))}
              </select>
              ) : (
              <input className="savings-input" placeholder="Enter member number" value={memberNumberInput} onChange={e => setMemberNumberInput(e.target.value)} style={{ marginLeft: '0.5rem' }} />
            )}
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              You can type a member number directly if the list is empty or the member is not listed.
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Initial Deposit</label>
            <input className="savings-number" style={{ marginLeft: '0.5rem' }} type="number" min="0" step="0.01" value={initialDeposit}
              onChange={e => setInitialDeposit(e.target.value)} />
          </div>

          <div>
            <button className="btn btn-primary" onClick={createSavings} disabled={creating}>{creating ? 'Creating...' : 'Create Savings Account'}</button>
            <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => { setSelectedMember(null); setMemberNumberInput(''); setInitialDeposit(''); }}>Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsSetup;
