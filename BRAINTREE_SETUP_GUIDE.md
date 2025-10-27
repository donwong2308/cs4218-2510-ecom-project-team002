# Braintree Payment Gateway Setup Guide

## For Team Members: How to Set Up Braintree for Testing

### Option 1: Use Shared Sandbox Account (Recommended for Team Testing)

**Contact the project owner (Don Wong)** to get the shared Braintree sandbox credentials:
- Merchant ID
- Public Key  
- Private Key

Add these to your `.env` file:
```env
BRAINTREE_MERCHANT_ID=<provided_by_team_lead>
BRAINTREE_PUBLIC_KEY=<provided_by_team_lead>
BRAINTREE_PRIVATE_KEY=<provided_by_team_lead>
```

### Option 2: Create Your Own Sandbox Account (Individual Testing)

If you need your own sandbox for testing:

#### Step 1: Sign Up for Braintree Sandbox
1. Go to: **https://www.braintreepayments.com/sandbox**
2. Click **"Sign Up"** (free for testing)
3. Fill in registration form
4. Verify your email

#### Step 2: Get Your API Credentials
1. Log in to Braintree Sandbox Dashboard
2. Click **gear icon (⚙️)** → **"API"**
3. Copy your credentials:
   - Merchant ID
   - Public Key
   - Private Key

#### Step 3: Add to Your .env File
```env
BRAINTREE_MERCHANT_ID=your_merchant_id
BRAINTREE_PUBLIC_KEY=your_public_key
BRAINTREE_PRIVATE_KEY=your_private_key
```

### Testing Payment Functionality

Once configured, you can test payments using Braintree's test credit card numbers:

#### Valid Test Cards (Sandbox)
- **Visa:** `4111 1111 1111 1111`
- **Mastercard:** `5555 5555 5555 4444`
- **American Express:** `3782 822463 10005`
- **Discover:** `6011 1111 1111 1117`

**CVV:** Any 3 digits (e.g., `123`)  
**Expiration:** Any future date (e.g., `12/2025`)  
**Postal Code:** Any 5 digits (e.g., `12345`)

#### Test Declined Cards
- **Card Declined:** `4000 0000 0000 0002`
- **Insufficient Funds:** `4000 0000 0000 9995`

### Verification

Test your setup:

```bash
# Start the server
npm start

# Test the payment endpoint (using Postman or curl)
curl -X POST http://localhost:6060/api/v1/product/braintree/token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# You should get a client token back
```

### Troubleshooting

**Error: "Authentication failed"**
- Double-check your credentials are copied correctly
- Ensure no extra spaces in `.env` file
- Verify you're using SANDBOX credentials, not production

**Error: "Merchant account not found"**
- Verify your Merchant ID is correct
- Ensure your Braintree account is fully activated

**Need Help?**
- Braintree Sandbox Dashboard: https://sandbox.braintreegateway.com/
- Braintree Test Cards: https://developers.braintreepayments.com/reference/general/testing/node
- Documentation: https://developers.braintreepayments.com/start/overview

### Important Notes

⚠️ **Security Reminders:**
- Never commit `.env` file to git
- These are SANDBOX credentials for testing only
- Production credentials should be kept secret and rotated regularly
- Use environment variables in production (never hardcode)

✅ **What You Can Test:**
- Payment processing flow
- Card validation
- Declined transactions
- Refunds
- Multiple payment methods
- Error handling

---

**Last Updated:** October 27, 2025  
**Maintained By:** CS4218 Team 002
