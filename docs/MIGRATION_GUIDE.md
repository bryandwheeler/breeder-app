# Migration Guide: Naming Convention Standardization

This guide provides step-by-step instructions for migrating the Expert Breeder application to use consistent naming conventions.

---

## Overview

We're standardizing naming conventions across the codebase to improve consistency and maintainability:

1. **Firestore Collections**: `snake_case` → `camelCase`
2. **String Literal Types**: `snake_case` → `kebab-case`
3. **Code Enforcement**: Add ESLint rules and TypeScript guards

---

## Migration Checklist

### ✅ Phase 1: Preparation (No Risk)

- [x] Read `NAMING_CONVENTIONS.md`
- [x] ESLint rules added
- [x] TypeScript helper types created (`src/types/guards.ts`)
- [ ] Review migration scripts
- [ ] Schedule maintenance window
- [ ] Notify users of planned downtime
- [ ] Create full database backup (via Firebase Console)

### 🟡 Phase 2: String Literal Migration (Medium Risk)

- [ ] Run string literal migration in dry-run mode
- [ ] Review proposed changes
- [ ] Execute string literal migration
- [ ] Update code to use new values
- [ ] Test thoroughly in development
- [ ] Deploy code changes
- [ ] Verify production data

### 🔴 Phase 3: Collection Rename (High Risk)

- [ ] **STOP**: Ensure Phase 2 is complete and tested
- [ ] Schedule longer maintenance window (30-60 minutes)
- [ ] Enable maintenance mode
- [ ] Run collection migration in dry-run mode
- [ ] Create automated backups via script
- [ ] Execute collection migration
- [ ] Update all code references
- [ ] Deploy updated application
- [ ] Verify all features work
- [ ] Monitor for errors
- [ ] Disable maintenance mode

---

## Phase 1: Preparation

### 1.1 Install Required Dependencies

```bash
# Install tsx for running TypeScript scripts
npm install -D tsx

# Ensure environment variables are set
cp .env.example .env
# Edit .env and add your Firebase config
```

### 1.2 Create Database Backup (Firebase Console)

1. Go to Firebase Console → Firestore Database
2. Click "Backups" tab
3. Create a manual backup
4. Wait for completion and verify
5. Download backup metadata for reference

### 1.3 Review Migration Scripts

```bash
# Review string literal migration
cat scripts/migrateStringLiterals.ts

# Review collection migration
cat scripts/migrateCollections.ts
```

---

## Phase 2: String Literal Migration

### 2.1 Preview Changes (Dry Run)

```bash
# Preview what will be changed
npx tsx scripts/migrateStringLiterals.ts --dry-run
```

**Expected Output:**

```
🚀 Starting String Literal Migration
📝 Mode: DRY RUN (no changes)

📋 Migrations to apply:
  "vet_visit" → "vet-visit"
  "heat_expected" → "heat-expected"
  "due_date" → "due-date"
  ...

📂 Migrating collection: dogs
  🔄 abc123.registration.status: "not_started" → "not-started"
  📊 Scanned: 150, Updated: 23, Fields: 23

📊 Migration Summary
Documents Scanned:  450
Documents Updated:  67
Fields Updated:     89
Errors:             0
```

### 2.2 Execute String Literal Migration

```bash
# Execute the migration
npx tsx scripts/migrateStringLiterals.ts --execute
```

⚠️ **This will modify your database!** Ensure you have backups.

### 2.3 Update Code References

After running the migration, update your TypeScript code:

```typescript
// ❌ OLD (remove these)
import /* old types */ '@/types/dog';

// ✅ NEW (use these)
import {
  ReminderType,
  BreedingMethod,
  ContractType,
  RegistrationStatus,
} from '@/types/guards';

// Example usage:
const reminder: Reminder = {
  id: '123',
  title: 'Vet Visit',
  type: 'vet-visit', // ✅ kebab-case
  date: '2024-12-15',
};

// For migration compatibility:
import { migrateLegacyStatus } from '@/types/guards';
const newStatus = migrateLegacyStatus(oldStatus); // converts snake_case to kebab-case
```

### 2.4 Test in Development

```bash
# Run the development server
npm run dev

# Test all features that use:
- Reminders (vaccination, vet-visit, etc.)
- Breeding records (surgical-ai)
- Registrations (not-started status)
- Contracts (breeding-rights, co-ownership)
```

### 2.5 Deploy and Verify

```bash
# Build for production
npm run build

# Deploy to production
# (your deployment process here)

# Verify in production
# Check logs for any errors related to status values
```

---

## Phase 3: Collection Rename Migration

⚠️ **HIGH RISK**: Only proceed after Phase 2 is complete and tested!

### 3.1 Schedule Maintenance Window

- **Recommended duration**: 30-60 minutes
- **Best time**: Low traffic period (early morning/late night)
- **Notify users**: At least 24 hours in advance

### 3.2 Enable Maintenance Mode

Create a maintenance page or banner:

```typescript
// In App.tsx or index.html
const MAINTENANCE_MODE = true;

if (MAINTENANCE_MODE) {
  return <MaintenancePage />;
}
```

### 3.3 Create Automated Backups

```bash
# Create backups of all collections
npx tsx scripts/migrateCollections.ts --backup
```

**Output:**

```
📦 Backing up collection: breeder_profiles
  ✅ Backed up 45 documents to: backups/breeder_profiles_2024-12-07T15-30-00.json
📦 Backing up collection: breeding_records
  ✅ Backed up 128 documents to: backups/breeding_records_2024-12-07T15-30-05.json
...
✅ Backup completed successfully!
```

Verify backup files exist:

