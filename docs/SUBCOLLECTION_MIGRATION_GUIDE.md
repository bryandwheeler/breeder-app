# Subcollection Migration Guide

This guide walks through migrating your Firebase database from nested arrays to subcollections for improved performance and scalability.

## Overview

We're moving from:
```
dogs/{dogId}
  - healthTests: []
  - shotRecords: []
  - ...

litters/{litterId}
  - puppies: []
  - expenses: []
```

To:
```
dogs/{dogId}/health_tests/{testId}
dogs/{dogId}/shot_records/{recordId}
...

litters/{litterId}/puppies/{puppyId}
litters/{litterId}/expenses/{expenseId}
```

## Benefits

- ✅ **Better Performance**: Query specific subcollections instead of loading entire documents
- ✅ **Scalability**: Handle 10k+ breeders and 500k+ dogs/puppies
- ✅ **Efficient Queries**: Use composite indexes for fast filtering
- ✅ **Collection Groups**: Query all puppies across all litters
- ✅ **Atomic Operations**: Update individual records without document contention

## Migration Steps

### Phase 1: Deploy Indexes (5 minutes)

First, deploy the composite indexes to Firestore:

```bash
firebase deploy --only firestore:indexes
```

This will create all necessary indexes. Wait for them to build (check Firebase console).

### Phase 2: Run Migration Scripts (15-30 minutes)

#### Step 1: Dry Run (Test First)

Test the migration without making changes:

```bash
# Migrate dog subcollections (dry run)
npx tsx scripts/migrateDogSubcollections.ts

# Migrate litter subcollections (dry run)
npx tsx scripts/migrateLitterSubcollections.ts
```

Review the output to ensure it looks correct.

#### Step 2: Execute Migration

When ready, run with the `--execute` flag:

```bash
# Migrate dog subcollections
npx tsx scripts/migrateDogSubcollections.ts --execute

# Migrate litter subcollections
npx tsx scripts/migrateLitterSubcollections.ts --execute
```

**What this does:**
- Copies all nested array data to subcollections
- Adds denormalized fields (userId, litterId) for cross-collection queries
- Updates litter documents with puppy counts
- **Does NOT delete nested arrays** (safe to run)

### Phase 3: Verify Migration (10 minutes)

1. **Check Firebase Console**
   - Navigate to Firestore Database
   - Open a dog document → verify subcollections exist
   - Open a litter document → verify puppies/expenses subcollections exist
   - Check counts: `puppyCount`, `maleCount`, etc.

2. **Test the App**
   - The app already reads from subcollections with fallback to arrays
   - Browse dogs, view health records
   - Browse litters, view puppies
   - Everything should work identically

3. **Check Console for Errors**
   - Open browser DevTools → Console
   - Look for any Firestore errors
   - Verify no "Failed to load subcollections" messages

### Phase 4: Cleanup (After Verification)

**⚠️ WARNING: This step is PERMANENT and IRREVERSIBLE**

Only run cleanup after you've verified everything works:

```bash
# Dry run first
npx tsx scripts/cleanupNestedArrays.ts

# Execute cleanup (removes nested arrays)
npx tsx scripts/cleanupNestedArrays.ts --execute
```

**What this does:**
- Verifies subcollection exists before removing nested array
- Permanently deletes nested array fields from documents
- Reduces document size and cost

**After cleanup:**
- You can no longer rollback to nested arrays
- App will only read from subcollections
- Firestore bills will be lower (smaller documents)

## Rollback Plan

If you encounter issues **before running cleanup**:

1. **Revert Store Changes**
   ```bash
   git checkout HEAD -- src/store/dogStoreFirebase.ts
   ```

2. **The app will use nested arrays again**
   - Subcollections remain in Firestore (harmless)
   - Can delete subcollections manually if desired

3. **Report the issue** so we can fix before re-attempting

## Migration Scripts Reference

### migrateDogSubcollections.ts

Migrates dog health data to subcollections:
- `healthTests[]` → `health_tests/{id}`
- `shotRecords[]` → `shot_records/{id}`
- `vetVisits[]` → `vet_visits/{id}`
- `weightHistory[]` → `weight_history/{id}`
- `medications[]` → `medications/{id}`
- `dewormings[]` → `dewormings/{id}`

### migrateLitterSubcollections.ts

Migrates litter data to subcollections:
- `puppies[]` → `puppies/{id}`
- `expenses[]` → `expenses/{id}`

Also updates litter documents with denormalized counts:
- `puppyCount`, `maleCount`, `femaleCount`
- `availableCount`, `reservedCount`, `soldCount`, `keptCount`

### cleanupNestedArrays.ts

Removes nested array fields after migration:
- Verifies subcollection exists before removing field
- Skips removal if no subcollection found (safety check)
- Reports any issues for manual review

## Troubleshooting

### "Permission denied" errors

**Solution**: Ensure you're running scripts as an authenticated user with proper permissions. You may need to update Firestore security rules temporarily:

```javascript
// Temporary rule for migration
match /dogs/{dogId}/{subcollection=**} {
  allow read, write: if request.auth != null;
}
```

### Migration script hangs

**Solution**: Large datasets may take time. The script processes in batches of 500. Check Firebase console to see progress.

### Subcollections not showing in app

**Possible causes:**
1. Migration script didn't run with `--execute`
2. Firestore security rules blocking subcollection access
3. Browser cache - try hard refresh (Ctrl+Shift+R)

**Solution**: Check console logs for specific errors

### Data appears duplicated

**Expected behavior**: During migration (before cleanup), data exists in both nested arrays AND subcollections. This is intentional for safe rollback.

**After cleanup**: Only subcollections remain

## Security Rules Update

After migration, update your Firestore security rules to allow subcollection access:

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

## Timeline

Recommended schedule:

**Day 1:**
- Deploy indexes (5 min)
- Wait for indexes to build (30-60 min)
- Run dry run migrations (10 min)

**Day 2:**
- Execute migrations (15-30 min)
- Verify in Firebase console (10 min)
- Test app thoroughly (30 min)

**Day 3-7:**
- Monitor for any issues
- User acceptance testing

**Day 8:**
- Run cleanup if all looks good

## Support

If you encounter any issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review Firebase console for specific errors
3. Check browser console for client-side errors
4. Review the [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) for technical details

## Next Steps After Migration

Once migration is complete, consider:

1. **Add Algolia/Typesense** for global dog/puppy search
2. **Enable BigQuery Export** for analytics
3. **Set up Cloud Functions** for automatic denormalization
4. **Monitor Performance** in Firebase console

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the full roadmap.
