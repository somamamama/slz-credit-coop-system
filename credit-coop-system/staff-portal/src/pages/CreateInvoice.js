import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './Dashboard.css';

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0 });

const CreateInvoice = () => {
    const [memberId, setMemberId] = useState('');
    const [memberName, setMemberName] = useState('');
    const [memberNumber, setMemberNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([emptyItem()]);
    const [tax, setTax] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [createdInvoice, setCreatedInvoice] = useState(null);

    const subtotal = useMemo(() => {
        return items.reduce((sum, it) => {
            const qty = Number(it.quantity) || 0;
            const price = Number(it.unit_price) || 0;
            return sum + qty * price;
        }, 0);
    }, [items]);

    const total = useMemo(() => {
        const t = Number(tax) || 0;
        const d = Number(discount) || 0;
        return Math.max(0, subtotal + t - d);
    }, [subtotal, tax, discount]);

    const updateItem = (index, key, value) => {
        setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
    };

    const addItem = () => setItems((prev) => [...prev, emptyItem()]);
    const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!memberName || items.length === 0) {
            setError('Member name and at least one item are required');
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch('http://localhost:5000/api/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'token': localStorage.token
                },
                body: JSON.stringify({
                    member_id: memberId ? Number(memberId) : null,
                    member_name: memberName,
                    member_number: memberNumber || null,
                    items,
                    subtotal: Number(subtotal.toFixed(2)),
                    tax: Number((Number(tax) || 0).toFixed(2)),
                    discount: Number((Number(discount) || 0).toFixed(2)),
                    total: Number(total.toFixed(2)),
                    notes
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setCreatedInvoice(data.invoice);
            } else {
                setError(data.message || 'Failed to create invoice');
            }
        } catch (err) {
            setError('Network error creating invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        const doc = new jsPDF();
        console.log('jsPDF instance:', doc);
        console.log('autoTable method available:', typeof doc.autoTable);
        const yStart = 14;
        doc.setFontSize(16);
        doc.text('Invoice', 14, yStart);
        doc.setFontSize(10);
        const createdAt = createdInvoice?.created_at ? new Date(createdInvoice.created_at).toLocaleString() : new Date().toLocaleString();
        doc.text(`Invoice ID: ${createdInvoice?.id || 'N/A'}`, 14, yStart + 8);
        doc.text(`Date: ${createdAt}`, 14, yStart + 13);
        doc.text(`Member: ${createdInvoice?.member_name || memberName}`, 14, yStart + 18);
        if (createdInvoice?.member_number || memberNumber) {
            doc.text(`Member No: ${createdInvoice?.member_number || memberNumber}`, 14, yStart + 23);
        }

        const printableItems = (createdInvoice?.items || items).map((it) => [
            it.description,
            String(it.quantity),
            Number(it.unit_price).toFixed(2),
            (Number(it.quantity) * Number(it.unit_price)).toFixed(2)
        ]);

        // Use autoTable method on doc object
        try {
            doc.autoTable({
                startY: yStart + 28,
                head: [['Description', 'Qty', 'Unit Price', 'Amount']],
                body: printableItems,
                styles: { fontSize: 10 }
            });
        } catch (error) {
            console.warn('doc.autoTable failed, using basic table rendering:', error);
            // Fallback if autoTable is not available
            let tableY = yStart + 28;
            
            // Draw header
            doc.setFontSize(10);
            doc.text('Description', 14, tableY);
            doc.text('Qty', 100, tableY);
            doc.text('Unit Price', 130, tableY);
            doc.text('Amount', 160, tableY);
            tableY += 7;
            
            // Draw items
            printableItems.forEach((item) => {
                doc.text(String(item[0]), 14, tableY);
                doc.text(String(item[1]), 100, tableY);
                doc.text(String(item[2]), 130, tableY);
                doc.text(String(item[3]), 160, tableY);
                tableY += 5;
            });
            
            // Set finalY for summary positioning
            doc.lastAutoTable = { finalY: tableY };
        }

        let currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || (yStart + 28 + (printableItems.length * 5) + 10);
        const summaryY = currentY + 8;
        const s = createdInvoice ? Number(createdInvoice.subtotal) : subtotal;
        const t = createdInvoice ? Number(createdInvoice.tax) : Number(tax) || 0;
        const d = createdInvoice ? Number(createdInvoice.discount) : Number(discount) || 0;
        const tot = createdInvoice ? Number(createdInvoice.total) : total;

        doc.text(`Subtotal: ₱${s.toFixed(2)}`, 150, summaryY);
        doc.text(`Tax: ₱${t.toFixed(2)}`, 150, summaryY + 5);
        doc.text(`Discount: ₱${d.toFixed(2)}`, 150, summaryY + 10);
        doc.setFontSize(12);
        doc.text(`Total: ₱${tot.toFixed(2)}`, 150, summaryY + 17);
        doc.setFontSize(10);
        if ((createdInvoice?.notes || notes)) {
            doc.text(`Notes: ${createdInvoice?.notes || notes}`, 14, summaryY + 25);
        }

        doc.save(`invoice_${createdInvoice?.id || 'draft'}.pdf`);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Create Invoice</h1>
                <p className="dashboard-subtitle">Issue an invoice to a member and print</p>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-section">
                    <h2>Member Details</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Member ID (optional)</label>
                                <input type="number" value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="e.g., 123" />
                            </div>
                            <div className="form-group">
                                <label>Member Number (optional)</label>
                                <input type="text" value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} placeholder="e.g., M-0001" />
                            </div>
                            <div className="form-group">
                                <label>Member Name</label>
                                <input type="text" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Full name" required />
                            </div>
                        </div>

                        <h3 style={{ marginTop: 16 }}>Line Items</h3>
                        {items.map((it, idx) => (
                            <div key={idx} className="form-row">
                                <div className="form-group" style={{ flex: 2 }}>
                                    <label>Description</label>
                                    <input type="text" value={it.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Description" required />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Unit Price</label>
                                    <input type="number" step="0.01" value={it.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
                                </div>
                                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                                    <button type="button" className="action-btn warning" onClick={() => removeItem(idx)}>Remove</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="action-btn info" onClick={addItem}>
                            + Add Item
                        </button>

                        <div className="form-row" style={{ marginTop: 16 }}>
                            <div className="form-group">
                                <label>Tax</label>
                                <input type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Discount</label>
                                <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                            </div>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label>Notes</label>
                                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
                            </div>
                        </div>

                        <div className="stats-grid" style={{ marginTop: 12 }}>
                            <div className="stat-card info">
                                <div className="stat-info">
                                    <h3>Subtotal</h3>
                                    <span className="stat-number">₱{subtotal.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="stat-card warning">
                                <div className="stat-info">
                                    <h3>Tax</h3>
                                    <span className="stat-number">₱{(Number(tax) || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="stat-card success">
                                <div className="stat-info">
                                    <h3>Discount</h3>
                                    <span className="stat-number">₱{(Number(discount) || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="stat-card primary">
                                <div className="stat-info">
                                    <h3>Total</h3>
                                    <span className="stat-number">₱{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {error ? <p className="error-text" style={{ marginTop: 8 }}>{error}</p> : null}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button type="submit" className="action-btn success" disabled={submitting}>
                                {submitting ? 'Creating...' : 'Create Invoice'}
                            </button>
                            {createdInvoice ? (
                                <button type="button" className="action-btn primary" onClick={handlePrint}>
                                    Print / Save PDF
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>

                {createdInvoice ? (
                    <div className="dashboard-section">
                        <h2>Invoice Preview</h2>
                        <div className="activity-list">
                            <div className="activity-item">
                                <span className="activity-desc">Invoice #{createdInvoice.id} for {createdInvoice.member_name}</span>
                            </div>
                            <div className="activity-item">
                                <span className="activity-desc">Total: ₱{Number(createdInvoice.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default CreateInvoice;


