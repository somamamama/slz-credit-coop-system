// Load environment variables from .env when present (development convenience)
// This allows the server to pick up `jwtSecret`, `PAYMONGO_SECRET_KEY`, etc.
try {
  require('dotenv').config();
} catch (e) {
  // If dotenv is not installed, we silently continue; env vars can still be provided by the OS.
}

const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./db_members'); // Import database connection

// Utility: resolve PayMongo secret from env with optional fallbacks for local dev
function resolvePaymongoKey() {
  const keysTried = [];
  const primary = process.env.PAYMONGO_SECRET_KEY;
  keysTried.push(primary ? 'PAYMONGO_SECRET_KEY' : null);
  if (primary) return primary;

  // Fallbacks (local/dev only) - prefer explicit server var
  const alt = process.env.PAYMONGO_TEST_KEY || process.env.REACT_APP_PAYMONGO_SECRET_KEY || null;
  if (alt) {
    console.warn('Using fallback PayMongo key from environment (RECOMMENDED: set PAYMONGO_SECRET_KEY).');
    return alt;
  }

  return null;
}

//middlewares
app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use('/loan_applications', express.static('loan_applications'));
app.use('/payment_references', express.static('payment_references'));

//routes

//login route
app.use('/auth', require('./routes/coopauth'));

app.use('/dashboard', require('./routes/dashboard'));

