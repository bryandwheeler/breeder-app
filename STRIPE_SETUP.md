# Stripe Billing & Subscription Setup Guide

This guide explains how to set up and configure the Stripe billing and subscription management system for your Breeder Management App.

## Overview

The system includes:

- **Customer Subscription Management** - Users can upgrade/downgrade their subscription tier
- **Payment Management** - Stripe handles payment processing and recurring billing
- **Admin Dashboard** - View all customers and their subscription status
- **Stripe Integration** - Firebase Cloud Functions handle Stripe webhook events and API calls

## Prerequisites

1. **Stripe Account** - Sign up at https://stripe.com
2. **Firebase Project** - Already configured
3. **Node.js** - For Cloud Functions

## Step 1: Stripe Dashboard Setup

### 1.1 Create Stripe Products & Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → **+ Add Product**
3. Create three products:

   **Free Plan**

   - Name: "Free Plan"
   - Type: Service
   - Price: $0/month (no charge, but still create a price for reference)

   **Builder Plan**

   - Name: "Builder Plan"
   - Type: Service
   - Price: $29/month (recurring)
   - Billing period: Monthly

   **Pro Plan**

   - Name: "Pro Plan"
   - Type: Service
   - Price: $79/month (recurring)
   - Billing period: Monthly

### 1.2 Get Your API Keys

1. Go to **Developers** → **API Keys**
2. Copy your:
   - **Publishable Key** (starts with `pk_`)
   - **Secret Key** (starts with `sk_`)
3. Keep these safe - **never commit them to GitHub**

### 1.3 Set Up Webhooks

1. Go to **Developers** → **Webhooks**
2. Click **+ Add Endpoint**
3. Endpoint URL: `https://your-firebase-project.cloudfunctions.net/handleStripeWebhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
5. Copy the **Signing Secret** (starts with `whsec_`)

## Step 2: Environment Configuration

### 2.1 Frontend Environment Variables

Add these to `.env` (local development) and Firebase Hosting environment variables (production):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_BUILDER=price_...
VITE_STRIPE_PRICE_PRO=price_...
```

To get Price IDs:

1. Go to **Products** in Stripe dashboard
2. Click on a product
3. Under **Pricing**, copy the **Price ID** (starts with `price_`)

### 2.2 Backend Environment Variables (Cloud Functions)

1. Create `functions/.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

2. Update `firebase.json` to include environment variables for Cloud Functions:

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-functions-debug.log"
      ]
    }
  ]
}
```

## Step 3: Install Dependencies

### 3.1 Frontend

```bash
npm install
```

**Note:** The Stripe JavaScript library is loaded from CDN at runtime, so no npm package installation is needed.

### 3.2 Cloud Functions

```bash
cd functions
npm install
cd ..
```

The `functions/package.json` includes:

- `firebase-admin`
- `firebase-functions`
- `stripe`

## Step 4: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This deploys the following endpoints:

- `createCheckoutSession` - Creates a Stripe Checkout session
- `createPortalSession` - Creates a Customer Portal session
- `createStripeCustomer` - Creates a Stripe customer when a user signs up
- `handleStripeWebhook` - Handles Stripe webhook events

## Step 5: Frontend Integration

### 5.1 Account Management Page

Users can now:

1. View their current subscription tier
2. See available plans with pricing
3. Click **Upgrade to [Plan Name]** to be redirected to Stripe Checkout
4. Click **Manage Billing** to access the Stripe Customer Portal

### 5.2 Stripe Checkout Flow

When a user upgrades:

1. The `redirectToCheckout()` function is called
2. Stripe Checkout opens in a new window
3. User enters payment information
4. On success, user is redirected to `/account?success=true`
5. On cancel, user is redirected to `/account?canceled=true`

### 5.3 Stripe Customer Portal

When a user clicks "Manage Billing":

1. The `redirectToPortal()` function is called
2. Stripe Customer Portal opens
3. User can:
   - Update payment methods
   - View invoices
   - Manage subscriptions
   - Download receipts

## Step 6: Admin Dashboard

### 6.1 Access Admin Customers Page

1. Log in as an admin user
2. Go to **Administration** → **Customers** in the sidebar
3. View all customers and their subscription status

### 6.2 Customer Details

Admin can:

- View customer name, email, and subscription tier
- See current subscription status and next billing date
- Open customer details in a modal
- View/access the customer's Stripe profile (opens in Stripe dashboard)

## Step 7: Testing

### 7.1 Test Stripe Checkout

1. Go to **Account Management** tab in your Settings
2. Click **Upgrade to Builder**
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future date for expiry, any CVC
5. Verify subscription is updated in Firestore

### 7.2 Test Customer Portal

1. After upgrading, click **Manage Billing**
2. Verify Stripe Customer Portal opens
3. Test updating payment method and viewing invoice

### 7.3 Test Admin Dashboard

1. Log in as admin
2. Go to **Administration** → **Customers**
3. Verify all users and subscriptions are listed

## Step 8: Production Deployment

### 8.1 Switch to Production Keys

1. In Stripe Dashboard, disable test mode
2. Get your **Live** Publishable and Secret keys
3. Update environment variables with production keys

### 8.2 Update Webhook

In Stripe Dashboard:

1. Create a new webhook endpoint for production
2. Update `handleStripeWebhook` endpoint URL to your production Firebase domain

### 8.3 Deploy

```bash
npm run deploy:prod
cd functions && npm install && cd ..
firebase deploy --only hosting,functions -P production
```

## Troubleshooting

### Issue: "Failed to load Stripe" error

**Solution:** Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly and the @stripe/js package is installed.

### Issue: Webhook not updating Firestore

**Solution:**

1. Check Firebase Cloud Functions logs: `firebase functions:log`
2. Verify webhook secret in functions/.env matches Stripe dashboard
3. Ensure Firestore rules allow Cloud Functions to write to users collection

### Issue: "Upgrade button does nothing"

**Solution:**

1. Verify Price IDs are correct in environment variables
2. Check browser console for errors
3. Ensure Cloud Functions are deployed: `firebase deploy --only functions`

### Issue: "Customer not found" error

**Solution:**

1. Verify Cloud Function `createStripeCustomer` runs on user signup
2. Check Firestore `users` collection has `stripeCustomerId` field

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Stripe + Firebase Example](https://github.com/stripe/stripe-firebase-extensions)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

## Security Notes

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use Cloud Functions** - Stripe API calls should never happen from the frontend
3. **Verify webhooks** - Always verify the webhook signature in Cloud Functions
4. **CORS** - Allow only your domain in Stripe settings
5. **PCI Compliance** - Use Stripe Checkout, don't handle card data directly

## Next Steps

1. Configure Stripe products and prices
2. Set up environment variables
3. Deploy Cloud Functions
4. Test the upgrade flow
5. Set up webhooks for production
6. Monitor transactions in Stripe Dashboard
