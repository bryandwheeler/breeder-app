# Email Integration Setup Guide

This guide will walk you through setting up email integration (Gmail and Outlook) for your breeder app.

## Overview

The email integration allows you to:
- ✉️ Send emails directly from the app
- 📥 Sync conversations with customers
- 🔗 Auto-link emails to customer records
- 📝 Track all communication in one place

## Multi-User Setup

**Important:** This is a multi-user system where **each breeder creates their own OAuth credentials**. This ensures:
- 🔒 Complete data privacy - emails stay under each breeder's control
- 🎯 Independence - each breeder has their own integration
- 🛡️ Security - credentials are not shared between users

## Prerequisites

- A Google account (for Gmail integration)
- OR a Microsoft account (for Outlook integration)
- 5-10 minutes to complete the guided setup

**No environment variables or developer knowledge required!** The app guides you through the entire process.

---

## How It Works

When you click "Set Up Gmail" or "Set Up Outlook" in the app:

1. **Guided Setup** - The app shows you step-by-step instructions
2. **Create OAuth App** - You create your own OAuth credentials (takes 5 minutes)
3. **Enter Credentials** - Paste your credentials into the app
4. **Authorize** - Grant the app permission to access your email
5. **Done!** - Start sending and syncing emails

## Gmail Integration Setup

The app provides an interactive wizard that guides you through these steps:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Create Project** or select an existing project
3. Name your project (e.g., "My Breeder App Email")
4. Click **Create**

### Step 2: Enable Gmail API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click on **Gmail API** and then click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type
3. Fill in the required fields:
   - **App name**: Your Breeder App
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **Save and Continue**
5. On the **Scopes** page, click **Add or Remove Scopes**
6. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/userinfo.email`
7. Click **Update** then **Save and Continue**
8. Add test users (your email and any other emails you want to test with)
9. Click **Save and Continue**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Name it (e.g., "Breeder App Web Client")
5. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173/auth/gmail/callback
   https://yourdomain.com/auth/gmail/callback
   ```
   *(Replace `yourdomain.com` with your production domain)*
6. Click **Create**
7. **Copy the Client ID and Client Secret** - you'll need these for your environment variables

### Step 5: Add Environment Variables

Add these to your `.env` file:

```env
VITE_GMAIL_CLIENT_ID=your_client_id_here
VITE_GMAIL_CLIENT_SECRET=your_client_secret_here
```

---

## Outlook Integration Setup

### Step 1: Register an Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: Breeder App
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI**: Select **Web** and enter:
     ```
     http://localhost:5173/auth/outlook/callback
     ```
5. Click **Register**

### Step 2: Add Additional Redirect URIs

1. In your app registration, go to **Authentication**
2. Under **Platform configurations** > **Web**, add redirect URIs:
   ```
   https://yourdomain.com/auth/outlook/callback
   ```
3. Click **Save**

### Step 3: Configure API Permissions

1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Select **Delegated permissions**
5. Add these permissions:
   - `Mail.Read`
   - `Mail.Send`
   - `User.Read`
6. Click **Add permissions**
7. Click **Grant admin consent** (if you have admin rights)

### Step 4: Create Client Secret

1. Go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description (e.g., "Breeder App Secret")
4. Select an expiry period (24 months recommended)
5. Click **Add**
6. **Copy the secret value** immediately - it won't be shown again

### Step 5: Get Application (Client) ID

1. Go to **Overview**
2. Copy the **Application (client) ID**

### Step 6: Enter Credentials in the App

**Don't add to .env!** Instead, you'll paste these credentials directly into the app during the setup wizard:
- **Client ID**: The Application (client) ID from Step 5
- **Client Secret**: The secret value from Step 4

The app securely stores these credentials in your user profile.

---

## Important: No Environment Variables Needed!

**This is a multi-user app** - each breeder enters their own credentials through the UI. You do NOT need to add email OAuth credentials to your `.env` file.

Your `.env` file only needs Firebase configuration:

```env
# Firebase Configuration (required)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Email credentials are entered by each user through the app UI
# No VITE_GMAIL_* or VITE_OUTLOOK_* variables needed!
```

---

## Using the Email Integration

### 1. Start the Setup Wizard

1. Go to **Settings** in your app
2. Navigate to the **Email Integration** section
3. Click **Set Up Gmail** or **Set Up Outlook**
4. The setup wizard opens with step-by-step instructions

### 2. Follow the Interactive Guide

The wizard walks you through:
- Creating your OAuth app (with copy-paste helpers)
- Getting your credentials
- Entering them into the app
- Authorizing email access

### 3. Configure Sync Settings

Once connected, you can:
- **Enable/Disable Syncing**: Turn automatic email syncing on or off
- **Auto-Link Customers**: Automatically match emails to customer records by email address

### 4. Compose Emails

From any customer record:
1. Click the **Compose** button next to their email
2. Write your email
3. Click **Send**

The email will be sent from your connected account and automatically logged as an interaction with the customer.

### 5. View Email Interactions

All email interactions appear in the customer's **Interactions** tab, along with other communication types.

---

## Security Considerations

### Important Notes:

1. **Access Tokens**: OAuth access tokens are stored in Firestore and should be encrypted in production
2. **Refresh Tokens**: Keep refresh tokens secure - they provide long-term access to email accounts
3. **Environment Variables**: Never commit `.env` files to version control
4. **Production**: In production, consider using a backend service to handle token storage and refresh

### Recommended Production Setup:

1. Use Firebase Cloud Functions to handle OAuth token exchange
2. Store encrypted tokens in Firestore with server-side encryption
3. Use Firebase Security Rules to restrict access to email integration documents
4. Implement token rotation and expiry handling
5. Add rate limiting to prevent API abuse

---

## Troubleshooting

### "Gmail integration is not configured"

**Solution**: Make sure you've added `VITE_GMAIL_CLIENT_ID` and `VITE_GMAIL_CLIENT_SECRET` to your `.env` file and restarted your development server.

### "Failed to exchange authorization code"

**Solution**: Check that:
1. Your redirect URI in Google Cloud Console matches exactly
2. Your client secret is correct
3. You're using the correct OAuth flow

### "Insufficient permissions"

**Solution**: Make sure you've added all required scopes in the Google Cloud Console OAuth consent screen.

### Email not syncing

**Solution**: Check that:
1. Sync is enabled in your email settings
2. Your access token hasn't expired
3. The Firestore security rules allow access to the `emailIntegrations` collection

---

## Next Steps

After setting up email integration, you can:

1. **Add SMS Integration**: Follow a similar pattern using Twilio
2. **Add Social Media**: Integrate Instagram, Facebook, and TikTok using Meta Business API
3. **Create Automated Workflows**: Set up automated email responses and follow-ups
4. **Build Templates**: Create reusable email templates for common scenarios

---

## Support

If you encounter any issues, please:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Ensure your OAuth credentials are valid
4. Check Firestore security rules are deployed

For additional help, refer to:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/auth/)
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
