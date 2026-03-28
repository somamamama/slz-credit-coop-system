/**
 * Updated Node.js Loan Application Handler
 * Handles comprehensive loan application form submission to loan_applications table
 */

const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Database connection configuration
const dbConfig = {
    host: 'localhost',
    user: 'postgres',
    password: 'password',
    database: 'slz_coop_staff',
    port: 5432
};

// Configure multer for file uploads (Gov ID and Company ID)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'uploads', 'loan_documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with field name prefix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Check if file is an image
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

/**
 * Handle comprehensive loan application submission
 */
async function handleLoanApplicationSubmission(req, res) {
    // Use multer to handle file uploads (gov_id_file and company_id_file)
    upload.fields([
        { name: 'gov_id_file', maxCount: 1 },
        { name: 'company_id_file', maxCount: 1 }
    ])(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        const connection = await mysql.createConnection(dbConfig);
        
        try {
            // Extract form data
            const {
                user_id,
                dateFiled,
                loanType,
                membershipType,
                lastName,
                firstName,
                middleName,
                gender,
                civilStatus,
                birthDate,
                landline,
                mobileNumber,
                emailAddress,
                currentAddress,
                yearsOfStayCurrent,
                permanentAddress,
                yearsOfStayPermanent,
                homeOwnership,
                spouseName,
                numberOfChildren,
                dateHired,
                companyBusiness,
                contractPeriod,
                designationPosition,
                yearsInCompany
            } = req.body;

            // Validate required fields
            if (!user_id || !dateFiled || !loanType || !membershipType || 
                !lastName || !firstName || !gender || !civilStatus || 
                !birthDate || !mobileNumber || !emailAddress || 
                !currentAddress || !yearsOfStayCurrent || 
                !permanentAddress || !yearsOfStayPermanent || !homeOwnership) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            // Validate file uploads
            if (!req.files?.gov_id_file || !req.files?.company_id_file) {
                return res.status(400).json({
                    success: false,
                    message: 'Both Government ID and Company ID files are required'
                });
            }

            // Get file paths
            const govIdFilePath = req.files.gov_id_file[0].path;
            const companyIdFilePath = req.files.company_id_file[0].path;

            // Get member number from members table
            const [memberRows] = await connection.execute(
                'SELECT member_number FROM members WHERE user_id = ?',
                [user_id]
            );

            const memberNumber = memberRows.length > 0 ? memberRows[0].member_number : null;

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
                    status, submitted_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            `;

            const values = [
                user_id, memberNumber, dateFiled, loanType, membershipType,
                lastName, firstName, middleName || null, gender, civilStatus, birthDate,
                landline || null, mobileNumber, emailAddress,
                currentAddress, parseFloat(yearsOfStayCurrent), permanentAddress, parseFloat(yearsOfStayPermanent), homeOwnership,
                spouseName || null, parseInt(numberOfChildren) || 0,
                dateHired || null, companyBusiness || null, contractPeriod || null, designationPosition || null, parseFloat(yearsInCompany) || null,
                govIdFilePath, companyIdFilePath
            ];

            const [result] = await connection.execute(insertQuery, values);

            res.json({
                success: true,
                message: 'Loan application submitted successfully',
                application_id: result.insertId,
                member_number: memberNumber
            });

        } catch (error) {
            console.error('Database error:', error);
            
            // Clean up uploaded files on error
            if (req.files?.gov_id_file) {
                fs.unlinkSync(req.files.gov_id_file[0].path);
            }
            if (req.files?.company_id_file) {
                fs.unlinkSync(req.files.company_id_file[0].path);
            }

            res.status(500).json({
                success: false,
                message: 'Failed to submit loan application: ' + error.message
            });
        } finally {
            await connection.end();
        }
    });
}

/**
 * Get loan applications for a user
 */
async function handleGetLoanApplications(req, res) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { user_id } = req.query;
        
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
                submitted_at,
                reviewed_at,
                gov_id_file_path,
                company_id_file_path
            FROM loan_applications
        `;
        
        let values = [];
        
        if (user_id) {
            query += ' WHERE user_id = ?';
            values.push(user_id);
        }
        
        query += ' ORDER BY submitted_at DESC';
        
        const [rows] = await connection.execute(query, values);
        
        res.json({
            success: true,
            applications: rows
        });
        
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loan applications: ' + error.message
        });
    } finally {
        await connection.end();
    }
}

/**
 * Get a specific loan application by ID
 */
async function handleGetLoanApplicationById(req, res) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { application_id } = req.params;
        
        const query = `
            SELECT * FROM loan_applications 
            WHERE application_id = ?
        `;
        
        const [rows] = await connection.execute(query, [application_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }
        
        res.json({
            success: true,
            application: rows[0]
        });
        
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch loan application: ' + error.message
        });
    } finally {
        await connection.end();
    }
}

/**
 * Update loan application status (for staff)
 */
async function handleUpdateApplicationStatus(req, res) {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const { application_id, status, reviewer_comments, reviewed_by } = req.body;
        
        if (!application_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Application ID and status are required'
            });
        }
        
        const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        
        const updateQuery = `
            UPDATE loan_applications 
            SET status = ?, reviewer_comments = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
            WHERE application_id = ?
        `;
        
        const [result] = await connection.execute(updateQuery, [
            status, 
            reviewer_comments || null, 
            reviewed_by || null, 
            application_id
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Loan application not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Application status updated successfully'
        });
        
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status: ' + error.message
        });
    } finally {
        await connection.end();
    }
}

/**
 * Setup Express.js routes for loan applications
 */
function setupLoanApplicationRoutes(app) {
    // Submit new loan application
    app.post('/api/loan-application/submit', handleLoanApplicationSubmission);
    
    // Get loan applications (with optional user_id filter)
    app.get('/api/loan-application/list', handleGetLoanApplications);
    
    // Get specific loan application by ID
    app.get('/api/loan-application/:application_id', handleGetLoanApplicationById);
    
    // Update application status (for staff)
    app.put('/api/loan-application/update-status', handleUpdateApplicationStatus);
    
    // Serve uploaded files (with proper authentication middleware)
    app.use('/uploads/loan_documents', express.static(path.join(__dirname, 'uploads', 'loan_documents')));
}

module.exports = {
    setupLoanApplicationRoutes,
    handleLoanApplicationSubmission,
    handleGetLoanApplications,
    handleGetLoanApplicationById,
    handleUpdateApplicationStatus
};