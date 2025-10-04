# Razorpay Payment Integration Setup Guide

## Overview
This guide will help you set up Razorpay payment integration for your food delivery website.

## Prerequisites
1. Razorpay account (https://razorpay.com)
2. Node.js and npm installed
3. MongoDB database running

## Backend Setup

### 1. Install Dependencies
```bash
cd server
npm install razorpay
```

### 2. Environment Variables
Create a `.env` file in your `server` directory with the following variables:

```env
# MongoDB Connection
MONGO_URI=mongodb://127.0.0.1:27017/food_delivery

# Server Configuration
PORT=4000

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# For Production, use live keys:
# RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
# RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET

# JWT Secret (if you have authentication)
JWT_SECRET=your_jwt_secret_here
```

### 3. Get Razorpay Keys
1. Log in to your Razorpay Dashboard
2. Go to Settings → API Keys
3. Generate a new key pair
4. Copy the Key ID and Key Secret to your `.env` file

### 4. Test Mode vs Live Mode
- **Test Mode**: Use `rzp_test_` keys for development and testing
- **Live Mode**: Use `rzp_live_` keys for production

## Frontend Setup

### 1. Install Dependencies
```bash
cd food-delivery
npm install razorpay
```

### 2. Environment Variables
Create a `.env` file in your `food-delivery` directory:

```env
REACT_APP_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
```

## API Endpoints

### Backend Payment Routes
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify-payment` - Verify payment signature
- `GET /api/payments/user/:userId` - Get user payment history
- `GET /api/payments/payment/:paymentId` - Get payment details
- `POST /api/payments/refund` - Process refund

### Frontend Components
- `RazorpayPayment` - Payment modal component
- `Checkout` - Checkout page with payment integration
- `PaymentHistory` - User payment history display

## Usage

### 1. Basic Payment Flow
```jsx
import RazorpayPayment from './components/RazorpayPayment';

// In your component
const handlePayment = () => {
  setShowPayment(true);
};

{showPayment && (
  <RazorpayPayment
    amount={totalAmount}
    orderId={orderId}
    onSuccess={handlePaymentSuccess}
    onFailure={handlePaymentFailure}
    onClose={() => setShowPayment(false)}
  />
)}
```

### 2. Checkout Integration
```jsx
import Checkout from './components/Checkout';

// In your cart or order page
<Checkout
  cart={cartItems}
  onClearCart={handleClearCart}
  user={currentUser}
/>
```

### 3. Payment History
```jsx
import PaymentHistory from './components/PaymentHistory';

// In user dashboard
<PaymentHistory userId={currentUser.id} />
```

## Testing

### 1. Test Cards
Use these test card numbers for testing:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **3D Secure**: 4000 0000 0000 0002

### 2. Test UPI
- Use any valid UPI ID format: `test@razorpay`

### 3. Test Net Banking
- Select any bank from the list

## Security Features

### 1. Payment Verification
- All payments are verified using Razorpay's signature verification
- Payment details are stored securely in your database
- Refund processing with proper validation

### 2. Error Handling
- Comprehensive error handling for all payment scenarios
- User-friendly error messages
- Logging for debugging and monitoring

## Production Considerations

### 1. SSL Certificate
- Ensure your website uses HTTPS in production
- Razorpay requires secure connections

### 2. Webhook Integration
- Set up webhooks for payment status updates
- Handle payment failures and refunds automatically

### 3. Monitoring
- Monitor payment success/failure rates
- Set up alerts for failed payments
- Track refund patterns

## Troubleshooting

### Common Issues

1. **Payment Modal Not Opening**
   - Check if Razorpay script is loaded
   - Verify API key configuration
   - Check browser console for errors

2. **Payment Verification Fails**
   - Ensure backend environment variables are set
   - Check if payment routes are properly configured
   - Verify database connection

3. **Test Payments Not Working**
   - Use correct test card numbers
   - Ensure you're using test mode keys
   - Check Razorpay dashboard for test mode

### Support
- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- GitHub Issues: Create an issue in your repository

## File Structure
```
food-delivery/
├── src/
│   ├── components/
│   │   ├── RazorpayPayment/
│   │   │   ├── RazorpayPayment.jsx
│   │   │   ├── RazorpayPayment.css
│   │   │   └── index.js
│   │   ├── Checkout/
│   │   │   ├── Checkout.jsx
│   │   │   ├── Checkout.css
│   │   │   └── index.js
│   │   └── PaymentHistory/
│   │       ├── PaymentHistory.jsx
│   │       ├── PaymentHistory.css
│   │       └── index.js
│   └── utils/
│       └── paymentUtils.js

server/
├── src/
│   ├── models/
│   │   └── Payment.js
│   └── routes/
│       └── payments.js
└── .env
```

## Next Steps
1. Test the integration with test cards
2. Customize the UI components as needed
3. Add additional payment methods if required
4. Implement webhook handling for production
5. Set up monitoring and analytics
