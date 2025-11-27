# GitHub Actions Setup Guide

This guide walks you through setting up automatic deployment to Firebase via GitHub Actions.

## Status

 **Step 1: GitHub Actions Workflow File Created**
- File created at: `.github/workflows/deploy.yml`
- Triggers on: Push to `main` branch
- Can also be manually triggered from GitHub Actions tab

  **Step 2: Firebase Service Account Token - NEEDS COMPLETION**

---

## Step 2: Add Firebase Service Account to GitHub Secrets

### Option A: Using Firebase CLI (Recommended - Simpler)

1. **Generate Firebase Token**
   ```bash
   firebase login:ci
   ```
   - This will open a browser window for authentication
   - After logging in, a token will be displayed in your terminal
   - Copy this token

2. **Add Token to GitHub Secrets**
   - Go to your GitHub repository: https://github.com/bryandwheeler/breeder-app
   - Click **Settings** ’ **Secrets and variables** ’ **Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT_EXPERT_BREEDER`
   - Value: Paste the token from step 1
   - Click **Add secret**

### Option B: Using Service Account JSON (More Secure)

1. **Download Service Account Key**
   - Go to [Firebase Console - Production Project](https://console.firebase.google.com/project/expert-breeder/settings/serviceaccounts/adminsdk)
   - Click **Generate New Private Key**
   - Save the JSON file securely
   - **IMPORTANT**: Never commit this file to Git!

2. **Convert JSON to Single Line**
   - Open the downloaded JSON file
   - Copy the entire contents
   - Remove all line breaks to make it a single line, OR
   - Keep as-is and paste the full JSON (GitHub will handle it)

3. **Add to GitHub Secrets**
   - Go to your GitHub repository: https://github.com/bryandwheeler/breeder-app
   - Click **Settings** ’ **Secrets and variables** ’ **Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_SERVICE_ACCOUNT_EXPERT_BREEDER`
   - Value: Paste the JSON content
   - Click **Add secret**

---

## Step 3: Add Firebase Environment Variables to GitHub Secrets

Add each of these as separate secrets in GitHub:

1. Go to **Settings** ’ **Secrets and variables** ’ **Actions**
2. Click **New repository secret** for each:

### Production Firebase Config Secrets:

| Secret Name | Value (from .env.production) |
|-------------|------------------------------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyD7UfHNvo9c47Z3h6vdGsB2VYPvGZ9gJis` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `expert-breeder.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `expert-breeder` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `expert-breeder.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `214191898374` |
| `VITE_FIREBASE_APP_ID` | `1:214191898374:web:5e0d39fc4bc39bb61f2887` |

---

## Step 4: Test the Workflow

### Push to Main Branch:
```bash
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

### Or Manually Trigger:
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy to Firebase** workflow
4. Click **Run workflow** ’ **Run workflow**

### Monitor Deployment:
- Watch the workflow run in the **Actions** tab
- Check for any errors in the logs
- Once complete, verify the deployment at: https://expert-breeder.web.app

---

## Workflow Details

The workflow will:
1.  Checkout your code
2.  Setup Node.js 20
3.  Install dependencies
4.  Build production bundle using `.env.production` values
5.  Deploy to Firebase Hosting

### Workflow Features:
- **Automatic Deployment**: Deploys when you push to `main`
- **Manual Deployment**: Can be triggered from GitHub Actions tab
- **Environment Variables**: Uses GitHub Secrets for Firebase config
- **Production Only**: Only deploys production environment

---

## Troubleshooting

### Workflow Fails with "Unauthorized"
- Check that `FIREBASE_SERVICE_ACCOUNT_EXPERT_BREEDER` secret is set correctly
- Verify the service account has permissions in Firebase Console

### Build Fails
- Check that all Firebase environment variable secrets are set
- Verify the values match your `.env.production` file

### Deployment Succeeds but Site Doesn't Update
- Clear your browser cache
- Check Firebase Hosting console for deployment status
- Verify the correct Firebase project is selected

---

## Security Notes

-  Service account keys are stored as GitHub Secrets (encrypted)
-  `.env` files are in `.gitignore` and not committed
-  Environment variables are injected at build time
-   Never commit service account JSON files to Git
-   Never expose Firebase config secrets publicly

---

## Next Steps

Once setup is complete:

1.  Push changes to `main` branch to trigger automatic deployment
2.  Monitor deployments in GitHub Actions tab
3.  Continue developing locally with `npm run dev`
4.  All pushes to `main` will automatically deploy to production

## Alternative: Deploy Development Environment

To add development environment deployment, you can:

1. Create `.github/workflows/deploy-dev.yml` for development
2. Configure it to trigger on pushes to `develop` branch
3. Add `FIREBASE_SERVICE_ACCOUNT_EXPERT_BREEDER_DEV` secret
4. Use development Firebase config secrets

---

**Current Status**: Workflow file created  | Service account secret pending  
