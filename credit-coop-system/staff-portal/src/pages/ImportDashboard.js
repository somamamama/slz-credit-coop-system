import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../pages/Dashboard.css';
import * as XLSX from 'xlsx';

const ImportDashboard = () => {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importStats, setImportStats] = useState({
        total: 0,
        successful: 0,
        failed: 0
    });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Required minimal columns for membership applications on the backend
    const requiredColumns = [
        'first_name',
        'last_name',
        'email_address'
    ];

    const [previewColumns, setPreviewColumns] = useState([]);

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setError(null);

        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);

                    // Determine file columns and check required minimal columns
                    const fileColumns = Object.keys(jsonData[0] || {}).map(c => c.toString());
                    const missingRequired = requiredColumns.filter(col => !fileColumns.includes(col));

                    if (missingRequired.length > 0) {
                        setError(`Missing required columns: ${missingRequired.join(', ')}`);
                        setPreviewData(null);
                        setPreviewColumns([]);
                        return;
                    }

                    setPreviewColumns(fileColumns);
                    setPreviewData(jsonData.slice(0, 5)); // Preview first 5 rows
                } catch (err) {
                    setError('Error reading file. Please ensure it is a valid Excel file.');
                    setPreviewData(null);
                }
            };
            reader.readAsArrayBuffer(selectedFile);
        }
    };

    const handleImport = async () => {
        if (!file || !previewData) return;

        setImporting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/api/import-members', {
                method: 'POST',
                headers: {
                    'token': localStorage.token
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                setImportStats({
                    total: result.total,
                    successful: result.successful,
                    failed: result.failed
                });
            } else {
                setError(result.message || 'Import failed');
            }
        } catch (err) {
            setError('Network error while importing data');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div className="page-title">
                    <h1>Member Import Dashboard</h1>
                    <p className="dashboard-subtitle">
                        Import member data from Excel files into the system
                    </p>
                </div>
                <div className="page-actions">
                    <button 
                        className="btn btn-secondary"
                        onClick={() => navigate('/members')}
                    >
                        <span>👥</span>
                        View Members
                    </button>
                </div>
            </div>

            <div className="import-section">
                {/* Controls (search / filter / create) to match Members layout */}
                <div className="page-controls" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search by name, email, or member number..."
                            className="form-control"
                            style={{ minWidth: '320px' }}
                        />
                        <select className="form-control" style={{ width: '180px' }}>
                            <option>All Members</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                    </div>
                    <div>
                        <button className="btn btn-primary" onClick={() => navigate('/members')}>
                            Create New Member
                        </button>
                    </div>
                </div>

                <div className="card import-card">
                    <div className="card-header">
                        <h2>Import Members</h2>
                        <p>Upload an Excel file containing member information</p>
                    </div>
                    <div className="card-body">
                        <div className="file-upload-container">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="file-input"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="file-label">
                                <span>📎</span>
                                Choose Excel File
                            </label>
                            {file && (
                                <div className="file-info">
                                    <span>Selected file: </span>
                                    {file.name}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}

                        {previewData && (
                            <div className="preview-section">
                                <h3>Data Preview</h3>
                                <div className="preview-table-container">
                                    <table className="preview-table">
                                        <thead>
                                                    <tr>
                                                        {previewColumns.map(col => (
                                                            <th key={col}>{col}</th>
                                                        ))}
                                                    </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, index) => (
                                                <tr key={index}>
                                                    {previewColumns.map(col => (
                                                        <td key={col}>{row[col] !== undefined ? String(row[col]) : ''}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="preview-note">
                                    Showing first 5 rows of {file?.name}
                                </div>

                                <button
                                    className="btn btn-primary import-btn"
                                    onClick={handleImport}
                                    disabled={importing}
                                >
                                    {importing ? (
                                        <>
                                            <span className="spinner"></span>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <span>📥</span>
                                            Import Data
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {importStats.total > 0 && (
                            <div className="import-stats">
                                <h3>Import Results</h3>
                                <div className="stats-grid">
                                    <div className="stat-card primary">
                                        <div className="stat-info">
                                            <h4>Total Records</h4>
                                            <span className="stat-number">{importStats.total}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card success">
                                        <div className="stat-info">
                                            <h4>Successfully Imported</h4>
                                            <span className="stat-number">{importStats.successful}</span>
                                        </div>
                                    </div>
                                    <div className="stat-card danger">
                                        <div className="stat-info">
                                            <h4>Failed Records</h4>
                                            <span className="stat-number">{importStats.failed}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportDashboard;
