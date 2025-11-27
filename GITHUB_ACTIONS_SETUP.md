# GitHub Actions Setup Guide

This guide walks you through setting up automatic deployment to Firebase via GitHub Actions.

## Status

✅ **Step 1: GitHub Actions Workflow File Created**
- File created at: `.github/workflows/deploy.yml`
- Triggers on: Push to `main` branch
- Can also be manually triggered from GitHub Actions tab

⚠️ **Step 2: Firebase Token & Secrets - NEEDS COMPLETION**

---

## Quick Setup Steps

### Step 1: Download Firebase Service Account Key

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/expert-breeder/settings/serviceaccounts/adminsdk

2. **Generate Key:**
   - Click **"Generate New Private Key"**
   - Click **"Generate Key"** in the confirmation dialog
   - A JSON file will download (e.g., `expert-breeder-firebase-adminsdk-xxxxx.json`)

3. **Open the JSON file** in a text editor and copy **ALL** the contents

### Step 2: Add Secrets to GitHub

Go to: **https://github.com/bryandwheeler/breeder-app/settings/secrets/actions**

Click **"New repository secret"** for each of these (**7 secrets total**):

#### Secret 1: Firebase Service Account
- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** Paste the **entire JSON content** from the service account key file you downloaded
  (The whole thing, including all the curly braces and quotes)

#### Secrets 2-7: Firebase Config (from your .env.production file)
- **Name:** `VITE_FIREBASE_API_KEY`
  **Value:** `AIzaSyD7UfHNvo9c47Z3h6vdGsB2VYPvGZ9gJis`

- **Name:** `VITE_FIREBASE_AUTH_DOMAIN`
  **Value:** `expert-breeder.firebaseapp.com`

- **Name:** `VITE_FIREBASE_PROJECT_ID`
  **Value:** `expert-breeder`

- **Name:** `VITE_FIREBASE_STORAGE_BUCKET`
  **Value:** `expert-breeder.firebasestorage.app`

- **Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
  **Value:** `214191898374`

- **Name:** `VITE_FIREBASE_APP_ID`
  **Value:** `1:214191898374:web:5e0d39fc4bc39bb61f2887`

---

## Step 3: Test the Workflow

### Option A: Push to Main
```bash
git add .
git commit -m "Update GitHub Actions workflow"
git push origin main
```

### Option B: Manual Trigger
1. Go to: https://github.com/bryandwheeler/breeder-app/actions
2. Click **"Deploy to Firebase"** workflow
3. Click **"Run workflow"** → **"Run workflow"** button

### Monitor Progress
- Watch in the **Actions** tab
- Check logs for any errors
- Verify deployment at: **https://expert-breeder.web.app**

---

## What the Workflow Does

Every time you push to `main` branch:

1. ✅ Checks out your code
2. ✅ Sets up Node.js 20
3. ✅ Installs dependencies (`npm ci`)
4. ✅ Builds production bundle with Firebase config
5. ✅ Deploys to Firebase Hosting using your token

---

## Troubleshooting

### "Process failed with exit code 1"
**Cause:** Missing or incorrect secrets
**Fix:** Verify all 8 secrets are added correctly in GitHub

### "Unauthorized" or "Permission denied"
**Cause:** Firebase token is invalid or expired
**Fix:** Run `firebase login:ci` again and update the `FIREBASE_TOKEN` secret

### Build succeeds but deployment fails
**Cause:** Token doesn't have permissions
**Fix:** Ensure you're logged in with the account that owns the Firebase project

### "Invalid service account"
**Cause:** Service account JSON not formatted correctly in GitHub secret
**Fix:** Make sure you copied the ENTIRE JSON file contents, including outer curly braces

---

## Security Notes

✅ All secrets are encrypted by GitHub
✅ `.env` files are gitignored
✅ Environment variables injected at build time
⚠️ Never commit Firebase tokens or credentials

---

## What's Next

Once secrets are configured:

✅ Every push to `main` auto-deploys to production
✅ Manual deploys from Actions tab anytime
✅ Continue local development with `npm run dev`
✅ No more manual `firebase deploy` commands!

---

**Current Status:**
Workflow file: ✅ Created
Service account: ⚠️ **Needs to be added**
Config secrets: ⚠️ **Need to be added (6 Firebase config secrets)**

**After adding all 7 secrets, the workflow will run automatically!**