// Configure multer for loan application file uploads
const loanUploadStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads', 'loan_documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const loanUpload = multer({ 
    storage: loanUploadStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Loan application submission endpoint with database integration
app.post('/api/loan-application/submit', loanUpload.fields([
    { name: 'gov_id_file', maxCount: 1 },
    { name: 'company_id_file', maxCount: 1 }
]), async (req, res) => {
    try {
        // Extract form data
        const {
            user_id, memberEmail, dateFiled, loanType, membershipType,
            lastName, firstName, middleName, gender, civilStatus, birthDate,
            landline, mobileNumber, emailAddress,
            currentAddress, yearsOfStayCurrent, permanentAddress, yearsOfStayPermanent, homeOwnership,
            spouseName, numberOfChildren,
            dateHired, companyBusiness, contractPeriod, designationPosition, yearsInCompany
        } = req.body;

        // Get file paths (store relative paths for database)
        const govIdFilePath = req.files?.gov_id_file ? 
            `uploads/loan_documents/${req.files.gov_id_file[0].filename}` : null;
        const companyIdFilePath = req.files?.company_id_file ? 
            `uploads/loan_documents/${req.files.company_id_file[0].filename}` : null;

        // Validate required fields
        if (!memberEmail || !dateFiled || !loanType || !lastName || !firstName || !gender || 
            !civilStatus || !birthDate || !mobileNumber || !emailAddress || !currentAddress || 
            !yearsOfStayCurrent || !permanentAddress || !yearsOfStayPermanent || !homeOwnership) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Get member number from member_users table using email
        let memberNumber = null;
        let actualUserId = null;
        
        try {
            const memberQuery = `
                SELECT user_id, member_number 
                FROM member_users 
                WHERE user_email = $1
            `;
            const memberResult = await pool.query(memberQuery, [memberEmail]);
            
            if (memberResult.rows.length > 0) {
                actualUserId = memberResult.rows[0].user_id;
                memberNumber = memberResult.rows[0].member_number;
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found in system'
                });
            }
        } catch (memberError) {
            console.error('Error finding member:', memberError);
            return res.status(500).json({
                success: false,
                message: 'Error validating member information'
            });
        }

        // Insert loan application into database
        const insertQuery = `
            INSERT INTO loan_applications (
                user_id, member_number, date_filed, loan_type, membership_type,
                last_name, first_name, middle_name, gender, civil_status, birth_date,
                landline, mobile_number, email_address,
                current_address, years_of_stay_current, permanent_address, years_of_stay_permanent, home_ownership,
                spouse_name, number_of_children,
                date_hired, company_business, contract_period, designation_position, years_in_company,
                gov_id_file_path, company_id_file_path,
                status, submitted_at, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
                $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
                $22, $23, $24, $25, $26, $27, $28, 'pending', NOW(), NOW(), NOW()
            ) RETURNING application_id, submitted_at
        `;

        const values = [
            actualUserId, // Use the integer user_id from member_users table
            memberNumber, // Add member_number
            dateFiled, 
            loanType, 
            membershipType,
            lastName, 
            firstName, 
            middleName || null, 
            gender, 
            civilStatus, 
            birthDate,
            landline || null, 
            mobileNumber, 
            emailAddress,
            currentAddress, 
            parseFloat(yearsOfStayCurrent), 
            permanentAddress, 
            parseFloat(yearsOfStayPermanent), 
            homeOwnership,
            spouseName || null, 
            numberOfChildren ? parseInt(numberOfChildren) : 0,
            dateHired || null, 
            companyBusiness || null, 
            contractPeriod || null, 
            designationPosition || null, 
            yearsInCompany ? parseFloat(yearsInCompany) : null,
            govIdFilePath, 
            companyIdFilePath
        ];

        const result = await pool.query(insertQuery, values);
        const applicationId = result.rows[0].application_id;
        const submittedAt = result.rows[0].submitted_at;

        console.log(`Loan application submitted successfully. ID: ${applicationId}, Member: ${memberNumber}`);
        // Notify staff server about new application so connected staff clients get real-time updates
        try {
          const notifyPayload = {
            application_id: applicationId,
            member_number: memberNumber,
            first_name: firstName,
            last_name: lastName,
            submitted_at: submittedAt,
            status: 'pending',
            notify_role: 'credit_investigator'
          };
          // fire-and-forget POST to staff server
          fetch('http://localhost:5000/api/notify/new-application', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notifyPayload)
          }).then((r) => console.log('Notified staff server of new loan application, status=', r.status)).catch((e) => console.warn('Failed to notify staff server:', e));
        } catch (notifyErr) {
          console.warn('Notification to staff server failed:', notifyErr);
        }

        res.json({
            success: true,
            message: 'Loan application submitted successfully!',
            application_id: applicationId,
            member_number: memberNumber,
            submitted_at: submittedAt,
            status: 'pending'
        });

    } catch (error) {
        console.error('Error submitting loan application:', error);
        
        // Clean up uploaded files on error
        if (req.files?.gov_id_file) {
            try {
                fs.unlinkSync(req.files.gov_id_file[0].path);
            } catch (cleanupError) {
                console.error('Error cleaning up gov_id_file:', cleanupError);
            }
        }
        if (req.files?.company_id_file) {
            try {
                fs.unlinkSync(req.files.company_id_file[0].path);
            } catch (cleanupError) {
                console.error('Error cleaning up company_id_file:', cleanupError);
            }
        }
        
    // Log the full error for debugging
    console.error('Loan application DB error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting loan application',
      error: error.message || error
    });
    }
});

// Get loan applications for a user (by email)
app.get('/api/loan-applications/user/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // First get the user_id from member_users table
        const memberQuery = `SELECT user_id FROM member_users WHERE user_email = $1`;
        const memberResult = await pool.query(memberQuery, [email]);
        
        if (memberResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }
        
        const userId = memberResult.rows[0].user_id;
        
        const query = `
            SELECT 
                application_id,
                member_number,
                loan_type,
                membership_type,
                CONCAT(first_name, ' ', COALESCE(middle_name || ' ', ''), last_name) as full_name,
                status,
                submitted_at,
                reviewed_at,
                date_filed,
                mobile_number,
                email_address
            FROM loan_applications 
            WHERE user_id = $1 
            ORDER BY submitted_at DESC
        `;
        
        const result = await pool.query(query, [userId]);
        
        res.json({
            success: true,
            applications: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching loan applications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching loan applications'
        });
    }
});

