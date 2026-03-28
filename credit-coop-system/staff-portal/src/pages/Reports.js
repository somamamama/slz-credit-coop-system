import React, { useMemo, useState } from 'react';
import './Reports.css';

// Helper: format date as YYYY-MM-DD
const fmt = (d) => d.toISOString().slice(0, 10);

// Generate dummy financial rows for a month range
function generateFinancialData(startDate, endDate) {
  const rows = [];
  const s = new Date(startDate);
  const e = new Date(endDate);
  // create monthly buckets between s and e
  const cur = new Date(s.getFullYear(), s.getMonth(), 1);
  while (cur <= e) {
    const monthLabel = cur.toLocaleString(undefined, { month: 'short', year: 'numeric' });
    // dummy numbers
    const deposits = Math.round(50000 + Math.random() * 150000);
    const loans = Math.round(20000 + Math.random() * 120000);
    const interest = Math.round(loans * (0.02 + Math.random() * 0.06));
    const expenses = Math.round(5000 + Math.random() * 30000);
    const net = deposits - loans + interest - expenses;
    rows.push({ period: monthLabel, deposits, loans, interest, expenses, net });
    cur.setMonth(cur.getMonth() + 1);
  }
  return rows;
}

// Generate dummy member rows for a date range
function generateMemberData(startDate, endDate) {
  const rows = [];
  const s = new Date(startDate);
  const e = new Date(endDate);
  const totalDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
  const count = Math.min(40, Math.max(6, Math.round(totalDays / 7)));
  for (let i = 0; i < count; i++) {
    const join = new Date(s.getTime() + Math.random() * (e - s));
    rows.push({
      id: `M-${1000 + i}`,
      name: `Member ${i + 1}`,
      joined: fmt(join),
      shares: Math.round(1 + Math.random() * 50),
      contribution: Math.round(1000 + Math.random() * 40000),
    });
  }
  // sort by joined
  rows.sort((a, b) => (a.joined > b.joined ? 1 : -1));
  return rows;
}

