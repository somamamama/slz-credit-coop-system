const express = require('express');
const router = express.Router();
const pool = require('../db');
const authorize = require('../middleware/authorization');

// Create invoices table if not exists (lightweight guard)
async function ensureSchema() {
    try {
        // Check if table exists and get column info
        const tableCheck = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'invoices' AND column_name = 'cashier_id'
        `);
        
        if (tableCheck.rows.length === 0) {
            // Table doesn't exist, create with correct schema
            await pool.query(`
                CREATE TABLE IF NOT EXISTS invoices (
                    id SERIAL PRIMARY KEY,
                    member_id INTEGER,
                    member_name TEXT NOT NULL,
                    member_number TEXT,
                    cashier_id UUID,
                    cashier_name TEXT,
                    items JSONB NOT NULL,
                    subtotal NUMERIC(12,2) NOT NULL,
                    tax NUMERIC(12,2) DEFAULT 0,
                    discount NUMERIC(12,2) DEFAULT 0,
                    total NUMERIC(12,2) NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } else if (tableCheck.rows[0].data_type === 'integer') {
            // Table exists but cashier_id is INTEGER, need to fix it
            console.log('Detected INTEGER cashier_id, attempting to migrate to UUID...');
            
            // Create new table with correct schema
            await pool.query(`
                CREATE TABLE IF NOT EXISTS invoices_migrated (
                    id SERIAL PRIMARY KEY,
                    member_id INTEGER,
                    member_name TEXT NOT NULL,
                    member_number TEXT,
                    cashier_id UUID,
                    cashier_name TEXT,
                    items JSONB NOT NULL,
                    subtotal NUMERIC(12,2) NOT NULL,
                    tax NUMERIC(12,2) DEFAULT 0,
                    discount NUMERIC(12,2) DEFAULT 0,
                    total NUMERIC(12,2) NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            
            // Copy existing data (excluding cashier_id since it's incompatible)
            await pool.query(`
                INSERT INTO invoices_migrated (
                    member_id, member_name, member_number, cashier_name,
                    items, subtotal, tax, discount, total, notes, created_at
                )
                SELECT 
                    member_id, member_name, member_number, cashier_name,
                    items, subtotal, tax, discount, total, notes, created_at
                FROM invoices
            `);
            
            // Drop old table and rename new one
            await pool.query('DROP TABLE invoices');
            await pool.query('ALTER TABLE invoices_migrated RENAME TO invoices');
            
            console.log('Successfully migrated invoices table schema');
        }
    } catch (e) {
        console.error('Error ensuring invoices schema', e);
        // Fallback: create table if it doesn't exist
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS invoices (
                    id SERIAL PRIMARY KEY,
                    member_id INTEGER,
                    member_name TEXT NOT NULL,
                    member_number TEXT,
                    cashier_id UUID,
                    cashier_name TEXT,
                    items JSONB NOT NULL,
                    subtotal NUMERIC(12,2) NOT NULL,
                    tax NUMERIC(12,2) DEFAULT 0,
                    discount NUMERIC(12,2) DEFAULT 0,
                    total NUMERIC(12,2) NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (fallbackError) {
            console.error('Fallback schema creation failed:', fallbackError);
        }
    }
}

ensureSchema();

// Create invoice
router.post('/', authorize, async (req, res) => {
    try {
        const {
            member_id,
            member_name,
            member_number,
            items, // [{ description, quantity, unit_price }]
            subtotal,
            tax = 0,
            discount = 0,
            total,
            notes
        } = req.body;

        if (!member_name || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'member_name and at least one item are required' });
        }

        const cashier_id = req.user?.id || null;
        const cashier_name = req.user?.name || null;

        const result = await pool.query(
            `INSERT INTO invoices (
                member_id, member_name, member_number, cashier_id, cashier_name,
                items, subtotal, tax, discount, total, notes
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [
                member_id || null,
                member_name,
                member_number || null,
                cashier_id,
                cashier_name,
                JSON.stringify(items),
                subtotal,
                tax,
                discount,
                total,
                notes || null
            ]
        );

        return res.json({ success: true, invoice: result.rows[0] });
    } catch (err) {
        console.error('Error creating invoice:', err);
        return res.status(500).json({ success: false, message: 'Failed to create invoice' });
    }
});

// Get invoice by id
router.get('/:id', authorize, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }
        return res.json({ success: true, invoice: result.rows[0] });
    } catch (err) {
        console.error('Error fetching invoice:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
    }
});

// List invoices (optional member filter)
router.get('/', authorize, async (req, res) => {
    try {
        const { member_id } = req.query;
        let query = 'SELECT * FROM invoices';
        const params = [];
        if (member_id) {
            query += ' WHERE member_id = $1';
            params.push(member_id);
        }
        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        return res.json({ success: true, invoices: result.rows });
    } catch (err) {
        console.error('Error listing invoices:', err);
        return res.status(500).json({ success: false, message: 'Failed to list invoices' });
    }
});

module.exports = router;


