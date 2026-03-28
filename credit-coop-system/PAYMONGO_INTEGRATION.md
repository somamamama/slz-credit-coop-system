# PayMongo Payment Integration

This document describes the PayMongo payment integration for the Credit Cooperative System.

## Overview

The payment system has been rewritten to use PayMongo's secure payment processing instead of manual QR code payments. This provides:

- ✅ Secure payment processing
- ✅ Multiple payment methods (GCash, GrabPay, Maya, Credit/Debit Cards)
- ✅ Automatic payment confirmation
- ✅ Real-time payment status updates
- ✅ Professional checkout experience

## API Key Configuration

**Test API Keys (Currently Configured):**
```
Public Key: pk_test_Ff7ikQQHTa3HjoAnuBZPDo4t
Secret Key: sk_test_*************** (redacted - do NOT commit live secrets)
```

⚠️ **Important:** These are test keys for development. For production, you'll need to:

1. Create a PayMongo account at https://paymongo.com
2. Get your live API keys from the dashboard
3. Replace the test keys with your live keys

**Note:** The frontend uses the secret key for creating payment intents and checkout sessions. In a production environment, these API calls should be moved to your backend server for security.

## Features

### 1. Payment Form
- **Location:** `/payment`
- **Features:**
  - Amount input with validation
  - Payment method selection (GCash, GrabPay, Maya, Cards)
  - Optional description field
  - Real-time form validation
  - Secure payment processing

### 2. Payment Success Page
- **Location:** `/payment-success`
- **Features:**
  - Payment confirmation display
  - Transaction details
  - Receipt information
  - Navigation back to dashboard

### 3. Webhook Integration
- **Endpoint:** `/api/paymongo/webhook`
- **Purpose:** Receives real-time payment status updates
- **Database:** Stores payment records in `paymongo_payments` table

## Payment Flow

1. **User initiates payment:**
   - Enters amount and selects payment method
   - Clicks "Pay" button

2. **PayMongo integration:**
   - Creates Payment Intent via PayMongo API
   - Creates Checkout Session
   - Redirects to PayMongo's secure checkout

3. **Payment processing:**
   - User completes payment on PayMongo's platform
   - PayMongo processes the payment
   - User is redirected back to success page

4. **Confirmation:**
   - Webhook receives payment status
   - Database is updated
   - User sees confirmation

## Database Schema

### paymongo_payments Table
```sql
CREATE TABLE paymongo_payments (
  id SERIAL PRIMARY KEY,
  payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PHP',
  status VARCHAR(50) NOT NULL,
  description TEXT,
  payment_method VARCHAR(50),
  user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Installation Steps

1. **Install dependencies** (when Node.js is available):
   ```bash
   cd member-portal
   npm install
   ```

2. **Start the application:**
   ```bash
   # Frontend
   npm start

   # Backend (in separate terminal)
   cd server
   npm start
   ```

3. **Test the payment flow:**
   - Navigate to `/payment`
   - Enter a test amount (e.g., 100.00)
   - Select a payment method
   - Click "Pay" and follow the PayMongo checkout flow

## Payment Methods Supported

| Method | Code | Description |
|--------|------|-------------|
| GCash | `gcash` | Popular mobile wallet in Philippines |
| GrabPay | `grab_pay` | Grab's mobile payment service |
| Maya | `paymaya` | Maya digital wallet |
| Cards | `card` | Visa, Mastercard, JCB credit/debit cards |

## Security Features

- 🔒 **SSL/TLS Encryption:** All API calls are encrypted
- 🛡️ **PCI Compliance:** PayMongo handles sensitive card data
- ✅ **Webhook Verification:** Payment status verified through webhooks
- 🔐 **Token Authentication:** User authentication required for payments

## Testing

### Test Card Numbers (PayMongo Sandbox)

**Successful Payment:**
```
Card: 4343434343434345
Expiry: 12/25
CVC: 123
```

**Failed Payment:**
```
Card: 4000000000000002
Expiry: 12/25
CVC: 123
```

### Test Flow

1. Use test API key (already configured)
2. Create payment with test amount
3. Use test card numbers for card payments
4. Verify payment success/failure scenarios

## Production Deployment

1. **Get Live API Keys:**
   - Sign up at https://paymongo.com
   - Complete business verification
   - Get live public and secret keys

2. **Update Configuration:**
   ```javascript
   // Replace in Payment.js and PaymentSuccess.js
   const PAYMONGO_SECRET_KEY = "sk_live_YOUR_LIVE_SECRET_KEY";
   ```

   ⚠️ **Security Note:** In production, move the secret key to your backend server. Never expose secret keys in frontend code.

3. **Configure Webhooks:**
   - Set webhook URL: `https://yourdomain.com/api/paymongo/webhook`
   - Subscribe to: `payment_intent.succeeded`, `payment_intent.payment_failed`

4. **Environment Variables:**
   ```bash
   # Add to server/.env
   PAYMONGO_SECRET_KEY=sk_live_YOUR_SECRET_KEY
   PAYMONGO_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
   ```

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure your domain is whitelisted in PayMongo dashboard
   - Check CORS configuration in backend

2. **Webhook Not Receiving:**
   - Verify webhook URL is publicly accessible
   - Check webhook secret configuration
   - Ensure HTTPS in production

3. **Payment Fails:**
   - Check API key validity
   - Verify payment method is enabled
   - Check amount limits

### Support

- **PayMongo Documentation:** https://developers.paymongo.com/
- **PayMongo Support:** support@paymongo.com
- **Test Dashboard:** https://dashboard.paymongo.com/test/

## Migration Notes

### Changed Files
- `src/pages/Payment.js` - Complete rewrite for PayMongo
- `src/pages/Payment.css` - Updated styles for new form
- `src/pages/PaymentSuccess.js` - New success page
- `src/App.js` - Added success route
- `server/index.js` - Added webhook endpoints

### Removed Features
- QR code scanning
- Manual reference photo upload
- File upload functionality

### Added Features
- Multiple payment methods
- Automatic payment confirmation
- Real-time payment tracking
- Professional checkout flow

The new PayMongo integration provides a more professional, secure, and user-friendly payment experience for the Credit Cooperative System.
