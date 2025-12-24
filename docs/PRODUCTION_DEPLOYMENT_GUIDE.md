# Production Deployment Guide

This guide walks through deploying the subcollection migration to production.

## Overview

The migration has been completed in **development**. Now we need to:
1. Deploy the updated code to production
2. Run migration scripts against the production database
3. Verify everything works
4. Clean up old nested arrays (optional)

## Pre-Deployment Checklist

- [x] ✅ Code committed to git
- [x] ✅ Code pushed to GitHub
- [x] ✅ Production build created successfully
- [ ] ⏳ Deploy code to production hosting
- [ ] ⏳ Run production database migration
- [ ] ⏳ Verify production deployment
- [ ] ⏳ Clean up production nested arrays

---

## Step 1: Deploy Code to Production

### Option A: Firebase Hosting

If you're using Firebase Hosting:

```bash
# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything (hosting + indexes + rules)
firebase deploy
```

### Option B: Vercel

If you're using Vercel:

```bash
# Deploy to Vercel (will auto-deploy from main branch)
vercel --prod

# Or push will auto-deploy if connected to GitHub
git push origin main
```

### Option C: Netlify

If you're using Netlify:

```bash
# Deploy to Netlify
netlify deploy --prod

# Or it will auto-deploy from GitHub
```

### Option D: Other Hosting

Upload the contents of the `dist/` folder to your hosting provider.

---

## Step 2: Deploy Composite Indexes to Production

**IMPORTANT**: The indexes in `firestore.indexes.json` were already deployed when you ran:
```bash
firebase deploy --only firestore:indexes
```

This deploys to your default Firebase project (expert-breeder). If you have a separate production project:

```bash
# Switch to production project
firebase use production  # or whatever your prod project is named

# Deploy indexes
firebase deploy --only firestore:indexes

# Wait for indexes to build (check Firebase Console)
```

**Check index status**: Go to Firebase Console → Firestore Database → Indexes tab

---

## Step 3: Run Production Database Migration

### Important: Use Production Service Account

For production, you should use the production service account key:

```bash
# Set environment variable to use production key
export FIREBASE_ADMIN_KEY_PATH=./production-firebase-admin-key.json

# Or on Windows:
set FIREBASE_ADMIN_KEY_PATH=./production-firebase-admin-key.json
```

### Run Migration (Dry Run First)

**Always run dry-run first!**

```bash
# Dog subcollections (dry run)
npx tsx scripts/migrateDogSubcollections.ts

# Litter subcollections (dry run)
npx tsx scripts/migrateLitterSubcollections.ts
```

Review the output carefully. Verify:
- Document counts look correct
- No unexpected errors
- Data being migrated makes sense

### Execute Migration

Once dry-run looks good:

```bash
# Execute dog migration
npx tsx scripts/migrateDogSubcollections.ts --execute

# Execute litter migration
npx tsx scripts/migrateLitterSubcollections.ts --execute
```

**Estimated time**:
- Small datasets (<100 docs): 1-2 minutes
- Medium datasets (<1000 docs): 5-10 minutes
- Large datasets (>1000 docs): 15-30 minutes

---

## Step 4: Verify Production Deployment

### 4.1 Check Firebase Console

1. Go to Firebase Console → Firestore Database
2. Open a dog document → Check for subcollections tab
3. Click subcollections → Verify data migrated (health_tests, shot_records, etc.)
4. Open a litter document → Check for subcollections tab
5. Verify puppy subcollections exist and have correct data
6. Check litter documents have denormalized counts (puppyCount, maleCount, etc.)

### 4.2 Test Production App

1. Navigate to your production URL
2. **Test Dog Features**:
   - View dog list (should load normally)
   - Open a dog profile
   - Check health records, shot records, weight history
   - Add a new weight entry (should save to subcollection)

3. **Test Litter Features**:
   - View litter list
   - Open a litter detail page
   - Check puppies display correctly
   - Check puppy counts are accurate
   - Add or edit a puppy (should save to subcollection)

4. **Check Browser Console**:
   - Open DevTools → Console
   - Look for any errors
   - Verify no "Failed to load subcollections" messages

### 4.3 Monitor Firebase Usage

