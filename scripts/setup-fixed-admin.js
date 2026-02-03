import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Fixed admin credentials
const ADMIN_USERNAME = "admin01";
const ADMIN_PASSWORD = "ADMIN123";
const ADMIN_EMAIL = `${ADMIN_USERNAME}@checklist-central.com`;

async function initializeFirebaseAdmin() {
  try {
    const keyPath = join(dirname(__dirname), 'firebase-key.json');
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error.message);
    return false;
  }
}

async function setupFixedAdmin() {
  console.log('🔧 Setting up fixed admin account');
  console.log('===============================\n');

  // Initialize Firebase Admin
  const initialized = await initializeFirebaseAdmin();
  if (!initialized) {
    console.log('\n❌ Failed to initialize Firebase Admin. Please check your firebase-key.json file.');
    process.exit(1);
  }

  try {
    let userRecord;

    // Check if admin already exists
    try {
      userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log('Admin user already exists. Updating credentials...');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new admin user
        userRecord = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          emailVerified: true
        });
        console.log('Created new admin user.');
      } else {
        throw error;
      }
    }

    // Update password for existing user
    if (userRecord) {
      await admin.auth().updateUser(userRecord.uid, {
        password: ADMIN_PASSWORD
      });
    }

    // Set admin claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // Update or create admin document in Firestore
    const db = admin.firestore();
    await db.collection('admins').doc(userRecord.uid).set({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log('\n✅ Fixed admin account setup completed!');
    console.log('\nAdmin Credentials:');
    console.log('Username:', ADMIN_USERNAME);
    console.log('Password:', ADMIN_PASSWORD);
    console.log('\nYou can now log in to the admin dashboard with these credentials.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
setupFixedAdmin(); 