import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import { toast } from 'react-toastify';
import './LoanApplication.css';

const LoanApplication = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    dateFiled: '',
    loanType: '',
    membershipType: 'regular',
    lastName: '',
    firstName: '',
    middleName: '',
    gender: '',
    civilStatus: '',
    birthDate: '',
    landline: '',
    mobileNumber: '',
    currentAddress: '',
    yearsOfStayCurrent: '',
    permanentAddress: '',
    yearsOfStayPermanent: '',
    homeOwnership: '',
    emailAddress: '',
    spouseName: '',
    numberOfChildren: '',
    dateHired: '',
    companyBusiness: '',
    contractPeriod: '',
    designationPosition: '',
    yearsInCompany: ''
  });
  const [govIdFile, setGovIdFile] = useState(null);
  const [companyIdFile, setCompanyIdFile] = useState(null);
  const [govIdPreview, setGovIdPreview] = useState(null);
  const [companyIdPreview, setCompanyIdPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const govIdInputRef = useRef(null);
  const companyIdInputRef = useRef(null);

  // Handle form input changes with real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear any existing status messages when user starts typing
    if (submitStatus) {
      setSubmitStatus(null);
    }
  };

  // Handle field focus for helpful hints
  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  // Handle field blur
  const handleFieldBlur = () => {
    setFocusedField(null);
  };

  // Get helper text for focused field
  const getHelperText = (fieldName) => {
    const helpers = {
      'mobileNumber': 'Enter your Philippine mobile number (e.g., 09123456789)',
      'emailAddress': 'We will use this email for loan application updates',
      'birthDate': 'You must be at least 18 years old to apply for a loan',
      'currentAddress': 'Enter your complete current residential address',
      'permanentAddress': 'Enter your permanent address (if different from current)',
      'loanType': 'Quick Loan: Faster processing, Regular Loan: Higher amounts available',
      'yearsOfStayCurrent': 'How long have you been living at your current address?',
      'yearsOfStayPermanent': 'How long have you been associated with your permanent address?'
    };
    return helpers[fieldName] || '';
  };

  // Handle file selection for Gov't ID
  const handleGovIdSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSubmitStatus({
          type: 'error',
          message: 'Please select a valid image file for Government ID.'
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setSubmitStatus({
          type: 'error',
          message: 'Government ID file size must be less than 10MB.'
        });
        return;
      }

      setGovIdFile(file);
      setSubmitStatus(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setGovIdPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file selection for Company ID
  const handleCompanyIdSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSubmitStatus({
          type: 'error',
          message: 'Please select a valid image file for Company ID.'
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setSubmitStatus({
          type: 'error',
          message: 'Company ID file size must be less than 10MB.'
        });
        return;
      }

      setCompanyIdFile(file);
      setSubmitStatus(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompanyIdPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Real-time field validation helper was removed to reduce unused code; validation
  // is performed at submit time via `validateForm`.

  // Form validation helpers
  const validateForm = () => {
    const errors = [];
    
    // Check required fields
    const requiredFields = [
      { field: 'dateFiled', label: 'Date Filed' },
      { field: 'loanType', label: 'Loan Type' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'firstName', label: 'First Name' },
      { field: 'gender', label: 'Gender' },
      { field: 'civilStatus', label: 'Civil Status' },
      { field: 'birthDate', label: 'Birth Date' },
      { field: 'mobileNumber', label: 'Mobile Number' },
      { field: 'currentAddress', label: 'Current Address' },
      { field: 'yearsOfStayCurrent', label: 'Years of Stay (Current)' },
      { field: 'permanentAddress', label: 'Permanent Address' },
      { field: 'yearsOfStayPermanent', label: 'Years of Stay (Permanent)' },
      { field: 'homeOwnership', label: 'Home Ownership' },
      { field: 'emailAddress', label: 'Email Address' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !formData[field]);
    if (missingFields.length > 0) {
      errors.push(`Missing required fields: ${missingFields.map(({ label }) => label).join(', ')}`);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.emailAddress && !emailRegex.test(formData.emailAddress)) {
      errors.push('Please enter a valid email address');
    }

    // Mobile number validation (Philippine format)
    const mobileRegex = /^(09|\+639)\d{9}$/;
    if (formData.mobileNumber && !mobileRegex.test(formData.mobileNumber.replace(/\s+/g, ''))) {
      errors.push('Please enter a valid Philippine mobile number (e.g., 09123456789)');
    }

    // File upload validation
    if (!govIdFile) {
      errors.push('Government Photo ID is required');
    }
    if (!companyIdFile) {
      errors.push('Company ID is required');
    }

    // Age validation (must be 18 or older)
    if (formData.birthDate) {
      const today = new Date();
      const birthDate = new Date(formData.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      if (age < 18) {
        errors.push('You must be at least 18 years old to apply for a loan');
      }
    }

    return errors;
  };

  // Clear status messages after a delay
  const clearStatusMessage = () => {
    setTimeout(() => {
      setSubmitStatus(null);
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous status
    setSubmitStatus(null);
    
    // Validate form using our enhanced validation
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      setSubmitStatus({
        type: 'error',
        message: validationErrors.join('. ')
      });
      clearStatusMessage();
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData to handle file uploads (similar to membership application)
      const formDataToSend = new FormData();
      
      // Append all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add files with consistent naming
      if (govIdFile) {
        formDataToSend.append('gov_id_file', govIdFile);
      }
      if (companyIdFile) {
        formDataToSend.append('company_id_file', companyIdFile);
      }
      
      // Add user information
      formDataToSend.append('user_id', user.user_id);
      formDataToSend.append('memberEmail', user.user_email);

      const response = await fetch('http://localhost:5001/api/loan-application/submit', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Loan application submitted successfully!', {
          position: toast.POSITION.TOP_RIGHT,
          autoClose: 5000,
        });
        
        setApplicationId(result.application_id);
        setShowSuccessModal(true);
        setSubmitStatus({
          type: 'success',
          message: `Thank you for your loan application! Your application has been submitted successfully. Application ID: ${result.application_id}. We'll review it and contact you within 2-3 business days.`
        });
        
        // Reset form to initial state (similar to membership application)
        setFormData({
          dateFiled: '',
          loanType: '',
          membershipType: 'regular',
          lastName: '',
          firstName: '',
          middleName: '',
          gender: '',
          civilStatus: '',
          birthDate: '',
          landline: '',
          mobileNumber: '',
          currentAddress: '',
          yearsOfStayCurrent: '',
          permanentAddress: '',
          yearsOfStayPermanent: '',
          homeOwnership: '',
          emailAddress: '',
          spouseName: '',
          numberOfChildren: '',
          dateHired: '',
          companyBusiness: '',
          contractPeriod: '',
          designationPosition: '',
          yearsInCompany: ''
        });
        
        // Reset file uploads
        setGovIdFile(null);
        setCompanyIdFile(null);
        setGovIdPreview(null);
        setCompanyIdPreview(null);
        
        // Clear file input values
        if (govIdInputRef.current) govIdInputRef.current.value = '';
        if (companyIdInputRef.current) companyIdInputRef.current.value = '';
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.message || 'Failed to submit loan application. Please try again.'
        });
        clearStatusMessage();
      }
    } catch (error) {
      console.error('Error submitting loan application:', error);
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please check your connection and try again.'
      });
      clearStatusMessage();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate form completion percentage
  const calculateFormProgress = () => {
    const requiredFields = [
      'dateFiled', 'loanType', 'lastName', 'firstName', 'gender', 'civilStatus',
      'birthDate', 'mobileNumber', 'currentAddress', 'yearsOfStayCurrent',
      'permanentAddress', 'yearsOfStayPermanent', 'homeOwnership', 'emailAddress'
    ];
    
    const completedFields = requiredFields.filter(field => formData[field]);
    const fileUploadsCompleted = (govIdFile ? 1 : 0) + (companyIdFile ? 1 : 0);
    
    const totalRequired = requiredFields.length + 2; // +2 for file uploads
    const totalCompleted = completedFields.length + fileUploadsCompleted;
    
    return Math.round((totalCompleted / totalRequired) * 100);
  };

  // Success Modal Component
  const SuccessModal = () => (
    <div className={`success-modal-overlay ${showSuccessModal ? 'show' : ''}`}>
      <div className="success-modal">
        <div className="success-icon">✅</div>
        <h3>Application Submitted Successfully!</h3>
        <p>Thank you for submitting your loan application.</p>
        <div className="application-details">
          <p><strong>Application ID:</strong> {applicationId}</p>
          <p><strong>Status:</strong> Under Review</p>
          <p><strong>Expected Processing:</strong> 2-3 business days</p>
        </div>
        <div className="modal-actions">
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowSuccessModal(false);
              setApplicationId(null);
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="loan-application">
      <Header />
      
      <main className="loan-application-main">
        <div className="container">
          {/* Page Header */}
          <div className="page-header">
            <h1>🏦 Loan Application</h1>
            <p>Complete the loan application form below</p>
            
            {/* Progress Indicator */}
            <div className="form-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${calculateFormProgress()}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Form Completion: {calculateFormProgress()}%
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="loan-form">
            {/* Loan Type Selection */}
            <div className="form-section">
              <div className="section-card card">
                <h2>📋 Loan Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateFiled">Date Filed (MM-DD-YYYY) *</label>
                    <input
                      type="date"
                      id="dateFiled"
                      name="dateFiled"
                      value={formData.dateFiled}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="loanType">Type of Loan *</label>
                    <select
                      id="loanType"
                      name="loanType"
                      value={formData.loanType}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('loanType')}
                      onBlur={handleFieldBlur}
                      required
                    >
                      <option value="">Select Loan Type</option>
                      <option value="quick">Quick Loan</option>
                      <option value="regular">Regular Loan</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="membershipType">Membership Type *</label>
                    <select
                      id="membershipType"
                      name="membershipType"
                      value={formData.membershipType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="regular">Regular</option>
                      <option value="associate">Associate</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <div className="section-card card">
                <h2>👤 Personal Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="middleName">Middle Name</label>
                    <input
                      type="text"
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="civilStatus">Civil Status *</label>
                    <select
                      id="civilStatus"
                      name="civilStatus"
                      value={formData.civilStatus}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Civil Status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="birthDate">Birth Date (MM-DD-YYYY) *</label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('birthDate')}
                      onBlur={handleFieldBlur}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="form-section">
              <div className="section-card card">
                <h2>📞 Contact Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="landline">Landline</label>
                    <input
                      type="tel"
                      id="landline"
                      name="landline"
                      value={formData.landline}
                      onChange={handleInputChange}
                      placeholder="(02) 123-4567"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="mobileNumber">Mobile Number *</label>
                    <input
                      type="tel"
                      id="mobileNumber"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('mobileNumber')}
                      onBlur={handleFieldBlur}
                      placeholder="09123456789"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="emailAddress">Email Address *</label>
                    <input
                      type="email"
                      id="emailAddress"
                      name="emailAddress"
                      value={formData.emailAddress}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('emailAddress')}
                      onBlur={handleFieldBlur}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="form-section">
              <div className="section-card card">
                <h2>🏠 Address Information</h2>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="currentAddress">Current Address *</label>
                    <textarea
                      id="currentAddress"
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleInputChange}
                      onFocus={() => handleFieldFocus('currentAddress')}
                      onBlur={handleFieldBlur}
                      rows="3"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="yearsOfStayCurrent">Years of Stay (Current) *</label>
                    <input
                      type="number"
                      id="yearsOfStayCurrent"
                      name="yearsOfStayCurrent"
                      value={formData.yearsOfStayCurrent}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="homeOwnership">Home Ownership *</label>
                    <select
                      id="homeOwnership"
                      name="homeOwnership"
                      value={formData.homeOwnership}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Home Ownership</option>
                      <option value="owned_with_amortization">Owned (with amortization)</option>
                      <option value="owned_fully_paid">Owned (Fully-paid)</option>
                      <option value="owned_living_with_relatives">Owned (Living with parents/relatives/partner)</option>
                      <option value="renting">Renting</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="permanentAddress">Permanent Address *</label>
                    <textarea
                      id="permanentAddress"
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleInputChange}
                      rows="3"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="yearsOfStayPermanent">Years of Stay (Permanent) *</label>
                    <input
                      type="number"
                      id="yearsOfStayPermanent"
                      name="yearsOfStayPermanent"
                      value={formData.yearsOfStayPermanent}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Family Information */}
            <div className="form-section">
              <div className="section-card card">
                <h2>👨‍👩‍👧‍👦 Family Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="spouseName">Name of Spouse</label>
                    <input
                      type="text"
                      id="spouseName"
                      name="spouseName"
                      value={formData.spouseName}
                      onChange={handleInputChange}
                      placeholder="Leave blank if not applicable"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="numberOfChildren">No. of Children</label>
                    <input
                      type="number"
                      id="numberOfChildren"
                      name="numberOfChildren"
                      value={formData.numberOfChildren}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="form-section">
              <div className="section-card card">
                <h2>💼 Employment Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateHired">Date Hired (MM-DD-YYYY)</label>
                    <input
                      type="date"
                      id="dateHired"
                      name="dateHired"
                      value={formData.dateHired}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="yearsInCompany">Years in the Company</label>
                    <input
                      type="number"
                      id="yearsInCompany"
                      name="yearsInCompany"
                      value={formData.yearsInCompany}
                      onChange={handleInputChange}
                      min="0"
                      step="0.1"
                      placeholder="If employed"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="companyBusiness">Company/Business</label>
                    <input
                      type="text"
                      id="companyBusiness"
                      name="companyBusiness"
                      value={formData.companyBusiness}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contractPeriod">Contract Period</label>
                    <input
                      type="text"
                      id="contractPeriod"
                      name="contractPeriod"
                      value={formData.contractPeriod}
                      onChange={handleInputChange}
                      placeholder="e.g., Permanent, 1 year, 6 months"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="designationPosition">Designation/Position</label>
                    <input
                      type="text"
                      id="designationPosition"
                      name="designationPosition"
                      value={formData.designationPosition}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="form-section">
              <div className="section-card card">
                <h2>📄 Document Upload</h2>
                
                <div className="upload-grid">
                  {/* Government ID Upload */}
                  <div className="upload-item">
                    <h3>Government Photo ID *</h3>
                    <div className="upload-area">
                      <input
                        type="file"
                        ref={govIdInputRef}
                        accept="image/*"
                        onChange={handleGovIdSelect}
                        className="file-input"
                        id="gov-id-upload"
                      />
                      <label htmlFor="gov-id-upload" className="upload-label">
                        {govIdFile ? (
                          <div className="file-selected">
                            <div className="file-icon">📄</div>
                            <div className="file-info">
                              <p className="file-name">{govIdFile.name}</p>
                              <p className="file-size">{(govIdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button 
                              className="btn-remove"
                              onClick={(e) => {
                                e.preventDefault();
                                setGovIdFile(null);
                                setGovIdPreview(null);
                                if (govIdInputRef.current) {
                                  govIdInputRef.current.value = '';
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="upload-placeholder">
                            <div className="upload-icon">📁</div>
                            <p>Upload Government ID</p>
                            <p className="upload-hint">JPG, PNG, or other image formats</p>
                          </div>
                        )}
                      </label>
                      {govIdPreview && (
                        <div className="file-preview">
                          <img src={govIdPreview} alt="Government ID preview" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company ID Upload */}
                  <div className="upload-item">
                    <h3>Company ID *</h3>
                    <div className="upload-area">
                      <input
                        type="file"
                        ref={companyIdInputRef}
                        accept="image/*"
                        onChange={handleCompanyIdSelect}
                        className="file-input"
                        id="company-id-upload"
                      />
                      <label htmlFor="company-id-upload" className="upload-label">
                        {companyIdFile ? (
                          <div className="file-selected">
                            <div className="file-icon">📄</div>
                            <div className="file-info">
                              <p className="file-name">{companyIdFile.name}</p>
                              <p className="file-size">{(companyIdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            <button 
                              className="btn-remove"
                              onClick={(e) => {
                                e.preventDefault();
                                setCompanyIdFile(null);
                                setCompanyIdPreview(null);
                                if (companyIdInputRef.current) {
                                  companyIdInputRef.current.value = '';
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="upload-placeholder">
                            <div className="upload-icon">📁</div>
                            <p>Upload Company ID</p>
                            <p className="upload-hint">JPG, PNG, or other image formats</p>
                          </div>
                        )}
                      </label>
                      {companyIdPreview && (
                        <div className="file-preview">
                          <img src={companyIdPreview} alt="Company ID preview" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Helper Text Section */}
            {focusedField && getHelperText(focusedField) && (
              <div className="form-section">
                <div className="helper-card">
                  <div className="helper-icon">💡</div>
                  <div className="helper-text">
                    <strong>Tip:</strong> {getHelperText(focusedField)}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Section */}
            <div className="form-section">
              <div className="section-card card">
                <div className="submit-section">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner"></span>
                        Submitting Application...
                      </>
                    ) : (
                      'Submit Loan Application'
                    )}
                  </button>
                </div>

                {/* Status Message */}
                {submitStatus && (
                  <div className={`status-message ${submitStatus.type}`}>
                    {submitStatus.type === 'success' ? '✅' : '❌'} {submitStatus.message}
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Loan Requirements */}
          <div className="instructions-section">
            <div className="instructions-card card">
              <h2>� Loan Requirements</h2>
              
              <div className="requirements-category">
                <h3>📄 Basic Requirements</h3>
                <ul>
                  <li>Loan application form</li>
                  <li>Borrower/Co-Borrower</li>
                  <li>1 Valid ID</li>
                  <li>TIN Number/Sedula</li>
                  <li>Barangay Clearance</li>
                </ul>
              </div>

              <div className="requirements-category">
                <h3>💡 Proof of Billing</h3>
                <ul>
                  <li>Electric Bill receipt</li>
                  <li>Water Bill</li>
                </ul>
              </div>

              <div className="requirements-category">
                <h3>💰 Proof of Income (whatever is applicable)</h3>
                
                <div className="income-subcategory">
                  <h4>👨‍💼 For Employed/Work:</h4>
                  <ul>
                    <li>Payslip/Contract</li>
                    <li>Certificate of employment/salary</li>
                  </ul>
                </div>

                <div className="income-subcategory">
                  <h4>🏢 For Business:</h4>
                  <ul>
                    <li>ITR Business Permit and ITR (with picture of business)</li>
                    <li>Financial Statement (preferably audited)</li>
                    <li>Mayor/Barangay Permit</li>
                    <li>DTI permit/Business Permit</li>
                    <li>Statement of income</li>
                    <li>Daily/Weekly/Monthly Income records</li>
                  </ul>
                </div>
              </div>

              <div className="requirements-note">
                <h3>📝 Important Notes:</h3>
                <ul>
                  <li>All fields marked with * in the form above are required</li>
                  <li>Government Photo ID and Company ID must be uploaded as clear images</li>
                  <li>Maximum file size: 10MB per document</li>
                  <li>Ensure all information is accurate and complete</li>
                  <li>Additional documents may be requested during processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Success Modal */}
      <SuccessModal />
    </div>
  );
};

export default LoanApplication;