- Go to Firebase Console → Usage tab
- Check read/write operations
- Verify no spike in errors

---

## Step 5: Clean Up Production Nested Arrays (Optional)

**⚠️ CRITICAL: Only do this after thorough testing!**

This step is **optional** but recommended to reduce document sizes and costs.

### When to Run Cleanup

Wait at least 24-48 hours after production deployment and verify:
- [x] No errors in production logs
- [x] All features working correctly
- [x] Users haven't reported issues
- [x] Subcollection data verified in Firebase Console

### Run Cleanup

```bash
# Dry run first (ALWAYS!)
npx tsx scripts/cleanupNestedArrays.ts

# Review output carefully
# Verify it's finding subcollections before removing arrays

# Execute cleanup
npx tsx scripts/cleanupNestedArrays.ts --execute
```

**What this does**:
- Removes old nested array fields from documents
- Only removes if corresponding subcollection exists
- Permanently deletes the arrays (cannot undo)

**After cleanup**:
- Documents will be smaller
- Firestore costs will be lower
- App will only read from subcollections

---

## Rollback Plan

If something goes wrong **before running cleanup**:

### Option 1: Revert Code

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Redeploy old code
firebase deploy --only hosting  # or your hosting command
```

The app will fall back to reading nested arrays (they're still there).

### Option 2: Keep Code, Delete Subcollections

If the code is fine but subcollections are causing issues:

1. Subcollections can be deleted manually in Firebase Console
2. App will automatically fall back to nested arrays
3. No data loss (nested arrays still exist)

### After Cleanup (No Rollback Possible)

If you've run cleanup and removed nested arrays:
- You cannot easily roll back
- Would need to restore from backup
- This is why we wait 24-48 hours before cleanup!

---

## Monitoring After Deployment

### First 24 Hours

- Monitor Firebase Console for errors
- Check user reports/support tickets
- Review browser console in production
- Verify data is saving correctly

### First Week

- Monitor Firestore usage/costs
- Check query performance
- Verify all features working
- Consider cleanup after 3-7 days

### Long Term

- Indexes should all be green in Console
- Query performance should be better
- Document sizes should be smaller (after cleanup)
- Ready to scale to more users

---

## Common Issues

### Issue: "Permission denied" during migration

**Solution**:
- Verify service account key is correct
- Check Firestore security rules allow admin access
- Ensure using correct Firebase project

### Issue: Migration script hangs

**Solution**:
- Large datasets take time (be patient)
- Check Firebase Console to see progress
- Script processes in batches of 500

### Issue: Subcollections empty in production

**Solution**:
- Verify migration script ran with `--execute` flag
- Check migration script output for errors
- Ensure indexes have finished building

### Issue: App showing errors after deployment

**Solution**:
- Check browser console for specific errors
- Verify Firestore security rules allow subcollection access
- Check that code was deployed successfully

---

## Security Rules Update

After migration, ensure your Firestore security rules allow subcollection access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Dog subcollections
    match /dogs/{dogId}/{subcollection}/{docId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/dogs/$(dogId)).data.userId == request.auth.uid;
    }

    // Litter subcollections
    match /litters/{litterId}/{subcollection}/{docId} {
      allow read, write: if request.auth != null &&
        get(/databases/$(database)/documents/litters/$(litterId)).data.userId == request.auth.uid;
    }

    // Collection group query for puppies
    match /{path=**}/puppies/{puppyId} {
      allow read: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Success Criteria

✅ Code deployed to production hosting
✅ Composite indexes deployed and built
✅ Migration scripts completed successfully
✅ Production app loads without errors
✅ All features working (dogs, litters, puppies)
✅ Subcollections visible in Firebase Console
✅ No user-reported issues

---

## Support

If you encounter issues:

1. Check [SUBCOLLECTION_MIGRATION_GUIDE.md](./SUBCOLLECTION_MIGRATION_GUIDE.md) troubleshooting section
2. Review Firebase Console logs
3. Check browser console for errors
4. Review migration script output

---

**Remember**: The migration is designed to be zero-downtime and reversible (before cleanup). Take your time, verify at each step, and don't run cleanup until you're confident everything works!
