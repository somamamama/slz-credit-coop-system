const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3002;

// --- Socket.IO setup for real-time events ---
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Database connection
const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'slz_coop_staff'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept profileImage and idDocument as images, and receipt as image or PDF
    if ((file.fieldname === 'profileImage' || file.fieldname === 'idDocument') && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else if (file.fieldname === 'receipt' && (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf')) {
      cb(null, true);
    } else if (file.fieldname !== 'profileImage' && file.fieldname !== 'idDocument' && file.fieldname !== 'receipt') {
      cb(new Error('Unexpected field: ' + file.fieldname));
    } else {
      cb(new Error('Only image files or PDF (for receipt) are allowed!'));
    }
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Routes

// Submit membership application
app.post('/api/membership-application', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'idDocument', maxCount: 1 }
]), async (req, res) => {
  console.log('Received membership application submission');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  
  try {
    const {
      // Basic membership information
      numberOfShares,
      amountSubscribe,
      date,
      membershipType,
      applicantsMembershipNumber,
      
      // Personal information
      lastName,
      firstName,
      middleName,
      suffix,
      address,
      contactNumber,
      typeOfAddress,
      occupiedSince,
      emailAddress,
      dateOfBirth,
      placeOfBirth,
      religion,
      age,
      gender,
      civilStatus,
      highestEducationalAttainment,
      
      // Family information
      spouseFullName,
      fathersFullName,
      mothersMaidenName,
      numberOfDependents,
      
      // Professional information
      occupation,
      annualIncome,
      taxIdentificationNumber,
      identificationType,
      identificationNumber,
      employmentChoice,
      
      // Self employed
      businessType,
      businessAddress,
      
      // Employed
      employerTradeName,
      employerTinNumber,
      employerPhoneNumber,
      dateHiredFrom,
      dateHiredTo,
      employmentOccupation,
      employmentOccupationStatus,
      annualMonthlyIndicator,
      employmentIndustry,
      
      // Social and reference
      facebookAccount,
      referencePerson,
      referenceAddress,
      referenceContactNumber
    } = req.body;

    const profileImagePath = req.files && req.files['profileImage'] ? req.files['profileImage'][0].filename : null;
    const idDocumentPath = req.files && req.files['idDocument'] ? req.files['idDocument'][0].filename : null;

    const query = `
      INSERT INTO membership_applications (
        number_of_shares, amount_subscribe, application_date, membership_type, 
        applicants_membership_number, last_name, first_name, middle_name, suffix,
        address, contact_number, type_of_address, occupied_since, email_address,
        date_of_birth, place_of_birth, religion, age, gender, civil_status,
        highest_educational_attainment, spouse_full_name, fathers_full_name,
        mothers_maiden_name, number_of_dependents, occupation, annual_income,
        tax_identification_number, identification_type, identification_number,
        employment_choice, business_type, business_address, employer_trade_name,
        employer_tin_number, employer_phone_number, date_hired_from, date_hired_to,
        employment_occupation, employment_occupation_status, annual_monthly_indicator,
        employment_industry, facebook_account, reference_person, reference_address,
        reference_contact_number, profile_image_path, id_document_path, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47,
        $48, 'pending', CURRENT_TIMESTAMP
      ) RETURNING application_id
    `;

    const values = [
      numberOfShares, amountSubscribe, date, membershipType, applicantsMembershipNumber,
      lastName, firstName, middleName, suffix, address, contactNumber, typeOfAddress,
      occupiedSince, emailAddress, dateOfBirth, placeOfBirth, religion, age, gender,
      civilStatus, highestEducationalAttainment, spouseFullName, fathersFullName,
      mothersMaidenName, numberOfDependents, occupation, annualIncome,
      taxIdentificationNumber, identificationType, identificationNumber,
      employmentChoice, businessType, businessAddress, employerTradeName,
      employerTinNumber, employerPhoneNumber, dateHiredFrom, dateHiredTo,
      employmentOccupation, employmentOccupationStatus, annualMonthlyIndicator,
      employmentIndustry, facebookAccount, referencePerson, referenceAddress,
      referenceContactNumber, profileImagePath, idDocumentPath
    ];

    const result = await pool.query(query, values);
    
    // Fetch the full inserted row so we can emit it to websocket clients
    try {
      const insertedId = result.rows[0].application_id;
      const newRowRes = await pool.query('SELECT * FROM membership_applications WHERE application_id = $1', [insertedId]);
      const newApp = newRowRes.rows[0];

      // Emit a real-time event for connected clients in the relevant role rooms
      try {
        // Notify admins and managers by default
        io.to('role:admin').to('role:manager').emit('new-application', newApp);
      } catch (emitErr) {
        console.warn('Failed to emit new-application event:', emitErr);
      }
    } catch (fetchErr) {
      console.warn('Failed to fetch inserted application for emit:', fetchErr);
    }

    res.status(201).json({
      success: true,
      message: 'Membership application submitted successfully!',
      applicationId: result.rows[0].application_id
    });

  } catch (error) {
    console.error('Error submitting membership application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit membership application',
      error: error.message
    });
  }
});