// Get loan applications (by user_id query) - compatibility endpoint used by frontend
app.get('/api/loan-application/list', async (req, res) => {
  try {
    const { user_id, member_number } = req.query;

    let query = `
      SELECT
        application_id,
        user_id,
        member_number,
        loan_type,
        membership_type,
        first_name,
        last_name,
        status,
        review_status,
        submitted_at,
        reviewed_at,
        date_filed,
        mobile_number,
        email_address,
        amount
      FROM loan_applications
    `;

    const params = [];
    // Prefer filtering by member_number when provided (frontend may send member_number)
    if (member_number) {
      query += ' WHERE member_number = $1';
      params.push(member_number);
    } else if (user_id) {
      query += ' WHERE user_id = $1';
      params.push(user_id);
    }

    query += ' ORDER BY submitted_at DESC';

    const result = await pool.query(query, params);

    res.json({ success: true, applications: result.rows });
  } catch (error) {
    console.error('Error in /api/loan-application/list:', error);
    res.status(500).json({ success: false, message: 'Error fetching loan applications', error: error.message });
  }
});

// Get detailed loan application by ID
app.get('/api/loan-application/:application_id', async (req, res) => {
    try {
        const { application_id } = req.params;
        
        const query = `SELECT * FROM loan_applications WHERE application_id = $1`;
        const result = await pool.query(query, [application_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }
        
        res.json({
            success: true,
            application: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error fetching loan application details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching loan application details'
        });
    }
});

// Payment dues API endpoint
app.get('/api/payment-dues', (req, res) => {
  try {
    // Mock payment dues data - in real implementation, this would come from database
    const mockDues = [
      {
        id: 1,
        type: 'Monthly Loan Payment',
        amount: 15000.00,
        dueDate: '2024-01-15',
        status: 'overdue',
        description: 'Auto Loan - Monthly installment',
        accountNumber: 'LOAN-001-2023',
        daysOverdue: 5
      },
      {
        id: 2,
        type: 'Membership Fee',
        amount: 500.00,
        dueDate: '2024-01-20',
        status: 'due_soon',
        description: 'Annual membership fee',
        accountNumber: 'MEM-001-2024',
        daysUntilDue: 2
      },
      {
        id: 3,
        type: 'Insurance Premium',
        amount: 2500.00,
        dueDate: '2024-01-25',
        status: 'current',
        description: 'Life insurance premium',
        accountNumber: 'INS-001-2024',
        daysUntilDue: 7
      },
      {
        id: 4,
        type: 'Savings Contribution',
        amount: 2000.00,
        dueDate: '2024-02-01',
        status: 'current',
        description: 'Monthly savings contribution',
        accountNumber: 'SAV-001-2024',
        daysUntilDue: 14
      }
    ];
    
    res.json({ success: true, paymentDues: mockDues });
  } catch (err) {
    console.error('Error fetching payment dues:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payment dues' });
  }
});

