const router = require('express').Router();
const authorization = require('../middleware/authorization');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../db_members');

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Helper function to validate membership application row
const validateApplicationRow = (row) => {
    const errors = [];
    // require minimal fields
    if (!row.first_name && !row['first name']) errors.push('first_name is required');
    if (!row.last_name && !row['last name']) errors.push('last_name is required');
    if (!row.email_address && !row.email) errors.push('email_address (or email) is required');

    // basic email format check
    const email = row.email_address || row.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) errors.push('Invalid email format');

    return errors;
};

// Import members route
router.post('/import-members', authorization, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Check file type
        if (!req.file.originalname.match(/\.(xlsx|xls)$/)) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        // Read Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const stats = {
            total: jsonData.length,
            successful: 0,
            failed: 0,
            errors: []
        };

        // Process each row as a membership application
        for (const row of jsonData) {
            try {
                // Basic validation
                const validationErrors = validateApplicationRow(row);
                if (validationErrors.length > 0) {
                    stats.failed++;
                    stats.errors.push({ row, errors: validationErrors });
                    continue;
                }

                // helper to get value with common aliases
                const get = (keys) => {
                    if (!Array.isArray(keys)) keys = [keys];
                    for (const k of keys) {
                        if (k in row) return row[k];
                        const lower = k.toLowerCase();
                        if (row[lower] !== undefined) return row[lower];
                        // also try keys with spaces
                        const spaced = k.replace('_', ' ');
                        if (row[spaced] !== undefined) return row[spaced];
                    }
                    return null;
                };

                // map expected columns (fall back to null if missing)
                const data = {
                    number_of_shares: get('number_of_shares'),
                    amount_subscribe: get(['amount_subscribe', 'amount']),
                    application_date: get('application_date'),
                    membership_type: get('membership_type'),
                    applicants_membership_number: get(['applicants_membership_number', 'member_number']),
                    last_name: get('last_name'),
                    first_name: get('first_name'),
                    middle_name: get('middle_name'),
                    suffix: get('suffix'),
                    address: get('address'),
                    contact_number: get(['contact_number','phone','contact']),
                    type_of_address: get('type_of_address'),
                    occupied_since: get('occupied_since'),
                    email_address: get(['email_address','email']),
                    date_of_birth: get('date_of_birth'),
                    place_of_birth: get('place_of_birth'),
                    religion: get('religion'),
                    age: get('age'),
                    gender: get('gender'),
                    civil_status: get('civil_status'),
                    highest_educational_attainment: get('highest_educational_attainment'),
                    spouse_full_name: get('spouse_full_name'),
                    fathers_full_name: get('fathers_full_name'),
                    mothers_maiden_name: get('mothers_maiden_name'),
                    number_of_dependents: get('number_of_dependents'),
                    occupation: get('occupation'),
                    annual_income: get('annual_income'),
                    tax_identification_number: get('tax_identification_number'),
                    identification_type: get('identification_type'),
                    identification_number: get('identification_number'),
                    employment_choice: get('employment_choice'),
                    business_type: get('business_type'),
                    business_address: get('business_address'),
                    employer_trade_name: get('employer_trade_name'),
                    employer_tin_number: get('employer_tin_number'),
                    employer_phone_number: get('employer_phone_number'),
                    date_hired_from: get('date_hired_from'),
                    date_hired_to: get('date_hired_to'),
                    employment_occupation: get('employment_occupation'),
                    employment_occupation_status: get('employment_occupation_status'),
                    annual_monthly_indicator: get('annual_monthly_indicator'),
                    employment_industry: get('employment_industry'),
                    facebook_account: get('facebook_account'),
                    reference_person: get('reference_person'),
                    reference_address: get('reference_address'),
                    reference_contact_number: get('reference_contact_number'),
                    profile_image_path: get('profile_image_path'),
                    status: get('status') || 'pending',
                    review_notes: get('review_notes'),
                    reviewed_at: get('reviewed_at')
                };

                // Normalize Excel date serials and strings to ISO date (YYYY-MM-DD) or ISO timestamp for reviewed_at
                const normalizeDate = (val, allowTime = false) => {
                    if (val === null || val === undefined || val === '') return null;
                    // If it's already a JS Date
                    if (val instanceof Date && !isNaN(val)) {
                        const iso = val.toISOString();
                        return allowTime ? iso : iso.split('T')[0];
                    }
                    // If it's a number, treat as Excel serial
                    if (typeof val === 'number') {
                        try {
                            const parsed = XLSX.SSF.parse_date_code(val);
                            if (!parsed) return null;
                            const { y, m, d, H, M, S } = parsed;
                            const hours = H || 0;
                            const minutes = M || 0;
                            const seconds = S || 0;
                            const dt = new Date(Date.UTC(y, m - 1, d, hours, minutes, seconds));
                            const iso = dt.toISOString();
                            return allowTime ? iso : iso.split('T')[0];
                        } catch (e) {
                            // fallback: convert using Excel epoch
                            const epoch = new Date(Date.UTC(1899, 11, 30));
                            const ms = Math.round(val * 24 * 60 * 60 * 1000);
                            const dt = new Date(epoch.getTime() + ms);
                            const iso = dt.toISOString();
                            return allowTime ? iso : iso.split('T')[0];
                        }
                    }
                    // If it's a string, try parsing
                    if (typeof val === 'string') {
                        const parsed = Date.parse(val);
                        if (!isNaN(parsed)) {
                            const dt = new Date(parsed);
                            const iso = dt.toISOString();
                            return allowTime ? iso : iso.split('T')[0];
                        }
                        // If string contains Excel-like number
                        const num = Number(val);
                        if (!isNaN(num)) return normalizeDate(num, allowTime);
                    }
                    return null;
                };

                // apply normalization
                data.application_date = normalizeDate(data.application_date, false);
                data.occupied_since = normalizeDate(data.occupied_since, false);
                data.date_of_birth = normalizeDate(data.date_of_birth, false);
                data.date_hired_from = normalizeDate(data.date_hired_from, false);
                data.date_hired_to = normalizeDate(data.date_hired_to, false);
                data.reviewed_at = normalizeDate(data.reviewed_at, true);

                // Skip if an application with same email or membership number already exists
                const dupCheck = await pool.query(
                    `SELECT application_id FROM membership_applications WHERE email_address = $1 OR applicants_membership_number = $2`,
                    [data.email_address, data.applicants_membership_number]
                );
                if (dupCheck.rows.length > 0) {
                    stats.failed++;
                    stats.errors.push({ row, errors: ['Application with this email or membership number already exists'] });
                    continue;
                }

                // Insert row
                await pool.query(
                    `INSERT INTO membership_applications (
                        number_of_shares, amount_subscribe, application_date, membership_type, applicants_membership_number,
                        last_name, first_name, middle_name, suffix, address, contact_number, type_of_address, occupied_since,
                        email_address, date_of_birth, place_of_birth, religion, age, gender, civil_status, highest_educational_attainment,
                        spouse_full_name, fathers_full_name, mothers_maiden_name, number_of_dependents, occupation, annual_income,
                        tax_identification_number, identification_type, identification_number, employment_choice, business_type,
                        business_address, employer_trade_name, employer_tin_number, employer_phone_number, date_hired_from, date_hired_to,
                        employment_occupation, employment_occupation_status, annual_monthly_indicator, employment_industry, facebook_account,
                        reference_person, reference_address, reference_contact_number, profile_image_path, status, review_notes, reviewed_at
                    ) VALUES (
                        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50
                    )`,
                    [
                        data.number_of_shares || null,
                        data.amount_subscribe ? Number(data.amount_subscribe) : null,
                        data.application_date || null,
                        data.membership_type || null,
                        data.applicants_membership_number || null,
                        data.last_name || null,
                        data.first_name || null,
                        data.middle_name || null,
                        data.suffix || null,
                        data.address || null,
                        data.contact_number || null,
                        data.type_of_address || null,
                        data.occupied_since || null,
                        data.email_address || null,
                        data.date_of_birth || null,
                        data.place_of_birth || null,
                        data.religion || null,
                        data.age ? Number(data.age) : null,
                        data.gender || null,
                        data.civil_status || null,
                        data.highest_educational_attainment || null,
                        data.spouse_full_name || null,
                        data.fathers_full_name || null,
                        data.mothers_maiden_name || null,
                        data.number_of_dependents ? Number(data.number_of_dependents) : null,
                        data.occupation || null,
                        data.annual_income ? Number(data.annual_income) : null,
                        data.tax_identification_number || null,
                        data.identification_type || null,
                        data.identification_number || null,
                        data.employment_choice || null,
                        data.business_type || null,
                        data.business_address || null,
                        data.employer_trade_name || null,
                        data.employer_tin_number || null,
                        data.employer_phone_number || null,
                        data.date_hired_from || null,
                        data.date_hired_to || null,
                        data.employment_occupation || null,
                        data.employment_occupation_status || null,
                        data.annual_monthly_indicator || null,
                        data.employment_industry || null,
                        data.facebook_account || null,
                        data.reference_person || null,
                        data.reference_address || null,
                        data.reference_contact_number || null,
                        data.profile_image_path || null,
                        data.status || 'pending',
                        data.review_notes || null,
                        data.reviewed_at || null
                    ]
                );

                stats.successful++;
            } catch (err) {
                console.error('Error processing row:', err);
                stats.failed++;
                stats.errors.push({ row, errors: [err.message] });
            }
        }

        res.json({
            message: 'Import completed',
            total: stats.total,
            successful: stats.successful,
            failed: stats.failed,
            errors: stats.errors
        });

    } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({
            message: 'Error processing import',
            error: err.message
        });
    }
});

module.exports = router;
