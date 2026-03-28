const express = require('express');
const router = express.Router();
const pool = require('../db');

// Create a payment reference record (called when member submits reference image)
router.post('/reference', async (req, res) => {
  try {
    const {
      member_id,           // optional: link to member/user id if available
      member_name,         // optional: helpful metadata
      image_path,          // required: path returned by member portal upload e.g., payment_references/filename.jpg
      amount,              // optional: payment amount
      reference_text       // optional: extracted/typed reference number text
    } = req.body;

    if (!image_path) {
      return res.status(400).json({ success: false, message: 'image_path is required' });
    }

    const result = await pool.query(
      `INSERT INTO payment_references (
         member_id,
         member_name,
         image_path,
         amount,
         reference_text,
         status
       ) VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [member_id || null, member_name || null, image_path, amount || null, reference_text || null]
    );

    return res.json({ success: true, payment: result.rows[0] });
  } catch (err) {
    console.error('Error creating payment reference:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment reference' });
  }
});

// List payment references (optional filters by status)
router.get('/reference', async (req, res) => {
  try {
    const { status } = req.query; // pending | confirmed | rejected
    let query = 'SELECT * FROM payment_references';
    const params = [];
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    return res.json({ success: true, payments: result.rows });
  } catch (err) {
    console.error('Error listing payment references:', err);
    return res.status(500).json({ success: false, message: 'Failed to list payment references' });
  }
});

// Cashier confirms a payment reference
router.post('/reference/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { cashier_id, cashier_name, notes } = req.body;

    const result = await pool.query(
      `UPDATE payment_references
       SET status = 'confirmed',
           confirmed_by = $1,
           confirmed_by_name = $2,
           confirmed_notes = $3,
           confirmed_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [cashier_id || null, cashier_name || null, notes || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reference not found or already processed' });
    }

    // TODO: Integrate real notification (e.g., push, email, websocket)
    // For now, return success so frontend can show confirmation.
    return res.json({ success: true, message: 'Payment confirmed', payment: result.rows[0] });
  } catch (err) {
    console.error('Error confirming payment reference:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm payment reference' });
  }
});

// Cashier rejects a payment reference (optional)
router.post('/reference/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { cashier_id, cashier_name, reason } = req.body;

    const result = await pool.query(
      `UPDATE payment_references
       SET status = 'rejected',
           confirmed_by = $1,
           confirmed_by_name = $2,
           confirmed_notes = $3,
           confirmed_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND status = 'pending'
       RETURNING *`,
      [cashier_id || null, cashier_name || null, reason || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reference not found or already processed' });
    }

    return res.json({ success: true, message: 'Payment rejected', payment: result.rows[0] });
  } catch (err) {
    console.error('Error rejecting payment reference:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject payment reference' });
  }
});

module.exports = router;


