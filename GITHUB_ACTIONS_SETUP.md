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

### Step 1: Generate Firebase CI Token

Open a **new Windows Terminal or Command Prompt** (separate window, not VS Code terminal):

```bash
firebase login:ci
```

**What happens:**
1. Browser opens automatically
2. Log in with your Google account (linked to Firebase)
3. Authorize Firebase CLI
4. Browser shows "Success!"
5. Terminal displays your token

**Copy the token** - it looks like:
```
1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Add Secrets to GitHub

Go to: **https://github.com/bryandwheeler/breeder-app/settings/secrets/actions**

Click **"New repository secret"** for each of these (**8 secrets total**):

#### Secret 1: Firebase Token
- **Name:** `FIREBASE_TOKEN`
- **Value:** The token from `firebase login:ci` command above

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

### "Cannot run login:ci in non-interactive mode"
**Cause:** Trying to run in automated/VS Code terminal
**Fix:** Open a **new Windows Terminal or Command Prompt** and run there

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
Firebase token: ⚠️ **Needs to be added**
Config secrets: ⚠️ **Need to be added**

**After adding all secrets, the workflow will run automatically!**
