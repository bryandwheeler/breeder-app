# Email Integration - Verification Guide

## ✅ How to Confirm Email Integration is Working

### 1. **Where to Find the Setup**

Navigate to: **Settings → Email Integration Tab**

Path in app: `/settings` or `/breeder-settings` → Click "Email Integration" tab

### 2. **Setting Up an Email Connection**

1. Click **"Set Up Gmail"** or **"Set Up Outlook"** button
2. Follow the interactive wizard (4 steps)
3. Enter your OAuth credentials (Client ID & Client Secret)
4. Click "Complete Setup"
5. You'll be redirected to Google/Microsoft to authorize
6. After authorization, you'll see a success screen
7. You'll be automatically redirected back to Settings

### 3. **Where Connection Status is Displayed**

Once connected, the **Email Integration** tab will show:

**Connected Account Section:**
- ✅ Email address (e.g., `your-email@gmail.com`)
- ✅ Green "Connected" badge
- ✅ Provider (Gmail or Outlook)
- ✅ Last synced timestamp (if applicable)
- ✅ Disconnect button

**Sync Settings Section:**
- ✅ Email Syncing toggle (on/off)
- ✅ Auto-Link to Customers toggle (on/off)

### 4. **Where Data is Stored**

#### Firestore Collection: `emailIntegrations`
- **Document ID:** Your user ID (userId)
- **Data Structure:**
  ```
  emailIntegrations/{userId}
  ├── id: string
  ├── userId: string
  ├── provider: "gmail" | "outlook"
  ├── email: string
  ├── clientId: string
  ├── clientSecret: string (⚠️ should be encrypted in production)
  ├── accessToken: string (⚠️ should be encrypted in production)
  ├── refreshToken: string (⚠️ should be encrypted in production)
  ├── tokenExpiry: string (ISO timestamp)
  ├── isActive: boolean
  ├── syncEnabled: boolean
  ├── autoLinkCustomers: boolean
  ├── lastSyncedAt: string (ISO timestamp)
  ├── createdAt: string (ISO timestamp)
  └── updatedAt: string (ISO timestamp)
  ```

#### How to View in Firestore Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Firestore Database" in the left sidebar
4. Navigate to `emailIntegrations` collection
5. Click on your user ID document
6. You'll see all the fields listed above

### 5. **How to Test Email Sending**

1. Navigate to **Customers** page
2. Open any customer record
3. Next to their email address, click **"Compose"** button
4. Write your email and click **"Send"**
5. The email will be sent via your connected Gmail/Outlook account

### 6. **Verification Checklist**

- [ ] Email Integration tab appears in Settings
- [ ] "Set Up Gmail" and "Set Up Outlook" buttons are visible
- [ ] OAuth wizard opens when clicking setup buttons
- [ ] After OAuth flow, you see a success screen
- [ ] Settings page shows connected email with green badge
- [ ] Firestore has a document in `emailIntegrations/{yourUserId}`
- [ ] Document contains your email address and OAuth tokens
- [ ] "Compose" button appears next to customer emails
- [ ] Email can be sent successfully

## 📊 How to View Your Email Data

### Option 1: Through the UI

**Location:** Settings → Email Integration

You'll see:
- Connected email address
- Connection status (Connected/Disconnected)
- Provider (Gmail/Outlook)
- Sync settings

### Option 2: Through Firestore Console

**Steps:**
1. Open Firebase Console
2. Go to Firestore Database
3. Click on `emailIntegrations` collection
4. Find your user ID document
5. View all stored data

**Example Data:**
```json
{
  "id": "abc123userId",
  "userId": "abc123userId",
  "provider": "gmail",
  "email": "breeder@example.com",
  "clientId": "123456789-abc.apps.googleusercontent.com",
  "clientSecret": "GOCSPX-abc123...",
  "accessToken": "ya29.a0AfB_by...",
  "refreshToken": "1//0gHZK...",
  "tokenExpiry": "2025-12-05T15:30:00.000Z",
  "isActive": true,
  "syncEnabled": false,
  "autoLinkCustomers": true,
  "createdAt": "2025-12-05T14:30:00.000Z",
  "updatedAt": "2025-12-05T14:30:00.000Z"
}
```

### Option 3: Through Browser DevTools

1. Open Settings → Email Integration
2. Open browser DevTools (F12)
3. Go to Console tab
4. The integration data is logged when loaded
5. You can also check sessionStorage for `pending_oauth_credentials` during setup

## 🔒 Security Notes

### What's Stored Where:

**Session Storage (Temporary):**
- `pending_oauth_credentials` - Only during OAuth flow, cleared after

**Firestore (Permanent):**
- All email integration data
- OAuth tokens (⚠️ should be encrypted in production)
- User's OAuth app credentials

### ⚠️ Production Security Recommendations:

1. **Encrypt Sensitive Fields:**
   - `clientSecret`
   - `accessToken`
   - `refreshToken`

2. **Use Firebase Cloud Functions:**
   - Move token exchange to backend
   - Keep secrets server-side only

3. **Implement Token Rotation:**
   - Automatically refresh expired tokens
   - Update `tokenExpiry` field

4. **Add Rate Limiting:**
   - Prevent API abuse
   - Limit OAuth attempts

## 🧪 Testing the Full Flow

### Test Scenario 1: Gmail Connection

1. Go to Settings → Email Integration
2. Click "Set Up Gmail"
3. Follow wizard steps
4. Create test OAuth credentials in Google Cloud Console
5. Enter credentials
6. Authorize with Google
7. Verify success screen shows
8. Check Settings shows connected email
9. Check Firestore has document with your data
10. Try sending a test email from Customers page

### Test Scenario 2: View Connection Status

1. Go to Settings → Email Integration
2. Verify you see:
   - Your email address
   - Green "Connected" badge
   - Provider name (Gmail)
   - Sync toggle switches

### Test Scenario 3: Disconnect and Reconnect

1. Click "Disconnect" button
2. Confirm in dialog
3. Verify email integration is removed
4. Check Firestore - document should be deleted
5. Reconnect using "Set Up Gmail" again
6. Verify new connection is established

## 🐛 Troubleshooting

### Problem: "OAuth credentials not found" error

**Solution:** The OAuth flow was interrupted. Start fresh:
1. Clear sessionStorage
2. Go back to Settings → Email Integration
3. Click "Set Up Gmail" again

### Problem: Can't see connected email in Settings

**Solution:**
1. Check browser console for errors
2. Verify Firestore has document at `emailIntegrations/{yourUserId}`
3. Try refreshing the page
4. Check that `loadIntegration()` is being called

### Problem: Emails not sending

**Solution:**
1. Verify accessToken hasn't expired (check `tokenExpiry`)
2. Check browser console for API errors
3. Verify OAuth scopes include `gmail.send`
4. Try disconnecting and reconnecting

## 📝 Next Steps

### Features to Implement:

1. **Email Syncing** - Background job to pull new emails
2. **Token Refresh** - Automatically refresh expired tokens
3. **Email Threading** - Group related emails together
4. **Attachments** - Support sending/receiving files
5. **Templates** - Create reusable email templates
6. **Scheduled Sends** - Schedule emails for later
7. **Read Receipts** - Track when emails are opened

### Backend Improvements:

1. Move OAuth token exchange to Cloud Functions
2. Encrypt sensitive fields in Firestore
3. Implement token rotation
4. Add webhook for real-time email updates
5. Build email sync service
6. Add rate limiting and quota management
