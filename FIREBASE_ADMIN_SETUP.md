# Firebase Admin SDK Authentication Setup

To run the migration scripts, you need to authenticate with Firebase Admin SDK using a service account key.

## Quick Setup (5 minutes)

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **expert-breeder-dev**
3. Click the gear icon ⚙️ (Settings) → **Project settings**
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the confirmation dialog
7. Save the downloaded JSON file as `firebase-admin-key.json` in the root of this project

### Step 2: Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="$PWD\firebase-admin-key.json"
```

**Windows (Command Prompt):**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=%CD%\firebase-admin-key.json
```

**Mac/Linux:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/firebase-admin-key.json"
```

### Step 3: Verify Setup

Run this to verify authentication works:
```bash
npx tsx scripts/migrateStringLiterals.ts --dry-run
```

If you see collections being scanned without credential errors, you're ready!

---

## Security Notes

⚠️ **IMPORTANT**: The `firebase-admin-key.json` file contains sensitive credentials!

- **DO NOT** commit this file to git (it's already in `.gitignore`)
- **DO NOT** share this file publicly
- Keep it secure on your local machine only
- If compromised, revoke the key in Firebase Console and generate a new one

---

## Already Added to .gitignore

The following entry has been added to `.gitignore` to protect your credentials:

```
# Firebase Admin SDK credentials
firebase-admin-key.json
```

---

## Troubleshooting

### Error: "Could not load the default credentials"
- Make sure you've set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Verify the path points to the correct JSON file
- The environment variable only persists in the current terminal session
- You'll need to set it again if you close and reopen your terminal

### Error: "ENOENT: no such file or directory"
- Double-check the file path in the environment variable
- Make sure `firebase-admin-key.json` is in the project root directory
- Use absolute paths if relative paths aren't working

### Error: "Permission denied"
- Ensure the service account has the "Firebase Admin SDK Administrator Service Agent" role
- You may need to manually grant Firestore permissions in IAM & Admin

---

## Alternative: Using gcloud CLI

If you prefer, you can install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticate:

```bash
gcloud auth application-default login
```

This method doesn't require downloading a service account key, but does require installing gcloud CLI.

---

**Next Steps**: After authentication is set up, proceed with the migrations in [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md).
