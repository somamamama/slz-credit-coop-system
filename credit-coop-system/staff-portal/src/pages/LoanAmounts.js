import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';

const LoanAmounts = () => {
  const [loanApps, setLoanApps] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await axios.get('http://localhost:5000/api/loan-review/applications?status=approved', {
          headers: { 'Content-Type': 'application/json', token: localStorage.token }
        });
        if (resp.data && resp.data.success) setLoanApps(resp.data.applications || []);
      } catch (err) {
        console.error('Error loading approved loans:', err);
      }
    };
    load();
  }, []);

  const saveAmount = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const amount = parseFloat(selected.loan_amount) || 0;
      const months = selected.loan_type === 'quick' ? 6 : 12;
      const annualInterestRate = 0.12;
      const monthlyInterestRate = annualInterestRate / 12;
      const n = months;
      const P = amount;
      const r = monthlyInterestRate;
      const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const serviceFee = amount * 0.03;
      const shareCapital = amount * 0.03;
      const insurance = (amount * months) / 1000;
      const netProceeds = amount - serviceFee - shareCapital - insurance;

      await axios.post(
        `http://localhost:5000/api/loan-review/applications/${selected.application_id}/set-loan-amount`,
        { loan_amount: netProceeds, loan_duration: months, monthly_payment: monthlyPayment },
        { headers: { 'Content-Type': 'application/json', token: localStorage.token } }
      );

      // remove from list and close
      setLoanApps(prev => prev.filter(a => a.application_id !== selected.application_id));
      setSelected(null);
    } catch (err) {
      console.error('Failed to save loan amount:', err);
      alert('Failed to save loan amount');
    }
    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1>Loan Amounts (Admin)</h1>
        <p>Assign final loan amounts and calculate deductions for approved applications.</p>
      </div>

      <div className="applications-section">
        <div className="table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Applicant</th>
                <th>Member Number</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loanApps.length === 0 ? (
                <tr><td colSpan={5}>No approved loan applications awaiting amounts.</td></tr>
              ) : (
                loanApps.map(app => (
                  <tr key={app.application_id}>
                    <td>{app.application_id}</td>
                    <td>{app.applicant_name || `${app.first_name || ''} ${app.last_name || ''}`}</td>
                    <td>{app.member_number}</td>
                    <td>{app.submitted_at ? new Date(app.submitted_at).toLocaleString() : 'N/A'}</td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setSelected(app)}>Set Loan Amount</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Set Loan Amount for #{selected.application_id}</h2>
              <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                <div className="info-item">
                  <label>Final Loan Amount (gross)</label>
                  <input type="number" min="0" step="0.01" value={selected.loan_amount || ''}
                    onChange={e => setSelected({...selected, loan_amount: e.target.value})} />
                </div>
                <div className="info-item">
                  <label>Loan Type</label>
                  <div>{selected.loan_type || 'regular'}</div>
                </div>
              </div>

              {selected.loan_amount && (
                (() => {
                  const amount = parseFloat(selected.loan_amount) || 0;
                  const months = selected.loan_type === 'quick' ? 6 : 12;
                  const serviceFee = amount * 0.03;
                  const shareCapital = amount * 0.03;
                  const insurance = (amount * months) / 1000;
                  const annualInterestRate = 0.12;
                  const monthlyInterestRate = annualInterestRate / 12;
                  const n = months;
                  const P = amount;
                  const r = monthlyInterestRate;
                  const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
                  const netProceeds = amount - serviceFee - shareCapital - insurance;
                  return (
                    <div className="deductions-section" style={{marginTop: '1rem'}}>
                      <h5>Deductions</h5>
                      <div>Service Fee (3%): ₱{serviceFee.toFixed(2)}</div>
                      <div>Share Capital (3%): ₱{shareCapital.toFixed(2)}</div>
                      <div>Insurance: ₱{insurance.toFixed(2)}</div>
                      <div>Net Proceeds: <b>₱{netProceeds.toFixed(2)}</b></div>
                      <h5 style={{marginTop: '1rem'}}>Monthly Payment</h5>
                      <div>Monthly Payment: <b>₱{monthlyPayment.toFixed(2)}</b></div>
                    </div>
                  );
                })()
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" disabled={loading} onClick={saveAmount}>Save Loan Amount</button>
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanAmounts;
