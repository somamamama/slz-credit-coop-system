/**
 * Node.js integration for the Python Loan Application Service
 * This file shows how to integrate the Python service with the existing Node.js backend
 */

const { spawn } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'loan_applications');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Check if file is JPG/JPEG
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Only JPG/JPEG files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

/**
 * Call Python loan application service
 * @param {string} user_id - User ID
 * @param {string} file_path - Path to uploaded JPG file
 * @returns {Promise<Object>} Result from Python service
 */
function callPythonLoanService(user_id, file_path) {
    return new Promise((resolve, reject) => {
        const pythonScript = path.join(__dirname, 'loan_cli.py');
        const pythonProcess = spawn('python3', [pythonScript, '--submit', user_id, file_path]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error('Failed to parse Python service response'));
                }
            } else {
                reject(new Error(`Python service failed: ${error}`));
            }
        });
    });
}

/**
 * Express.js route handler for loan application submission
 */
function handleLoanApplicationSubmission(req, res) {
    // Use multer middleware
    upload.single('jpg_file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const { user_id } = req.body;
        
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }
        
        try {
            // Call Python service
            const result = await callPythonLoanService(user_id, req.file.path);
            
            // Clean up uploaded file if Python service fails
            if (!result.success) {
                fs.unlinkSync(req.file.path);
            }
            
            res.json(result);
            
        } catch (error) {
            // Clean up uploaded file on error
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            
            res.status(500).json({
                success: false,
                message: `Server error: ${error.message}`
            });
        }
    });
}

/**
 * Express.js route handler for getting loan applications
 */
async function handleGetLoanApplications(req, res) {
    try {
        const { user_id } = req.query;
        
        // Call Python service to get applications
        const pythonProcess = spawn('python3', [
            path.join(__dirname, 'loan_cli.py'),
            '--list',
            user_id || ''
        ]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to parse response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    message: `Python service failed: ${error}`
                });
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`
        });
    }
}

/**
 * Express.js route handler for updating application status
 */
async function handleUpdateApplicationStatus(req, res) {
    try {
        const { application_id, status } = req.body;
        
        if (!application_id || !status) {
            return res.status(400).json({
                success: false,
                message: 'Application ID and status are required'
            });
        }
        
        // Call Python service to update status
        const pythonProcess = spawn('python3', [
            path.join(__dirname, 'loan_cli.py'),
            '--update-status',
            application_id.toString(),
            status
        ]);
        
        let output = '';
        let error = '';
        
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json(result);
                } catch (parseError) {
                    res.status(500).json({
                        success: false,
                        message: 'Failed to parse response'
                    });
                }
            } else {
                res.status(500).json({
                    success: false,
                    message: `Python service failed: ${error}`
                });
            }
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Server error: ${error.message}`
        });
    }
}

// Example Express.js route setup
function setupLoanApplicationRoutes(app) {
    // Submit loan application
    app.post('/api/loan-application/submit', handleLoanApplicationSubmission);
    
    // Get loan applications
    app.get('/api/loan-application/list', handleGetLoanApplications);
    
    // Update application status
    app.put('/api/loan-application/update-status', handleUpdateApplicationStatus);
}

module.exports = {
    setupLoanApplicationRoutes,
    handleLoanApplicationSubmission,
    handleGetLoanApplications,
    handleUpdateApplicationStatus,
    upload
};