```bash
ls -lh backups/
```

### 3.4 Preview Migration (Dry Run)

```bash
# Preview the collection migration
npx tsx scripts/migrateCollections.ts --dry-run
```

**Review output carefully:**

- Check document counts
- Verify collections being renamed
- Ensure no errors

### 3.5 Execute Collection Migration

```bash
# Execute the migration (will prompt for confirmation)
npx tsx scripts/migrateCollections.ts --execute
```

**Expected flow:**

1. Creates backups
2. Copies all documents to new collections
3. Verifies document counts match
4. Deletes old collections (after confirmation)

**Duration estimate:**

- Small databases (<1000 docs): 1-2 minutes
- Medium databases (<10000 docs): 5-10 minutes
- Large databases (>10000 docs): 15-30 minutes

### 3.6 Update Code References

Update all Firestore collection references:

```typescript
// ❌ OLD (remove these)
collection(db, 'breeder_profiles');
collection(db, 'breeding_records');
collection(db, 'heat_cycles');
collection(db, 'stud_jobs');
collection(db, 'customer_segments');

// ✅ NEW (use these)
import { FIRESTORE_COLLECTIONS } from '@/types/guards';

collection(db, FIRESTORE_COLLECTIONS.BREEDER_PROFILES); // 'breederProfiles'
collection(db, FIRESTORE_COLLECTIONS.BREEDING_RECORDS); // 'breedingRecords'
collection(db, FIRESTORE_COLLECTIONS.HEAT_CYCLES); // 'heatCycles'
collection(db, FIRESTORE_COLLECTIONS.STUD_JOBS); // 'studJobs'
collection(db, FIRESTORE_COLLECTIONS.CUSTOMER_SEGMENTS); // 'customerSegments'
```

### 3.7 Update Firestore Security Rules

Update `firestore.rules`:

```
// ❌ OLD
match /breeder_profiles/{profileId} { ... }
match /breeding_records/{recordId} { ... }
match /heat_cycles/{cycleId} { ... }
match /stud_jobs/{jobId} { ... }
match /customer_segments/{segmentId} { ... }

// ✅ NEW
match /breederProfiles/{profileId} { ... }
match /breedingRecords/{recordId} { ... }
match /heatCycles/{cycleId} { ... }
match /studJobs/{jobId} { ... }
match /customerSegments/{segmentId} { ... }
```

Deploy updated rules:

```bash
firebase deploy --only firestore:rules
```

### 3.8 Deploy Updated Application

```bash
# Build with new collection names
npm run build

# Deploy to production
# (your deployment process)

# Monitor logs for errors
```

### 3.9 Verification Checklist

Test all features:

- [ ] User can log in
- [ ] Dogs list loads correctly
- [ ] Litters list loads correctly
- [ ] Breeding records display
- [ ] Heat cycles display
- [ ] Stud jobs display
- [ ] Customer segments work
- [ ] Profile settings load
- [ ] No console errors
- [ ] No database query errors

### 3.10 Disable Maintenance Mode

```typescript
// Set back to false
const MAINTENANCE_MODE = false;
```

---

## Rollback Procedures

### If String Literal Migration Fails

1. **Stop immediately** - Don't continue to collection migration
2. **Review errors** in migration output
3. **Restore from backups** if data is corrupted:
   ```bash
   # Manually restore from JSON backups
   # Contact database administrator
   ```

### If Collection Migration Fails

1. **DO NOT delete old collections** manually
2. **Stop application deployment**
3. **Restore from backups**:
   ```bash
   # The migration script creates backups in backups/ directory
   # Restore using Firebase Admin SDK or manually via console
   ```
4. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   ```
5. **Contact team** for assistance

---

## Post-Migration Tasks

### Immediate (Within 24 hours)

- [ ] Monitor error logs
- [ ] Check user reports
- [ ] Verify all features working
- [ ] Check database query performance

### Short-term (Within 1 week)

- [ ] Remove legacy string literal values from codebase
- [ ] Update documentation
- [ ] Train team on new conventions
- [ ] Update onboarding materials

### Long-term (Within 1 month)

- [ ] Delete backup files after verification
- [ ] Review and optimize Firestore indexes
- [ ] Consider adding monitoring for naming violations

---

## Troubleshooting

### Issue: Migration script fails with "Permission Denied"

**Solution:**

- Ensure Firebase credentials are correct in `.env`
- Verify user has Firestore write permissions
- Check Firebase IAM roles

### Issue: Document counts don't match after migration

**Solution:**

1. Stop immediately
2. Don't delete old collections
3. Run verification manually:
   ```typescript
   // Check both collections have same count
   const oldCount = await getDocs(collection(db, 'old_name'));
   const newCount = await getDocs(collection(db, 'newName'));
   console.log(oldCount.size, newCount.size);
   ```
4. Re-run copy step if needed

### Issue: Application crashes after collection rename

**Solution:**

1. Check console errors for collection name references
2. Search codebase for old collection names:
   ```bash
   grep -r "breeder_profiles" src/
   grep -r "breeding_records" src/
   grep -r "heat_cycles" src/
   grep -r "stud_jobs" src/
   grep -r "customer_segments" src/
   ```
3. Update any missed references
4. Redeploy

### Issue: Firestore rules not working after migration

**Solution:**

1. Check `firestore.rules` for old collection names
2. Update rules to use new names
3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review `NAMING_CONVENTIONS.md`
3. Check backup files in `backups/` directory
4. Review migration logs in console output
5. Contact your database administrator

---

**Last Updated**: December 2024
**Migration Status**: Ready for execution
**Estimated Total Time**: 1-2 hours (including testing)
