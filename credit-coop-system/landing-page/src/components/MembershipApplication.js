import React, { useState } from 'react';
import './MembershipApplication.css';
import { ReactComponent as CheckCircleIcon } from '../assets/icons/finance/check-circle-svgrepo-com.svg';

const sanitizeApiBase = (value) => {
  const normalized = String(value || '').trim();

  // Guard against unresolved env placeholders like REACT_APP_* ending up in URLs.
  if (!normalized || /^\/?REACT_APP_/i.test(normalized)) {
    return '';
  }

  return normalized.replace(/\/$/, '');
};

const FALLBACK_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api.slzcreditcoop.online'
  : 'http://localhost:3002';

const MEMBERSHIP_API_BASE =
  sanitizeApiBase(process.env.REACT_APP_LANDING_API_URL) || FALLBACK_API_BASE;

const MembershipApplication = () => {
  const [formData, setFormData] = useState({
    // Basic membership information
    // numberOfShares and amountSubscribe removed per request
    date: '',
    membershipType: '',
    
    // Personal information
    lastName: '',
    firstName: '',
    middleName: '',
    suffix: '',
    address: '',
    contactNumber: '',
    typeOfAddress: '',
    occupiedSince: '',
    emailAddress: '',
    dateOfBirth: '',
    placeOfBirth: '',
    religion: '',
    age: '',
    gender: '',
    civilStatus: '',
    highestEducationalAttainment: '',
    
    // Family information
    spouseFullName: '',
    fathersFullName: '',
    mothersMaidenName: '',
    numberOfDependents: '',
    
    // Professional information
    occupation: '',
    annualIncome: '',
    taxIdentificationNumber: '',
    identificationType: '',
    identificationNumber: '',
    employmentChoice: '', // sole trader or employed
    
    // If self employed
    businessType: '',
    businessAddress: '',
    
    // If employed
    employerTradeName: '',
    employerTinNumber: '',
    employerPhoneNumber: '',
    dateHiredFrom: '',
    dateHiredTo: '',
    employmentOccupation: '',
    employmentOccupationStatus: '',
    annualMonthlyIndicator: '',
    employmentIndustry: '',
    
    // Social and reference
    facebookAccount: '',
    referencePerson: '',
    referenceAddress: '',
    referenceContactNumber: '',
    
    // File upload
    profileImage: null,
    idDocument: null,
    
    // Agreements
    agreeToTerms: false,
    agreeToPrivacy: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    let newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value;

    // Enforce max length of 11 characters for Tax Identification Number
    if (name === 'taxIdentificationNumber' && typeof newValue === 'string') {
      newValue = newValue.slice(0, 11);
    }

    // Helper to get max length for identification number based on type
    const getIdNumberMaxLength = (idType) => {
      if (!idType) return null;
      switch (idType) {
        case 'TIN ID':
          return 11;
        case 'SSS Card':
          return 12;
        case 'Philhealth Card':
          return 14;
        case 'UMID':
          return 13;
        default:
          return null;
      }
    };

    // If the user changed the identification type, trim existing identificationNumber to new max
    if (name === 'identificationType') {
      const newIdType = newValue;
      const max = getIdNumberMaxLength(newIdType);
      const currentIdNum = formData.identificationNumber || '';
      const trimmedIdNum = (typeof currentIdNum === 'string' && max) ? currentIdNum.slice(0, max) : currentIdNum;
      setFormData({
        ...formData,
        identificationType: newIdType,
        identificationNumber: trimmedIdNum
      });
      return;
    }

    // If user is typing identificationNumber, enforce max according to currently selected type
    if (name === 'identificationNumber' && typeof newValue === 'string') {
      const max = getIdNumberMaxLength(formData.identificationType);
      if (max) newValue = newValue.slice(0, max);
    }

    setFormData({
      ...formData,
      [name]: newValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate Tax Identification Number length
    if (formData.taxIdentificationNumber && String(formData.taxIdentificationNumber).length > 11) {
      alert('Tax Identification Number must be at most 11 characters long.');
      return;
    }

    // Validate identification number length according to selected ID type
    const idTypeMax = (type => {
      switch (type) {
        case 'TIN ID': return 11;
        case 'SSS Card': return 12;
        case 'Philhealth Card': return 14;
        case 'UMID': return 13;
        default: return null;
      }
    })(formData.identificationType);

    if (idTypeMax && formData.identificationNumber && String(formData.identificationNumber).length > idTypeMax) {
      alert(`${formData.identificationType} number must be at most ${idTypeMax} characters long.`);
      return;
    }

    // Additional validation for ID document
    if (formData.identificationType && !formData.idDocument) {
      alert('Please upload an image of your selected ID type.');
      return;
    }
    
    try {
      // Create FormData to handle file upload
      const formDataToSubmit = new FormData();
      
      // Append all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'profileImage' && formData[key]) {
          formDataToSubmit.append('profileImage', formData[key]);
        } else if (key === 'idDocument' && formData[key]) {
          formDataToSubmit.append('idDocument', formData[key]);
        } else if (formData[key] !== null && formData[key] !== '') {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      // Submit to backend API
      const response = await fetch(`${MEMBERSHIP_API_BASE}/api/membership-application`, {
        method: 'POST',
        body: formDataToSubmit
      });

      const result = await response.json();

      if (result.success) {
        alert('Thank you for your membership application! We\'ll review it and contact you within 2-3 business days.');
        
        // Reset form
        setFormData({
          // Basic membership information
          // numberOfShares and amountSubscribe removed per request
          date: '',
          membershipType: '',
          
          // Personal information
          lastName: '',
          firstName: '',
          middleName: '',
          suffix: '',
          address: '',
          contactNumber: '',
          typeOfAddress: '',
          occupiedSince: '',
          emailAddress: '',
          dateOfBirth: '',
          placeOfBirth: '',
          religion: '',
          age: '',
          gender: '',
          civilStatus: '',
          highestEducationalAttainment: '',
          
          // Family information
          spouseFullName: '',
          fathersFullName: '',
          mothersMaidenName: '',
          numberOfDependents: '',
          
          // Professional information
          occupation: '',
          annualIncome: '',
          taxIdentificationNumber: '',
          identificationType: '',
          identificationNumber: '',
          employmentChoice: '',
          
          // If self employed
          businessType: '',
          businessAddress: '',
          
          // If employed
          employerTradeName: '',
          employerTinNumber: '',
          employerPhoneNumber: '',
          dateHiredFrom: '',
          dateHiredTo: '',
          employmentOccupation: '',
          employmentOccupationStatus: '',
          annualMonthlyIndicator: '',
          employmentIndustry: '',
          
          // Social and reference
          facebookAccount: '',
          referencePerson: '',
          referenceAddress: '',
          referenceContactNumber: '',
          
          // File upload
          profileImage: null,
          idDocument: null,
          
          // Agreements
          agreeToTerms: false,
          agreeToPrivacy: false
        });
      } else {
        alert('Error submitting application: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  return (
    <section id="membership" className="membership-application">
      <div className="container">
        <div className="section-header">
          <h2>Become a Member Today</h2>
          <p>Join our cooperative family and enjoy exclusive benefits, competitive rates, and personalized service.</p>
        </div>

        <div className="membership-content">
          <div className="benefits-section">
            <h3>Membership Requirements</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Accomplished Membership Form</h4>
                <p>Complete and submit the membership application form</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Minimum Share Capital</h4>
                <p>Php 1,000.00 minimum share capital investment</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Membership Fee</h4>
                <p>One-time membership fee of Php 300.00</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Valid ID</h4>
                <p>1 valid government-issued identification with uploaded photo</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>2x2 Picture</h4>
                <p>Recent 2x2 photograph for member records</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Proof of Residency</h4>
                <p>Document proving current address</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Resident of Batangas</h4>
                <p>Must be a resident of Batangas province</p>
              </div>
              <div className="benefit-item">
                <span className="benefit-icon">
                  <CheckCircleIcon />
                </span>
                <h4>Legal Age</h4>
                <p>Must be 18 years old or above</p>
              </div>
            </div>
          </div>

          <form className="application-form" onSubmit={handleSubmit}>
            <h3>Member Application</h3>
            
            {/* Basic Membership Information */}
            <div className="form-section">
              <h4>Membership Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Membership Type *</label>
                  <div className="select-with-info">
                    <select
                      name="membershipType"
                      value={formData.membershipType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Membership Type</option>
                      <option value="regular">Regular</option>
                      <option value="associate">Associate</option>
                    </select>
                    <span
                      className="info-icon"
                      tabIndex="0"
                      aria-label="More information about membership types"
                      title="More information"
                    >
                      i
                      <div className="tooltip" role="tooltip">
                        <strong>Regular</strong>: Full member with voting rights. Required share capital and full access to loans and dividends.<br />
                        <strong>Associate</strong>: Limited member; typically no voting rights. May have restricted access to certain benefits and services.
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <h4>Personal Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Suffix</label>
                  <input
                    type="text"
                    name="suffix"
                    value={formData.suffix}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type of Address *</label>
                  <select
                    name="typeOfAddress"
                    value={formData.typeOfAddress}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="house owner">House Owner</option>
                    <option value="lessee">Lessee</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Occupied Since (DD-MM-YYYY) *</label>
                  <input
                    type="date"
                    name="occupiedSince"
                    value={formData.occupiedSince}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="emailAddress"
                    value={formData.emailAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Place of Birth *</label>
                  <input
                    type="text"
                    name="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Religion</label>
                  <input
                    type="text"
                    name="religion"
                    value={formData.religion}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Civil Status *</label>
                  <select
                    name="civilStatus"
                    value={formData.civilStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Highest Educational Attainment *</label>
                <select
                  name="highestEducationalAttainment"
                  value={formData.highestEducationalAttainment}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Education Level</option>
                  <option value="elementary">Elementary</option>
                  <option value="high school">High School</option>
                  <option value="college">College</option>
                  <option value="graduate">Graduate</option>
                  <option value="post-graduate">Post Graduate</option>
                </select>
              </div>
            </div>

            {/* Family Information */}
            <div className="form-section">
              <h4>Family Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Spouse Full Name</label>
                  <input
                    type="text"
                    name="spouseFullName"
                    value={formData.spouseFullName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Father's Full Name</label>
                  <input
                    type="text"
                    name="fathersFullName"
                    value={formData.fathersFullName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Mother's Maiden Name</label>
                  <input
                    type="text"
                    name="mothersMaidenName"
                    value={formData.mothersMaidenName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Number of Dependents</label>
                  <input
                    type="number"
                    name="numberOfDependents"
                    value={formData.numberOfDependents}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="form-section">
              <h4>Professional Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Occupation *</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Annual Income *</label>
                  <input
                    type="number"
                    name="annualIncome"
                    value={formData.annualIncome}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tax Identification Number</label>
                  <input
                    type="text"
                    name="taxIdentificationNumber"
                    value={formData.taxIdentificationNumber}
                    onChange={handleChange}
                    maxLength={11}
                  />
                </div>
                <div className="form-group">
                  <label>Identification Type *</label>
                  <select
                    name="identificationType"
                    value={formData.identificationType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select ID Type</option>
                    <option value="TIN ID">TIN ID</option>
                    <option value="SSS Card">SSS Card</option>
                    <option value="GSIS">GSIS</option>
                    <option value="Philhealth Card">Philhealth Card</option>
                    <option value="Senior citizen card">Senior citizen card</option>
                    <option value="UMID">UMID</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Identification Number *</label>
                  <input
                    type="text"
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleChange}
                    required
                    maxLength={(() => {
                      switch (formData.identificationType) {
                        case 'TIN ID': return 11;
                        case 'SSS Card': return 12;
                        case 'Philhealth Card': return 14;
                        case 'UMID': return 13;
                        default: return undefined;
                      }
                    })()}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Employment Choice *</label>
                <select
                  name="employmentChoice"
                  value={formData.employmentChoice}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Employment Type</option>
                  <option value="sole trader">Sole Trader</option>
                  <option value="employed">Employed</option>
                </select>
              </div>

              {/* Self Employed Section */}
              {formData.employmentChoice === 'sole trader' && (
                <div className="conditional-section">
                  <h5>Self Employed Information</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Business Type *</label>
                      <input
                        type="text"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Business Address *</label>
                      <input
                        type="text"
                        name="businessAddress"
                        value={formData.businessAddress}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Employed Section */}
              {formData.employmentChoice === 'employed' && (
                <div className="conditional-section">
                  <h5>Employment Information</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Employer Trade Name *</label>
                      <input
                        type="text"
                        name="employerTradeName"
                        value={formData.employerTradeName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Employer TIN Number</label>
                      <input
                        type="text"
                        name="employerTinNumber"
                        value={formData.employerTinNumber}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Employer Phone Number</label>
                      <input
                        type="tel"
                        name="employerPhoneNumber"
                        value={formData.employerPhoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date Hired From</label>
                      <input
                        type="date"
                        name="dateHiredFrom"
                        value={formData.dateHiredFrom}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Date Hired To</label>
                      <input
                        type="date"
                        name="dateHiredTo"
                        value={formData.dateHiredTo}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Employment Occupation</label>
                      <input
                        type="text"
                        name="employmentOccupation"
                        value={formData.employmentOccupation}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Employment Occupation Status</label>
                      <select
                        name="employmentOccupationStatus"
                        value={formData.employmentOccupationStatus}
                        onChange={handleChange}
                      >
                        <option value="">Select Status</option>
                        <option value="permanent">Permanent</option>
                        <option value="contractual">Contractual</option>
                        <option value="probationary">Probationary</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Annual/Monthly Indicator</label>
                      <select
                        name="annualMonthlyIndicator"
                        value={formData.annualMonthlyIndicator}
                        onChange={handleChange}
                      >
                        <option value="">Select Indicator</option>
                        <option value="annual">Annual</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Employment Industry</label>
                      <input
                        type="text"
                        name="employmentIndustry"
                        value={formData.employmentIndustry}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Social and Reference Information */}
            <div className="form-section">
              <h4>Social and Reference Information</h4>
              <div className="form-group">
                <label>Facebook Account</label>
                <input
                  type="text"
                  name="facebookAccount"
                  value={formData.facebookAccount}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Reference Person *</label>
                  <input
                    type="text"
                    name="referencePerson"
                    value={formData.referencePerson}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reference Address *</label>
                  <input
                    type="text"
                    name="referenceAddress"
                    value={formData.referenceAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reference Contact Number *</label>
                  <input
                    type="tel"
                    name="referenceContactNumber"
                    value={formData.referenceContactNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="form-section">
              <h4>Document Upload</h4>
              
              {/* Profile Image Upload */}
              <div className="form-group">
                <label>Upload Profile Image (2x2 Photo) *</label>
                <input
                  type="file"
                  name="profileImage"
                  accept="image/*"
                  onChange={handleChange}
                  required
                />
                <small>Please upload a clear 2x2 photo of yourself (JPG, PNG, max 5MB)</small>
                {formData.profileImage && (
                  <div className="file-preview">
                    <p>Selected file: {formData.profileImage.name}</p>
                  </div>
                )}
              </div>

              {/* ID Document Upload - Only show if ID type is selected */}
              {formData.identificationType && (
                <div className="form-group">
                  <label>Upload {formData.identificationType} Image *</label>
                  <input
                    type="file"
                    name="idDocument"
                    accept="image/*"
                    onChange={handleChange}
                    required
                  />
                  <small>Please upload a clear photo of both sides of your {formData.identificationType} (JPG, PNG, max 5MB)</small>
                  {formData.idDocument && (
                    <div className="file-preview">
                      <p>Selected file: {formData.idDocument.name}</p>
                    </div>
                  )}
                </div>
              )}

              {!formData.identificationType && (
                <div className="form-note">
                  <p>Please select an ID type above to enable document upload</p>
                </div>
              )}
            </div>

            {/* Agreements */}
            <div className="form-section">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    required
                  />
                  I agree to the Terms and Conditions and Membership Agreement *
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="agreeToPrivacy"
                    checked={formData.agreeToPrivacy}
                    onChange={handleChange}
                    required
                  />
                  I agree to the Privacy Policy and consent to data processing *
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary submit-btn">
              Submit Application
            </button>

            <p className="form-note">
              * Required fields. Your application will be reviewed within 2-3 business days.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default MembershipApplication;