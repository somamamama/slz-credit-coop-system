# Webhook test tools

This folder contains small helper scripts used for local testing of the PayMongo webhook integration.

Files:

- `send_signed_webhook.js` - Sends a signed webhook POST to the local webhook endpoint. Usage:
  ```sh
  PAYMONGO_WEBHOOK_SECRET=whsec_test node tools/send_signed_webhook.js --type checkout_session --pi-id pi_test_001 --application_id 9 --member_number MBR001 --amount 500000
  ```
  - `--type` - `payment_intent` or `checkout_session` (checkout_session helps include success_url query params)
  - `--pi-id` - payment intent id used in the payload
  - `--application_id` / `--member_number` - included in success_url for the checkout_session
  - `--amount` - numeric amount (use cents if you want the webhook to behave like PayMongo amounts)

- `set_loan_balance.js` - Update `loan_applications.outstanding_balance` for local testing. Usage:
  ```sh
  node tools/set_loan_balance.js --application_id 9 --amount 5000
  ```
  Amount is in PHP (decimal allowed). Example `5000` sets balance to ₱5,000.00.

Quick Option A test flow (synthetic, recommended for dev):

1. Ensure the server is running from `member-portal/` and set the following env vars when launching the server:

```sh
PAYMONGO_SECRET_KEY=sk_test_dummy \
PAYMONGO_WEBHOOK_SECRET=whsec_test \
PAYMONGO_SKIP_PROVIDER_VERIFY=true \
node server/index.js
```

2. Ensure the loan application you want to test has a non-zero balance. Example:

```sh
node tools/set_loan_balance.js --application_id 9 --amount 5000
```

3. Send a signed `checkout_session` webhook that includes the `application_id`:

```sh
PAYMONGO_WEBHOOK_SECRET=whsec_test node tools/send_signed_webhook.js --type checkout_session --pi-id pi_test_local_001 --application_id 9 --member_number MBR001 --amount 500000
```

4. Verify DB: check `payments` and `loan_applications` tables to confirm a payment row was inserted and the outstanding balance updated.

Notes:
- `PAYMONGO_SKIP_PROVIDER_VERIFY=true` disables provider-side verification for local dev so the webhook will trust the payload attributes. Do NOT enable this in production.
- For production testing, use ngrok and the real PayMongo flow instead (Option B in the project docs).
