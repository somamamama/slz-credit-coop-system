#!/usr/bin/env node
/**
 * Simple helper to set outstanding_balance on a loan_application for local testing.
 * Usage:
 *   node tools/set_loan_balance.js --application_id 9 --amount 5000
 * Amount is in PHP (decimal allowed). Example: 1234.56
 */

const pool = require('../server/db_members');

function usageAndExit() {
  console.log('Usage: node tools/set_loan_balance.js --application_id <id> --amount <php_amount>');
  process.exit(1);
}

const argv = process.argv.slice(2);
let applicationId = null;
let amount = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--application_id' && argv[i+1]) { applicationId = argv[i+1]; i++; }
  else if (argv[i] === '--amount' && argv[i+1]) { amount = Number(argv[i+1]); i++; }
}

if (!applicationId || amount === null || Number.isNaN(amount)) usageAndExit();

// set_loan_balance.js removed per user request
// This helper previously allowed setting loan outstanding balances for webhook testing.
    const res = await pool.query('UPDATE loan_applications SET outstanding_balance = $1, updated_at = NOW() WHERE application_id = $2 RETURNING application_id, outstanding_balance', [amount, applicationId]);
