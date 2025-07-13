import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

  const { uid, role } = req.body;

  if (!uid || !role) {
    return res.status(400).json({ error: 'User ID and role are required' });
  }

  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be either "admin" or "employee"' });
  }

  try {
    const auth = getAuth();

    // Verify the user exists
    await auth.getUser(uid);

    // Set custom claims
    await auth.setCustomUserClaims(uid, { role });

    return res.status(200).json({ 
      message: `Role ${role} set successfully for user ${uid}` 
    });
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return res.status(500).json({ error: error.message });
  }
} 