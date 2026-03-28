import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import './LoanApplication.css';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
};

const computeLoanDetails = (app) => {
  const raw = app.loan_amount ?? app.amount ?? app.requested_amount ?? 0;
  const amount = Number(raw) || 0;
  const months = app.duration_months || (app.loan_type === 'quick' || app.loanType === 'quick' ? 6 : 12);
  const serviceFee = amount * 0.03;
  const shareCapital = amount * 0.03;
  const insurance = (amount * months) / 1000;
  const annualInterestRate = app.interest_rate ?? 0.12;
  const monthlyInterestRate = annualInterestRate / 12;
  const n = months;
  const P = amount;
  const r = monthlyInterestRate;
  let monthlyPayment = 0;
  if (r > 0 && n > 0) {
    monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  const netProceeds = amount - serviceFee - shareCapital - insurance;
  return { amount, months, serviceFee, shareCapital, insurance, annualInterestRate, monthlyInterestRate, monthlyPayment, netProceeds };
};

const LoanTracker = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);

  // Initial fetch of applications for the user
  useEffect(() => {
    if (!user) return;
    const fetchApps = async () => {
  setLoading(true);
  setError(null);
  // Clear any previous application while we fetch to avoid showing stale data
  setApplication(null);

      // Prefer member_number when available (more stable) otherwise fall back to user_id
      const identifierKey = user?.member_number ? 'member_number' : 'user_id';
      const identifierValue = user?.member_number || user?.user_id || '';
      const query = `${identifierKey}=${encodeURIComponent(identifierValue)}`;
      const relativeUrl = `/api/loan-application/list?${query}`;
      const fallbackUrl = `http://localhost:5001/api/loan-application/list?${query}`;

      const doFetch = async (url) => {
        // Server middleware expects token in header 'token' (not Authorization) and
        // the client stores it under 'memberPortalToken' in localStorage.
        const res = await fetch(url, { headers: { 'token': localStorage.getItem('memberPortalToken') } });
        let data;
        try { data = await res.json(); } catch (parseErr) { const text = await res.text().catch(() => '<no body>'); throw new Error(`Invalid JSON from ${url} - status ${res.status} - body: ${text}`); }
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status} from ${url}`);
        if (!data.success) throw new Error(data.message || `API returned success=false from ${url}`);
        return data;
      };

      try {
        const data = await doFetch(relativeUrl).catch(async (e) => { console.warn('Relative fetch failed, trying fallback:', e.message); return await doFetch(fallbackUrl); });
  const apps = data?.applications ?? data?.applications_list ?? [];
        const basic = apps.length > 0 ? apps[0] : null;
        // If the list item doesn't include review_status (older server responses),
        // fetch the detailed application to get full fields (review_status, amount, etc.)
        if (basic && basic.review_status === undefined) {
          try {
            const detailRes = await fetch(`/api/loan-application/${basic.application_id}`, { headers: { 'token': localStorage.getItem('memberPortalToken') } });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData?.success && detailData.application) {
                setApplication(detailData.application);
              } else {
                setApplication(basic);
              }
            } else {
              setApplication(basic);
            }
          } catch (detailErr) {
            console.warn('Failed to fetch detailed application:', detailErr);
            setApplication(basic);
          }
        } else {
          setApplication(basic);
        }
      } catch (err) {
        console.error('Failed to fetch loan applications', err);
        setError('Error fetching loan application details');
      } finally { setLoading(false); }
    };
    fetchApps();
  }, [user]);

  // Polling effect: start/stop polling based on `application` state so we don't rely on stale closures
  useEffect(() => {
    if (!user) return;
    if (!application) return; // nothing to poll for

    const currentStatus = application?.status ?? application?.review_status ?? null;
    const isApprovedLocal = currentStatus === 'approved' || currentStatus === 'paid';
    const amountAssignedLocal = !!(application?.loan_amount || application?.amount || application?.requested_amount || application?.monthly_payment);

    // Only poll while waiting for approval or for amount assignment after approval
    const shouldPoll = !isApprovedLocal || (isApprovedLocal && !amountAssignedLocal);
    if (!shouldPoll) return; // no polling needed

    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const identifierKey = user?.member_number ? 'member_number' : 'user_id';
        const identifierValue = user?.member_number || user?.user_id || '';
        const query = `${identifierKey}=${encodeURIComponent(identifierValue)}`;
        const relativeUrl = `/api/loan-application/list?${query}`;
        const fallbackUrl = `http://localhost:5001/api/loan-application/list?${query}`;
        const doFetch = async (url) => {
          const res = await fetch(url, { headers: { 'token': localStorage.getItem('memberPortalToken') } });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
          if (!data.success) throw new Error(data.message || 'API returned success=false');
          return data;
        };
        const data = await doFetch(relativeUrl).catch(async (e) => { return await doFetch(fallbackUrl); });
  const apps = data?.applications ?? data?.applications_list ?? [];
        const latest = apps.length > 0 ? apps[0] : null;
        if (cancelled) return;
        if (latest && latest.review_status === undefined) {
          try {
            const detailRes = await fetch(`/api/loan-application/${latest.application_id}`, { headers: { 'token': localStorage.getItem('memberPortalToken') } });
            if (detailRes.ok) {
              const detailData = await detailRes.json();
              if (detailData?.success && detailData.application) {
                setApplication(detailData.application);
              } else {
                setApplication(latest);
              }
            } else {
              setApplication(latest);
            }
          } catch (detailErr) {
            console.warn('Failed to fetch detailed application during polling:', detailErr);
            setApplication(latest);
          }
        } else {
          setApplication(latest);
        }
      } catch (err) {
        console.warn('Polling fetch error', err.message || err);
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user, application]);

  // Step status helpers
  const hasApplication = !!application;
  // Prefer review_status (set by staff) over status when available
  const status = application?.review_status ?? application?.status ?? null;
  const isApproved = (application?.review_status === 'approved' || application?.review_status === 'paid') || (status === 'approved' || status === 'paid');
  const amountAssigned = !!(application?.loan_amount || application?.amount || application?.requested_amount || application?.monthly_payment);

  const steps = [
    {
      id: 1,
      title: 'Submit Loan Application',
      description: 'Complete and submit your loan application form. This must be done first.',
      done: hasApplication,
      action: hasApplication ? null : { label: 'Apply for a Loan', href: '/loans' }
    },
    {
      id: 2,
      title: 'Application Review & Approval',
      description: 'Loan officers will review your application. You must wait until it is approved to proceed.',
      done: isApproved,
      inProgress: hasApplication && !isApproved,
      waitMessage: hasApplication ? 'Waiting for staff review and approval...' : 'Submit your application to begin review.'
    },
    {
      id: 3,
      title: 'Loan Amount Assignment & Disbursement',
      description: 'Once approved, an amount will be set and the repayment schedule will be prepared. This step completes after amount is assigned and disbursed.',
      done: isApproved && amountAssigned,
      inProgress: isApproved && !amountAssigned,
      waitMessage: isApproved ? 'Waiting for admin to assign final loan amount...' : 'This step starts after approval.'
    }
  ];

  const handleRefresh = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const identifierKey = user?.member_number ? 'member_number' : 'user_id';
      const identifierValue = user?.member_number || user?.user_id || '';
      const query = `${identifierKey}=${encodeURIComponent(identifierValue)}`;
      const relativeUrl = `/api/loan-application/list?${query}`;
      const fallbackUrl = `http://localhost:5001/api/loan-application/list?${query}`;
      const doFetch = async (url) => {
        const res = await fetch(url, { headers: { 'token': localStorage.getItem('memberPortalToken') } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
        if (!data.success) throw new Error(data.message || 'API returned success=false');
        return data;
      };
      const data = await doFetch(relativeUrl).catch(async (e) => { return await doFetch(fallbackUrl); });
  const apps = data?.applications ?? data?.applications_list ?? [];
      const basic = apps.length > 0 ? apps[0] : null;
      if (basic && basic.review_status === undefined) {
        try {
          const detailRes = await fetch(`/api/loan-application/${basic.application_id}`, { headers: { 'token': localStorage.getItem('memberPortalToken') } });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData?.success && detailData.application) {
              setApplication(detailData.application);
            } else {
              setApplication(basic);
            }
          } else {
            setApplication(basic);
          }
        } catch (detailErr) {
          console.warn('Failed to fetch detailed application on manual refresh:', detailErr);
          setApplication(basic);
        }
      } else {
        setApplication(basic);
      }
    } catch (err) {
      console.error('Manual refresh failed', err);
      setError('Error fetching loan application details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-tracker-page">
      <Header />
      <main className="loan-application-main">
        <div className="container">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>📍 Loan Tracker</h1>
              <p>Follow the steps below to see where your loan application is in the process.</p>
            </div>
            <div>
              <button className="btn btn-outline" onClick={handleRefresh} style={{ marginLeft: 12 }}>Refresh</button>
            </div>
          </div>

          {loading && <div className="card"><p>Loading your loan application...</p></div>}

          {!loading && error && <div className="card status-message error">❌ {error}</div>}

          {!loading && !application && !error && (
            <div className="card">
              <h3>No loan application found</h3>
              <p>You haven't submitted a loan application yet. Start by submitting one.</p>
              <a href="/loans" className="btn btn-primary">Apply for a Loan</a>
            </div>
          )}

          {!loading && application && (
            <div className="card">
              <h2>Application #{application.application_id}</h2>
              <p><strong>Current status:</strong> {status || 'N/A'}</p>
              <p><strong>Submitted:</strong> {new Date(application.submitted_at || application.date_filed || application.created_at).toLocaleString()}</p>

              <div className="steps-list" style={{ marginTop: '1rem' }}>
                {steps.map(step => (
                  <div key={step.id} className={`step-item ${step.done ? 'done' : (step.inProgress ? 'in-progress' : 'pending')}`} style={{ padding: '1rem', borderRadius: 8, marginBottom: 12, background: step.done ? '#e6ffed' : (step.inProgress ? '#fff9e6' : '#f5f6f7') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0 }}>{step.id}. {step.title}</h4>
                        <div style={{ color: '#555' }}>{step.description}</div>
                      </div>
                      <div>
                        {step.done ? <span style={{ color: '#0a7a3d', fontWeight: 'bold' }}>Completed ✅</span>
                          : step.inProgress ? <span style={{ color: '#a36b00', fontWeight: 'bold' }}>In progress ⏳</span>
                          : <span style={{ color: '#666' }}>Pending</span>}
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      {step.action && <a href={step.action.href} className="btn btn-primary">{step.action.label}</a>}
                      {!step.done && step.waitMessage && <div style={{ marginTop: 8, color: '#666' }}>{step.waitMessage}</div>}
                    </div>
                  </div>
                ))}
              </div>

              {(application.loan_amount || application.amount || application.requested_amount) && (
                (() => {
                  const d = computeLoanDetails(application);
                  return (
                    <div className="deductions-section" style={{ marginTop: '1rem' }}>
                      <h5>Loan Breakdown</h5>
                      <div>Gross Loan Amount: <b>{formatCurrency(d.amount)}</b></div>
                      <div>Duration (months): <b>{d.months}</b></div>
                      <div>Service Fee (3%): <b>{formatCurrency(d.serviceFee)}</b></div>
                      <div>Share Capital (3%): <b>{formatCurrency(d.shareCapital)}</b></div>
                      <div>Insurance: <b>{formatCurrency(d.insurance)}</b></div>
                      <div>Net Proceeds: <b>{formatCurrency(d.netProceeds)}</b></div>
                      <h5 style={{ marginTop: '1rem' }}>Repayment</h5>
                      <div>Monthly Interest Rate: <b>{(d.monthlyInterestRate * 100).toFixed(2)}%</b></div>
                      <div>Estimated Monthly Payment: <b>{formatCurrency(d.monthlyPayment)}</b></div>
                    </div>
                  );
                })()
              )}

              {application.reviewer_comments && (
                <div style={{ marginTop: '1rem' }}>
                  <h5>Reviewer Comments</h5>
                  <p>{application.reviewer_comments}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoanTracker;