// Get all membership applications (for staff dashboard)
app.get('/api/membership-applications', async (req, res) => {
  try {
    const query = `
      SELECT * FROM membership_applications 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      applications: result.rows
    });

  } catch (error) {
    console.error('Error fetching membership applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership applications',
      error: error.message
    });
  }
});

// Suggest a membership number for an application based on its creation order within the year
app.get('/api/membership-applications/:id/suggest-membership-number', async (req, res) => {
  try {
    const { id } = req.params;
    // fetch the application to get its created_at
    const appRes = await pool.query('SELECT application_id, created_at FROM membership_applications WHERE application_id = $1', [id]);
    if (appRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const createdAt = appRes.rows[0].created_at;
    const year = new Date(createdAt).getFullYear();

    // count how many applications were created in the same year up to and including this one
    const countRes = await pool.query(
      `SELECT COUNT(*)::integer as seq
       FROM membership_applications
       WHERE EXTRACT(YEAR FROM created_at) = $1
         AND created_at <= $2`,
      [year, createdAt]
    );

  const seq = countRes.rows[0] && Number(countRes.rows[0].seq) ? Number(countRes.rows[0].seq) : 0;
  // Format: MEM + last two digits of year + sequence padded to 5 digits
  // Example: for year 2025 and seq 1022 -> MEM2501022
  const yy = String(year).slice(-2);
  const padded = String(seq).padStart(5, '0');
  const membershipNumber = `MEM${yy}${padded}`;

    res.json({ success: true, membershipNumber });
  } catch (error) {
    console.error('Error suggesting membership number:', error);
    res.status(500).json({ success: false, message: 'Failed to suggest membership number', error: error.message });
  }
});

// Update application status
app.put('/api/membership-applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, membershipNumber } = req.body;

    let query, params;

    if (membershipNumber) {
      // Include membership number in the update
      query = `
        UPDATE membership_applications 
        SET status = $1, review_notes = $2, reviewed_at = CURRENT_TIMESTAMP, applicants_membership_number = $4
        WHERE application_id = $3
        RETURNING *
      `;
      params = [status, reviewNotes, id, membershipNumber];
    } else {
      // Regular update without membership number
      query = `
        UPDATE membership_applications 
        SET status = $1, review_notes = $2, reviewed_at = CURRENT_TIMESTAMP
        WHERE application_id = $3
        RETURNING *
      `;
      params = [status, reviewNotes, id];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Emit socket events for specific status transitions
    try {
      const updated = result.rows[0];
      if (updated.status === 'forwarded_to_manager') {
        // Notify managers that an application is now on process
        io.to('role:manager').emit('application-on-process', updated);
      }
      if (updated.status === 'forwarded_to_it_admin') {
        // Notify IT that an application was forwarded to them
        io.to('role:it_admin').emit('application-on-process-it', updated);
      }
      if (updated.status === 'approved') {
        // Notify IT admins that an application has been approved
        io.to('role:it_admin').emit('application-approved', updated);
      }
    } catch (emitErr) {
      console.warn('Failed to emit status-change socket event:', emitErr);
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
});

// Upload receipt for a membership application (admin review)
app.post('/api/membership-applications/:id/receipt', upload.single('receipt'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No receipt file uploaded' });
    }

    const receiptPath = req.file.filename;
    const notes = req.body.notes || null;

    // Ensure the table has columns for receipt_path and receipt_uploaded_at. If migration hasn't run,
    // this will fail - migrations should be applied separately. For safety, attempt to add column if missing.
    try {
      await pool.query("ALTER TABLE membership_applications ADD COLUMN IF NOT EXISTS receipt_path VARCHAR(500)");
      await pool.query("ALTER TABLE membership_applications ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMP");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_membership_applications_receipt_path ON membership_applications(receipt_path)");
    } catch (mErr) {
      // Log and continue; update may still fail if DB permissions disallow.
      console.warn('Receipt migration attempt warning:', mErr.message || mErr);
    }

    // Update the application record with the receipt path and timestamp. Optionally append notes.
    const updateQuery = `
      UPDATE membership_applications
      SET receipt_path = $1,
          receipt_uploaded_at = CURRENT_TIMESTAMP,
          review_notes = CASE WHEN review_notes IS NULL OR review_notes = '' THEN $2 ELSE review_notes || '\n' || $2 END
      WHERE application_id = $3
      RETURNING *
    `;

    const updateParams = [receiptPath, notes || 'Receipt uploaded by admin', id];
    const result = await pool.query(updateQuery, updateParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const updated = result.rows[0];

    // Notify relevant sockets that the application was updated (so front-end can refresh)
    try {
      io.to('role:admin').to('role:manager').emit('application-updated', updated);
    } catch (emitErr) {
      console.warn('Failed to emit application-updated event:', emitErr);
    }

    res.json({ success: true, message: 'Receipt uploaded', application: updated });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to upload receipt', error: error.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      message: 'Backend server is running',
      database: 'Connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Test endpoint to check if table exists
app.get('/test-table', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'membership_applications'
    `);
    
    if (result.rows.length > 0) {
      res.json({ 
        status: 'OK', 
        message: 'membership_applications table exists',
        table: result.rows[0]
      });
    } else {
      res.json({ 
        status: 'NOT_FOUND', 
        message: 'membership_applications table does not exist'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Error checking table',
      error: error.message
    });
  }
});

// Emit a connecting message for connected clients
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // Allow clients to join role-based rooms. Payload example: { role: 'admin' }
  socket.on('join', (payload) => {
    try {
      const role = payload && (payload.role || payload.user_role);
      if (role) {
        const room = `role:${role}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      }
    } catch (err) {
      console.warn('Error handling join payload:', err);
    }
  });

  socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));

  // Relay account-created events to IT admin room when a client notifies the server
  socket.on('account-created', (payload) => {
    try {
      console.log('Received account-created from client, broadcasting to role:it_admin', payload && (payload.member_name || payload.user_email || payload.member_number));
      io.to('role:it_admin').emit('account-created', payload);
    } catch (err) {
      console.warn('Failed to broadcast account-created event:', err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});