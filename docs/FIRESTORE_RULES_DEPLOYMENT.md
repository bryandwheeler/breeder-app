# Firestore Security Rules Deployment Guide

## Issue
New users are getting a "permission-denied" error when accessing the app because Firestore security rules are not properly configured.

## Solution
Deploy the updated Firestore security rules that allow users to query their own data (even when they have no data yet).

## How to Deploy

### Option 1: Using Firebase Console (Recommended)
1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Copy the contents of `firestore.rules` file
6. Paste into the rules editor
7. Click **Publish**

### Option 2: Using Firebase CLI
If you have Firebase CLI installed and initialized:

```bash
firebase deploy --only firestore:rules
```

## What Changed
The new rules allow:
- ✅ Users to query their own dogs collection (even if empty)
- ✅ Users to query their own litters collection (even if empty)
- ✅ Users to read all breeder profiles (needed for search functionality)
- ✅ Users to read/write connection requests they're involved in
- ✅ Users to read/write their own notifications
- ✅ Connected dogs to be shared between kennels

## Verification
After deploying, new users should be able to:
1. Sign up successfully
2. See the "Add Dog" screen without errors
3. Add their first dog without permission errors
4. Search for other breeders' dogs for connections

## Current Error
```
@firebase/firestore: Firestore (12.6.0): Uncaught Error in snapshot listener:
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

This error occurs because the query `where('userId', '==', user.uid)` is executed on the dogs collection, and even though it returns no results for a new user, Firestore still checks permissions for the query itself.

The updated rules properly allow this query by checking `request.auth.uid` which is always available for authenticated users.
