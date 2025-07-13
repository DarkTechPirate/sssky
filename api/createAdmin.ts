import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'))
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const auth = getAuth();
    const db = getFirestore();

    // Check if admin already exists
    const adminSnapshot = await db.collection('admins').where('email', '==', email).get();
    if (!adminSnapshot.empty) {
      return res.status(400).json({ error: 'Admin with this email already exists' });
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: true
    });

    // Set custom claims for admin role
    await auth.setCustomUserClaims(userRecord.uid, { role: 'admin' });

    // Create admin document in Firestore
    await db.collection('admins').doc(userRecord.uid).set({
      email,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    return res.status(200).json({ 
      message: 'Admin created successfully',
      uid: userRecord.uid
    });
  } catch (error: any) {
    console.error('Error creating admin:', error);
    return res.status(500).json({ error: error.message });
  }
} 