// Payment history API endpoint (mock data)
app.get('/api/payment-history', (req, res) => {
  try {
    const history = [
      {
        id: 101,
        type: 'loan',
        title: 'Auto Loan - Monthly installment',
        amount: 15000.0,
        paidAt: '2024-01-10T09:45:00Z',
        reference: 'PR-20240110-0001',
        status: 'confirmed'
      },
      {
        id: 102,
        type: 'membership',
        title: 'Annual Membership Fee',
        amount: 500.0,
        paidAt: '2024-01-05T14:20:00Z',
        reference: 'PR-20240105-0007',
        status: 'confirmed'
      },
      {
        id: 103,
        type: 'insurance',
        title: 'Life Insurance Premium',
        amount: 2500.0,
        paidAt: '2023-12-28T11:10:00Z',
        reference: 'PR-20231228-0012',
        status: 'pending'
      }
    ];

    res.json({ success: true, history });
  } catch (err) {
    console.error('Error fetching payment history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// Payment history API endpoint (mock data)
app.get('/api/payment-history', (req, res) => {
  try {
    const history = [
      {
        id: 101,
        type: 'loan',
        title: 'Auto Loan - Monthly installment',
        amount: 15000.0,
        paidAt: '2024-01-10T09:45:00Z',
        reference: 'PR-20240110-0001',
        status: 'confirmed'
      },
      {
        id: 102,
        type: 'membership',
        title: 'Annual Membership Fee',
        amount: 500.0,
        paidAt: '2024-01-05T14:20:00Z',
        reference: 'PR-20240105-0007',
        status: 'confirmed'
      },
      {
        id: 103,
        type: 'insurance',
        title: 'Life Insurance Premium',
        amount: 2500.0,
        paidAt: '2023-12-28T11:10:00Z',
        reference: 'PR-20231228-0012',
        status: 'pending'
      }
    ];

    res.json({ success: true, history });
  } catch (err) {
    console.error('Error fetching payment history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// Payment reference upload endpoint
const paymentRefsDir = path.join(__dirname, 'payment_references');
if (!fs.existsSync(paymentRefsDir)) {
  fs.mkdirSync(paymentRefsDir, { recursive: true });
}

const paymentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paymentRefsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const ts = new Date().toISOString().replace(/[-:.TZ]/g, '');
    cb(null, `payment_ref_${ts}_${Math.random().toString(16).slice(2)}${ext}`);
  }
});

const paymentUpload = multer({
  storage: paymentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG/PNG images are allowed'));
  }
});

app.post('/api/payment/reference-upload', paymentUpload.single('reference_image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const publicPath = `payment_references/${req.file.filename}`;
    return res.json({ success: true, path: publicPath });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// Endpoint to confirm a payment (recommended: called by client after redirect OR by a webhook handler)
// Expects JSON body: { payment_intent_id?, checkout_session_id?, application_id, member_number }
app.post('/api/payments/confirm', async (req, res) => {
  const { payment_intent_id, checkout_session_id, application_id, member_number } = req.body || {};

  if (!payment_intent_id && !checkout_session_id) {
    return res.status(400).json({ success: false, message: 'payment_intent_id or checkout_session_id required' });
  }

  const PAYMONGO_KEY = resolvePaymongoKey();
  if (!PAYMONGO_KEY) {
    console.error('PAYMONGO_SECRET_KEY not set in server environment. Set PAYMONGO_SECRET_KEY env var.');
    return res.status(500).json({ success: false, message: 'Server misconfiguration: missing PayMongo secret. Set PAYMONGO_SECRET_KEY on the server.' });
  }

  try {
    // Use server-side fetch to retrieve the payment details from PayMongo for verification
    const authHeader = 'Basic ' + Buffer.from(`${PAYMONGO_KEY}:`).toString('base64');
    let paymongoResp;
    if (payment_intent_id) {
      paymongoResp = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}`, {
        method: 'GET', headers: { Authorization: authHeader }
      });
    } else {
      paymongoResp = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkout_session_id}`, {
        method: 'GET', headers: { Authorization: authHeader }
      });
    }

    if (!paymongoResp.ok) {
      const txt = await paymongoResp.text();
      console.error('Failed to fetch PayMongo payment:', paymongoResp.status, txt);
      return res.status(502).json({ success: false, message: 'Failed to verify payment with payment provider' });
    }

    const payData = await paymongoResp.json();
    // PayMongo amounts are in cents (integer)
    const attributes = payData.data && payData.data.attributes ? payData.data.attributes : {};
    const providerAmountCents = attributes.amount || 0;
    const providerCurrency = attributes.currency || 'PHP';
    const providerStatus = attributes.status || attributes.payment_status || 'unknown';
    const providerId = payData.data.id || null;
    const paidAt = attributes.paid_at ? new Date(attributes.paid_at) : (attributes.updated_at ? new Date(attributes.updated_at) : new Date());

    // Only process succeeded/paid status (adjust condition if provider uses a different status value)
    if (!['succeeded', 'paid', 'paid_out'].includes(String(providerStatus).toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Payment not in a completed state', status: providerStatus });
    }

    const paidAmount = Number(providerAmountCents) / 100.0;

    // Persist payment and deduct outstanding_balance atomically
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert payment record
      const insertPayment = `INSERT INTO payments (payment_provider_id, application_id, member_number, amount, currency, status, paid_at, raw_payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
      const insertValues = [providerId, application_id || null, member_number || null, paidAmount, providerCurrency, providerStatus, paidAt, JSON.stringify(payData)];
      const insertResult = await client.query(insertPayment, insertValues);

        console.log('Inserted payment record id=', insertResult.rows[0].id, 'providerId=', providerId, 'amount=', paidAmount);

      // Deduct outstanding balance
      const updateQuery = `UPDATE loan_applications
        SET outstanding_balance = GREATEST(COALESCE(outstanding_balance, 0) - $1, 0)
        WHERE application_id = $2
        RETURNING application_id, outstanding_balance, review_status`;
      const updateResult = await client.query(updateQuery, [paidAmount, application_id]);

  console.log('Updated loan application result rows=', updateResult.rows);

      if (updateResult.rows.length === 0) {
        // No loan found to apply payment to — rollback and return error
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Loan application not found for given application_id' });
      }

      const newBalance = updateResult.rows[0].outstanding_balance;
      const appId = updateResult.rows[0].application_id;

      // Optionally mark loan as paid if balance is zero
      if (Number(newBalance) <= 0) {
        await client.query(`UPDATE loan_applications SET review_status = 'paid' WHERE application_id = $1`, [appId]);
      }

      await client.query('COMMIT');

      // Emit or log event here if you have sockets wired up (left as a TODO)

      return res.json({ success: true, message: 'Payment recorded and applied', payment_id: insertResult.rows[0].id, application_id: appId, outstanding_balance: newBalance });
    } catch (txErr) {
      await client.query('ROLLBACK');
      console.error('Transaction error applying payment:', txErr);
      return res.status(500).json({ success: false, message: 'Failed to record payment' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error confirming payment:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during payment confirmation' });
  }
});

// Create a payment intent and checkout session via server (uses server-side secret)
app.post('/api/payments/create', async (req, res) => {
  const { amount_in_cents, payment_method, success_url, cancel_url, application_id, member_number } = req.body || {};
  const PAYMONGO_KEY = resolvePaymongoKey();
  if (!PAYMONGO_KEY) {
    console.error('PAYMONGO_SECRET_KEY not set. Set PAYMONGO_SECRET_KEY on the server.');
    return res.status(500).json({ success: false, message: 'Server misconfiguration: missing PayMongo secret. Set PAYMONGO_SECRET_KEY on the server.' });
  }

  if (!amount_in_cents || !payment_method) {
    return res.status(400).json({ success: false, message: 'amount_in_cents and payment_method are required' });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(`${PAYMONGO_KEY}:`).toString('base64');

    // Ensure success_url and cancel_url include application identifiers so the client can tie the redirect
    function appendQueryParams(url, params) {
      if (!url) return url;
      const hasQs = url.includes('?');
      const parts = [];
      for (const k in params) {
        if (params[k] !== null && params[k] !== undefined) {
          parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(params[k]))}`);
        }
      }
      if (parts.length === 0) return url;
      return `${url}${hasQs ? '&' : '?'}${parts.join('&')}`;
    }

    const successUrlFinal = appendQueryParams(success_url || `${process.env.CLIENT_ORIGIN || ''}/payment-success`, { application_id, member_number });
    const cancelUrlFinal = appendQueryParams(cancel_url || `${process.env.CLIENT_ORIGIN || ''}/payment`, { application_id, member_number });

    // Create payment intent
    const piPayload = {
      data: {
        type: 'payment_intent',
        attributes: {
          amount: amount_in_cents,
          currency: 'PHP',
          description: 'Credit Cooperative Payment',
          payment_method_allowed: [payment_method],
          capture_type: 'automatic',
          statement_descriptor: 'Credit Coop Payment'
        }
      }
    };

    const piResp = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authHeader }, body: JSON.stringify(piPayload)
    });

    if (!piResp.ok) {
      const txt = await piResp.text();
      console.error('PayMongo payment_intent creation failed:', txt);
      return res.status(502).json({ success: false, message: 'Failed to create payment intent' });
    }

    const piData = await piResp.json();
    const paymentIntentId = piData.data && piData.data.id;

    // Create checkout session using the final URLs that include application identifiers
    const checkoutPayload = {
      data: {
        type: 'checkout_session',
        attributes: {
          payment_intent_id: paymentIntentId,
          success_url: successUrlFinal,
          cancel_url: cancelUrlFinal,
          line_items: [
            { name: 'Credit Cooperative Payment', amount: amount_in_cents, currency: 'PHP', quantity: 1 }
          ],
          payment_method_types: [payment_method],
          description: 'Payment to Credit Cooperative'
        }
      }
    };

    const csResp = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: authHeader }, body: JSON.stringify(checkoutPayload)
    });

    if (!csResp.ok) {
      const txt = await csResp.text();
      console.error('PayMongo checkout_sessions creation failed:', txt);
      return res.status(502).json({ success: false, message: 'Failed to create checkout session' });
    }

    const csData = await csResp.json();
    const checkoutUrl = csData.data?.attributes?.checkout_url || null;

    return res.json({ success: true, checkout_url: checkoutUrl, payment_intent_id: paymentIntentId, raw: { payment_intent: piData, checkout: csData } });
  } catch (err) {
    console.error('Error creating payment via PayMongo:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get payment details (server-side) to avoid exposing secret in the client
app.get('/api/payments/details', async (req, res) => {
  const { payment_intent_id, checkout_session_id } = req.query || {};
  const PAYMONGO_KEY = resolvePaymongoKey();
  if (!PAYMONGO_KEY) return res.status(500).json({ success: false, message: 'Server misconfiguration: missing PayMongo secret. Set PAYMONGO_SECRET_KEY on the server.' });

  try {
    const authHeader = 'Basic ' + Buffer.from(`${PAYMONGO_KEY}:`).toString('base64');
    let resp;
    if (payment_intent_id) {
      resp = await fetch(`https://api.paymongo.com/v1/payment_intents/${payment_intent_id}`, { headers: { Authorization: authHeader } });
    } else if (checkout_session_id) {
      resp = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkout_session_id}`, { headers: { Authorization: authHeader } });
    } else {
      return res.status(400).json({ success: false, message: 'payment_intent_id or checkout_session_id required' });
    }

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('Failed fetching payment details:', txt);
      return res.status(502).json({ success: false, message: 'Failed to fetch payment details' });
    }

    const data = await resp.json();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching payment details:', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// Update user profile (members may update name/email but NOT member_number)
app.put('/api/user/update', async (req, res) => {
  try {
    // Resolve token from header or Authorization
    let jwtToken = req.header('token');
    if (!jwtToken) {
      const authHeader = req.header('authorization') || req.header('Authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        jwtToken = authHeader.split(' ')[1];
      }
    }

    if (!jwtToken) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    let userIdFromToken;
    try {
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.jwtSecret || 'default_jwt_secret_for_development_only_change_in_production';
      const payload = jwt.verify(jwtToken, jwtSecret);
      userIdFromToken = payload.user;
    } catch (err) {
      console.error('Token verification failed in /api/user/update:', err.message || err);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { user_id, name, email } = req.body || {};
    if (!user_id || !name || !email) {
      return res.status(400).json({ success: false, message: 'user_id, name and email are required' });
    }

    if (String(userIdFromToken) !== String(user_id)) {
      return res.status(403).json({ success: false, message: 'Cannot update another user\'s profile' });
    }

    // Perform the update (do NOT allow member_number changes here)
    const updateRes = await pool.query(
      `UPDATE member_users SET user_name = $1, user_email = $2, updated_at = NOW() WHERE user_id = $3 RETURNING user_id, user_name, user_email, member_number`,
      [name, email, user_id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: updateRes.rows[0] });
  } catch (err) {
    console.error('Error in /api/user/update:', err);
    // Unique constraint on email
    if (err && err.code === '23505') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Change password endpoint
app.post('/api/user/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'currentPassword and newPassword are required' });
    }

    // Resolve token
    let jwtToken = req.header('token');
    if (!jwtToken) {
      const authHeader = req.header('authorization') || req.header('Authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        jwtToken = authHeader.split(' ')[1];
      }
    }

    if (!jwtToken) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    let userIdFromToken;
    try {
      const jwt = require('jsonwebtoken');
      const jwtSecret = process.env.jwtSecret || 'default_jwt_secret_for_development_only_change_in_production';
      const payload = jwt.verify(jwtToken, jwtSecret);
      userIdFromToken = payload.user;
    } catch (err) {
      console.error('Token verification failed in /api/user/change-password:', err.message || err);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Fetch stored password hash
    const userRes = await pool.query('SELECT user_password FROM member_users WHERE user_id = $1', [userIdFromToken]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const storedHash = userRes.rows[0].user_password;
    const match = await bcrypt.compare(currentPassword, storedHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE member_users SET user_password = $1, updated_at = NOW() WHERE user_id = $2', [newHash, userIdFromToken]);

    return res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    console.error('Error in /api/user/change-password:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// Restore original `/api/user` route
app.get('/api/user', async (req, res) => {
  try {
    console.log('Incoming /api/user request, req.user=', req.user);

    // Try to resolve JWT from either custom 'token' header or standard Authorization: Bearer <token>
    let jwtToken = req.header('token');
    if (!jwtToken) {
      const authHeader = req.header('authorization') || req.header('Authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        jwtToken = authHeader.split(' ')[1];
      }
    }

    let userIdFromToken = req.user || null;
    if (!userIdFromToken) {
      if (!jwtToken) {
        console.warn('/api/user: no token provided');
        return res.status(401).json({ success: false, message: 'No token provided' });
      }
      try {
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.jwtSecret || 'default_jwt_secret_for_development_only_change_in_production';
        const payload = jwt.verify(jwtToken, jwtSecret);
        userIdFromToken = payload.user;
      } catch (err) {
        console.error('Token verification failed:', err.message || err);
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
    }

    const userResult = await pool.query(
      "SELECT user_id, user_name, user_email, member_number FROM member_users WHERE user_id = $1",
      [userIdFromToken]
    );
    const user = userResult.rows[0];
    console.log('/api/user query result user=', user);
    if (!user) {
      console.log('No user found for user_id:', req.user);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch loan data (include outstanding_balance so frontend can show remaining balance)
    const loanResult = await pool.query(
      `SELECT amount, duration_months, review_status, application_id, monthly_payment, outstanding_balance
       FROM loan_applications
       WHERE member_number = $1 AND review_status IN ('approved','paid')
       ORDER BY submitted_at DESC LIMIT 1`,
      [user.member_number]
    );
    user.loan = loanResult.rows[0] || null;

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Member Portal Server is running!', 
    status: 'OK',
    endpoints: {
      auth: '/auth',
      dashboard: '/dashboard',
      health: '/'
    }
  });
});

app.listen(5001, () => {
  console.log('Server is running on port 5001');
  console.log('Available endpoints:');
  console.log('  GET  / - Health check');
  console.log('  POST /auth/register - User registration');
  console.log('  POST /auth/login - User login');
  console.log('  GET  /auth/is-verify - Verify token');
  console.log('  GET  /dashboard - Get user dashboard data');
});