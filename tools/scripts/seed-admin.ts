/**
 * Admin User Seeding Script
 *
 * Creates or updates an admin user in Firebase Auth with custom claims
 * and a corresponding Firestore document.
 *
 * Prerequisites:
 * - Run `gcloud auth application-default login` for ADC credentials
 * - Firebase project must be configured (run `pnpm run setup` first)
 *
 * Usage:
 * - pnpm run seed:admin
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import prompts from 'prompts';

const WORKSPACE_ROOT = path.resolve(__dirname, '../../');

/**
 * Read the projectId from firebase.json
 */
function getProjectIdFromFirebaseJson(): string | null {
  const firebaseJsonPath = path.join(WORKSPACE_ROOT, 'firebase.json');
  if (!fs.existsSync(firebaseJsonPath)) {
    return null;
  }
  const content = fs.readFileSync(firebaseJsonPath, 'utf-8');
  const config = JSON.parse(content);
  return config.projectId ?? null;
}

// Admin user configuration
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE = 'admin';

async function main() {
  console.log('\n🔐 Admin User Seeding Script\n');

  // Read project ID from firebase.json
  const projectId = getProjectIdFromFirebaseJson();

  if (!projectId) {
    console.error('❌ No projectId found in firebase.json');
    console.error('   Run the setup script first: pnpm run setup');
    process.exit(1);
  }

  console.log(`📍 Target Firebase project: ${projectId}`);

  // Initialize Firebase Admin SDK with ADC and explicit project ID
  if (getApps().length === 0) {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  const auth = getAuth();
  const firestore = getFirestore();

  // Confirm with user before proceeding
  const response = await prompts({
    type: 'confirm',
    name: 'proceed',
    message: 'Continue with seeding admin user?',
    initial: false,
  });

  if (!response.proceed) {
    console.log('❌ Seeding cancelled.');
    process.exit(0);
  }

  console.log('\n🔍 Checking for existing user...');

  let uid: string;
  let isNewUser = false;

  try {
    // Check if user already exists
    const existingUser = await auth.getUserByEmail(ADMIN_EMAIL);
    uid = existingUser.uid;
    console.log(`✅ User already exists with UID: ${uid}`);
  } catch (error: unknown) {
    // User doesn't exist, create new one
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'auth/user-not-found'
    ) {
      console.log('📝 Creating new admin user...');
      const newUser = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        emailVerified: true,
        displayName: 'Admin User',
      });
      uid = newUser.uid;
      isNewUser = true;
      console.log(`✅ Created user with UID: ${uid}`);
    } else {
      console.error('❌ Error checking for user:', error);
      process.exit(1);
    }
  }

  // Set custom claims
  console.log('🔑 Setting custom claims...');
  try {
    await auth.setCustomUserClaims(uid, { role: ADMIN_ROLE });
    console.log(`✅ Set custom claims: { role: "${ADMIN_ROLE}" }`);
  } catch (error) {
    console.error('❌ Error setting custom claims:', error);
    process.exit(1);
  }

  // Create/update Firestore document
  console.log('📄 Creating Firestore user document...');
  try {
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // Update existing document
      await userRef.update({
        role: ADMIN_ROLE,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('✅ Updated existing Firestore document');
    } else {
      // Create new document
      await userRef.set({
        email: ADMIN_EMAIL,
        role: ADMIN_ROLE,
        displayName: 'Admin User',
        createdAt: FieldValue.serverTimestamp(),
      });
      console.log('✅ Created new Firestore document');
    }
  } catch (error) {
    console.error('❌ Error creating Firestore document:', error);
    process.exit(1);
  }

  // Success summary
  console.log('\n🎉 Admin user seeded successfully!\n');
  console.log('   Details:');
  console.log(`   ├─ Email: ${ADMIN_EMAIL}`);
  console.log(`   ├─ UID: ${uid}`);
  console.log(`   ├─ Role: ${ADMIN_ROLE}`);
  console.log(`   ├─ Firestore: /users/${uid}`);
  console.log(`   └─ Status: ${isNewUser ? 'Created' : 'Updated'}`);
  console.log('\n   Password: admin123 (for local development only)\n');
}

main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