const Reports = () => {
  const [reportType, setReportType] = useState('financial');
  const [preset, setPreset] = useState('last_month');
  const [from, setFrom] = useState(() => fmt(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)));
  const [to, setTo] = useState(() => fmt(new Date()));
  const [data, setData] = useState(null);
  const [orgName, setOrgName] = useState('SLZCoop');
  // reportTitle will be derived from orgName and embedded in PDF (no UI input)
  const reportTitle = orgName;
  // use a default public path for the logo; prefer the site-specific filename if present
  // try `/report-assets/slz_logo.png` (your uploaded file) first, then fall back to `/report-assets/logo.png`
  const [logoUrl, setLogoUrl] = useState('/report-assets/slz_logo.png');
  // no upload UI, so we don't expect in-memory data URL for logo
  const [logoDataUrl, setLogoDataUrl] = useState(null);

  const formatCurrencyPDF = (amount) => {
    // Format amount for the PDF. Many PDF fonts used by jsPDF don't render the
    // '₱' glyph correctly, so use a reliable ASCII prefix 'PHP ' to ensure
    // the symbol appears correctly in generated PDFs. If you prefer the
    // actual '₱' glyph we can embed a font that supports it (larger change).
    try {
      // use currency formatting but replace symbol with 'PHP '
      const formatted = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(amount ?? 0);
      // formatted may include the ₱ glyph; replace it with ASCII 'PHP '
      return formatted.replace(/[^0-9.,\s\-]+/g, 'PHP ');
    } catch (e) {
      return `PHP ${Number(amount || 0).toLocaleString()}`;
    }
  };

  // compute from/to when preset changes
  const applyPreset = (p) => {
    const now = new Date();
    let s, e;
    if (p === 'this_month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = now;
    } else if (p === 'last_month') {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0); // end of last month
    } else if (p === 'last_3_months') {
      s = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      e = now;
    } else if (p === 'ytd') {
      s = new Date(now.getFullYear(), 0, 1);
      e = now;
    } else {
      s = new Date();
      e = new Date();
    }
    setFrom(fmt(s));
    setTo(fmt(e));
    setPreset(p);
  };

  const handleGenerate = () => {
    if (!from || !to) return;
    if (new Date(from) > new Date(to)) {
      alert('Invalid range: from must be <= to');
      return;
    }
    if (reportType === 'financial') {
      setData({ headers: ['Period', 'Deposits', 'Loans', 'Interest', 'Expenses', 'Net'], rows: generateFinancialData(from, to) });
    } else {
      setData({ headers: ['ID', 'Name', 'Joined', 'Shares', 'Contribution'], rows: generateMemberData(from, to) });
    }
  };

  const [generating, setGenerating] = useState(false);

  const loadScript = (src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });

  const downloadPDF = async () => {
    if (!data) return;
    try {
      setGenerating(true);
      // load jsPDF UMD from CDN if not present
      if (!window.jspdf) {
        await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      }
      const jsPDF = window.jspdf ? window.jspdf.jsPDF : null;
      if (!jsPDF) throw new Error('jsPDF not available');

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const margin = 40;
      let y = 60;
      // Header: optional logo, org name, title, generated timestamp
      const pageWidth = doc.internal.pageSize.getWidth();
      const rightX = pageWidth - margin;

      // prefer in-memory uploaded logo (if any); otherwise try configured logoUrl first.
      // If that fails, attempt a fallback filename '/report-assets/logo.png'.
      let finalLogo = logoDataUrl || null;
      const tryFetchLogo = async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error('not ok');
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = reject;
            fr.readAsDataURL(blob);
          });
        } catch (e) {
          return null;
        }
      };

      if (!finalLogo) {
        finalLogo = logoUrl ? await tryFetchLogo(logoUrl) : null;
      }
      if (!finalLogo) {
        // fallback to generic logo.png
        finalLogo = await tryFetchLogo('/report-assets/logo.png');
      }

      // draw logo left if available and reserve content start X
      const logoW = 56;
      const logoH = 56;
      // center the logo vertically with the title area
      const headerCenterY = 48;
      if (finalLogo) {
        try {
          // try PNG first
          doc.addImage(finalLogo, 'PNG', margin, headerCenterY - logoH / 2, logoW, logoH);
        } catch (e) {
          try {
            doc.addImage(finalLogo, 'JPEG', margin, headerCenterY - logoH / 2, logoW, logoH);
          } catch (er) {
            console.warn('addImage failed for logo', er);
          }
        }
      }
      const contentStartX = finalLogo ? margin + logoW + 18 : margin;

  // header text - larger title and timestamp aligned to right
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  const titleText = reportTitle || (reportType === 'financial' ? 'Financial Report' : 'Member Report');
  const titleWidth = doc.getTextWidth(titleText);
  // place title centered vertically with the logo
  const titleY = headerCenterY;
  doc.text(titleText, (pageWidth - titleWidth) / 2, titleY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const generatedText = `Generated: ${new Date().toLocaleString()}`;
      const genWidth = doc.getTextWidth(generatedText);
      doc.text(generatedText, rightX - genWidth, titleY);

  // horizontal divider under header (moved down further)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  // shift divider down more to give additional breathing room
  doc.line(margin, titleY + 40, pageWidth - margin, titleY + 40);

  // leave more vertical space after header (nudge down accordingly)
  y = titleY + 56;

      // Prepare table layout and center it horizontally (but avoid overlapping logo)
      const headers = data.headers;
  const fullUsable = pageWidth - margin * 2;
  const maxColWidth = Math.floor(fullUsable / headers.length);
  const colWidth = Math.max(70, Math.min(maxColWidth, 160));
  const tableWidth = colWidth * headers.length;
  // center the table on the page (ignore logo horizontal area to keep
  // table visually centered)
  let contentStart = Math.floor((pageWidth - tableWidth) / 2);
  if (contentStart < margin) contentStart = margin;

  // render period at contentStart; nudge it down slightly so it doesn't
  // overlap the logo or header
  doc.setFontSize(10);
  const periodY = y + 12; // push period down
  doc.text(`Period: ${from} — ${to}`, contentStart, periodY);
  // advance y to after the period line
  y = periodY + 12;

      // compute summary stats for financial report
      let stats = {};
      if (reportType === 'financial') {
        const totalDeposits = data.rows.reduce((s, r) => s + (r.deposits || 0), 0);
        const totalLoans = data.rows.reduce((s, r) => s + (r.loans || 0), 0);
        const totalInterest = data.rows.reduce((s, r) => s + (r.interest || 0), 0);
        const totalExpenses = data.rows.reduce((s, r) => s + (r.expenses || 0), 0);
        const totalNet = data.rows.reduce((s, r) => s + (r.net || 0), 0);
        stats = { totalDeposits, totalLoans, totalInterest, totalExpenses, totalNet };
      } else {
        stats = { members: data.rows.length };
      }

      // removed stat/summary boxes for a cleaner report layout
      // keep a small gap before the table
      // y already advanced above

      // For financial reports, render a statement-style layout with colored
      // section bands (Assets / Liabilities / Net Assets) similar to the
      // provided sample. For member reports, fall back to the simple table.
      if (reportType === 'financial') {
        // title band similar to the sample
        const bandX = margin;
        const bandW = pageWidth - margin * 2;
        const bandH = 34;
        doc.setFillColor(178, 223, 238); // light blue
        doc.rect(bandX, y - 6, bandW, bandH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('Financial Report', bandX + 12, y + 14);
        // optional small org mark on the right of band
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'normal');
        const orgLabel = reportTitle || orgName || 'SLZCoop';
        doc.text(orgLabel, bandX + bandW - 8 - doc.getTextWidth(orgLabel), y + 14);
        // reset colors and move down
        doc.setTextColor(0, 0, 0);
        y += bandH + 8;

        // Render the generated report rows in a styled table so the PDF matches
        // the preview context: colored header band + table header + rows + a
        // bold colored totals row at the bottom.
        const colX = [];
        headers.forEach((h, i) => colX.push(contentStart + i * colWidth));

        // table header band
        const hdrH = 22;
        // ensure there's enough room on the current page for header + rows + totals
        const pageH = doc.internal.pageSize.getHeight();
        const rowsNeededH = (data.rows.length * 18) + 20 + 40; // rows + totals + padding
        if (y + hdrH + rowsNeededH > pageH - 60) {
          doc.addPage();
          y = 60;
        }
        doc.setFillColor(102, 179, 217); // blue header
        doc.rect(contentStart, y, tableWidth, hdrH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        headers.forEach((h, i) => {
          // align first column left, numeric columns right
          const isNumeric = i > 0;
          if (isNumeric) {
            doc.text(String(h), colX[i] + colWidth - 6, y + 14, { align: 'right' });
          } else {
            doc.text(String(h), colX[i] + 6, y + 14);
          }
        });
        y += hdrH + 4;

        // rows
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (let ri = 0; ri < data.rows.length; ri++) {
          const r = data.rows[ri];
          // no alternating gray/box backgrounds: keep rows clean
          // draw each cell with alignment
          const cells = [r.period, formatCurrencyPDF(r.deposits), formatCurrencyPDF(r.loans), formatCurrencyPDF(r.interest), formatCurrencyPDF(r.expenses), formatCurrencyPDF(r.net)];
          cells.forEach((c, i) => {
            const isNumeric = i > 0;
            if (isNumeric) {
              doc.setTextColor(0, 0, 0);
              doc.text(String(c), colX[i] + colWidth - 6, y + 8, { align: 'right' });
            } else {
              doc.setTextColor(0, 0, 0);
              doc.text(String(c), colX[i] + 6, y + 8);
            }
          });
          y += 18;
          // page break handling
          if (y > doc.internal.pageSize.getHeight() - 80) {
            doc.addPage();
            y = 60;
          }
        }

        // totals row (darker blue)
        const totalH = 20;
        const totalFill = [0, 120, 160];
        doc.setFillColor(...totalFill);
        doc.rect(contentStart, y - 6, tableWidth, totalH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        // left label
        doc.text('Totals', colX[0] + 6, y + 10);
        // numeric totals
        doc.text(formatCurrencyPDF(stats.totalDeposits), colX[1] + colWidth - 6, y + 10, { align: 'right' });
        doc.text(formatCurrencyPDF(stats.totalLoans), colX[2] + colWidth - 6, y + 10, { align: 'right' });
        doc.text(formatCurrencyPDF(stats.totalInterest), colX[3] + colWidth - 6, y + 10, { align: 'right' });
        doc.text(formatCurrencyPDF(stats.totalExpenses), colX[4] + colWidth - 6, y + 10, { align: 'right' });
        doc.text(formatCurrencyPDF(stats.totalNet), colX[5] + colWidth - 6, y + 10, { align: 'right' });
        y += totalH + 12;
        doc.setTextColor(0, 0, 0);

      } else {
        // Use jsPDF-AutoTable for member reports to handle pagination and
        // repeat headers automatically. This avoids missing rows when the
        // header is near the page bottom.
        if (!doc.autoTable) {
          // load the plugin synchronously (downloaded earlier if needed)
          // loadScript is available in this scope
          // eslint-disable-next-line no-await-in-loop
          await loadScript('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.5.28/dist/jspdf.plugin.autotable.min.js');
        }

        const body = data.rows.map((r) => [
          r.id,
          r.name,
          r.joined,
          r.shares ?? 0,
          (r.contribution ?? 0).toLocaleString(),
        ]);

        doc.autoTable({
          startY: y,
          head: [headers],
          body,
          theme: 'striped',
          styles: { font: 'helvetica', fontSize: 10 },
          headStyles: { fillColor: [102, 179, 217], textColor: 255, halign: 'center' },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'left' },
            2: { halign: 'left' },
            3: { halign: 'right' },
            4: { halign: 'right' },
          },
          margin: { left: contentStart, right: contentStart },
          tableWidth: tableWidth,
        });

        // autoTable sets lastAutoTable.finalY for the next content start
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : (y + (data.rows.length * 18));

        // draw totals row after the table
        const totalH = 20;
        const totalFill = [0, 120, 160];
        doc.setFillColor(...totalFill);
        doc.rect(contentStart, finalY + 6, tableWidth, totalH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const totalShares = data.rows.reduce((s, r) => s + (Number(r.shares || 0)), 0);
        const totalContribution = data.rows.reduce((s, r) => s + (Number(r.contribution || 0)), 0);
        doc.text('Totals', contentStart + 6, finalY + 6 + 14);
        // place member count under Joined column
        doc.text(String(data.rows.length), contentStart + (2 * colWidth) + colWidth - 6, finalY + 6 + 14, { align: 'right' });
        doc.text(String(totalShares), contentStart + (3 * colWidth) + colWidth - 6, finalY + 6 + 14, { align: 'right' });
        doc.text(totalContribution.toLocaleString(), contentStart + (4 * colWidth) + colWidth - 6, finalY + 6 + 14, { align: 'right' });
        y = finalY + totalH + 18;
        doc.setTextColor(0, 0, 0);
      }

      const fileName = `${reportType}-report-${from}_to_${to}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error('PDF generation error', err);
      alert('Failed to generate PDF: ' + (err.message || err));
    } finally {
      setGenerating(false);
    }
  };

  const preview = useMemo(() => data, [data]);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* logo: prefer in-memory logoDataUrl, then configured logoUrl, then generic */}
          <img
            src={logoDataUrl || logoUrl || '/report-assets/logo.png'}
            alt="SLZCoop logo"
            style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
            onError={(e) => { e.currentTarget.src = '/report-assets/logo.png'; }}
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem' }}>{orgName || 'SLZCoop'}</h1>
            <p style={{ margin: 0, color: '#666' }}>Generate automated financial and member reports</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div className="reports-controls">
          <label>
            Report type
            <br />
            <select value={reportType} onChange={(e) => { setReportType(e.target.value); setData(null); }}>
              <option value="financial">Financial</option>
              <option value="members">Members</option>
            </select>
          </label>

          <label>
            Preset
            <br />
            <select value={preset} onChange={(e) => applyPreset(e.target.value)}>
              <option value="last_month">Last month</option>
              <option value="this_month">This month</option>
              <option value="last_3_months">Last 3 months</option>
              <option value="ytd">Year to date</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          {/* Report title and logo are embedded into the PDF from a default asset path.
              To change the logo, put a file named `logo.png` into `staff-portal/public/report-assets/`.
              The UI no longer exposes title/logo inputs for downloads. */}

          <label>
            From
            <br />
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('custom'); }} />
          </label>

          <label>
            To
            <br />
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('custom'); }} />
          </label>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleGenerate}>Generate Report</button>
            <button className="btn" onClick={() => { setData(null); }}>Clear</button>
            <button className="btn" onClick={downloadPDF} disabled={!data || generating}>{generating ? 'Generating...' : 'Download PDF'}</button>
          </div>
        </div>
      </div>

      {preview ? (
        <div className="card reports-preview" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>{reportType === 'financial' ? 'Financial report (preview)' : 'Member report (preview)'}</h3>

          {/* Table preview (desktop/tablet) */}
          <div className="reports-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, idx) => (
                  <tr key={idx}>
                    {reportType === 'financial' ? (
                      <>
                        <td style={{ padding: '0.5rem' }}>{r.period}</td>
                        <td style={{ padding: '0.5rem' }}>{(r.deposits ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem' }}>{(r.loans ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem' }}>{(r.interest ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem' }}>{(r.expenses ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '0.5rem' }}>{(r.net ?? 0).toLocaleString()}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '0.5rem' }}>{r.id}</td>
                        <td style={{ padding: '0.5rem' }}>{r.name}</td>
                        <td style={{ padding: '0.5rem' }}>{r.joined}</td>
                        <td style={{ padding: '0.5rem' }}>{r.shares ?? 0}</td>
                        <td style={{ padding: '0.5rem' }}>{(r.contribution ?? 0).toLocaleString()}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked preview — shown on small screens */}
          <div className="reports-mobile-list" aria-hidden="false">
            {preview.rows.map((r, idx) => (
              <div key={idx} className="report-card">
                {reportType === 'financial' ? (
                  <>
                    <div className="report-row-top">
                      <div className="report-period">{r.period}</div>
                      <div className="report-net">{(r.net ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="report-row-meta">
                      <div>Deposits: <strong>{(r.deposits ?? 0).toLocaleString()}</strong></div>
                      <div>Loans: <strong>{(r.loans ?? 0).toLocaleString()}</strong></div>
                      <div>Interest: <strong>{(r.interest ?? 0).toLocaleString()}</strong></div>
                      <div>Expenses: <strong>{(r.expenses ?? 0).toLocaleString()}</strong></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="report-row-top">
                      <div className="report-member">{r.name} <span className="text-muted">#{r.id}</span></div>
                      <div className="report-contribution">{(r.contribution ?? 0).toLocaleString()}</div>
                    </div>
                    <div className="report-row-meta">
                      <div>Joined: <strong>{r.joined}</strong></div>
                      <div>Shares: <strong>{r.shares ?? 0}</strong></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginTop: '1rem', padding: '2rem', textAlign: 'center' }}>
          <p>No report generated yet — choose a preset or custom range and click <strong>Generate Report</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default Reports;
