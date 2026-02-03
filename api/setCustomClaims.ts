import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccountKey = {
  "type": "service_account",
  "project_id": "skyla-tech",
  "private_key_id": "a520260993e897706dc228970d93ec880b1d76ee",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCgDO2MMHbwscxO\nl8aVdf8pUBEX23EfYHJhmWePTGWrxLK3cBxk3oCM1qYTnV/yGBd5mOvhh/E18KKJ\nDcOa3arcrp4vrqYy0TIP67KeST1wlaNR6qjMv+t5449q7FtteC6fbNPWebVmiCC0\n6PQFZs+yqhfUF29oihMwf1SsCiDI21w8EbV/sMdmOAGozKfkvc06dtU+mkhvmkTV\nvpCi2X/c0rG56krdmpLyoNsFxrfgKDVts+jRs3z1XdMrrOTtGj/qSy2BALwfsHtn\nS5oVRiOojmPBTpGqBQ33yXzyIXwDczLne+HI4X7OV8hLDXuIJbA+fD/XOM/aOLYy\n/mneCPF5AgMBAAECggEAJTbEUB2ftjj9GoQXWD66sNotU0kCnUtRZSikZ/EZTc5b\nSKRAceK7bKPnMzXbLoEUCkG4jPTNLN/SBwCEjACBHzVZ0hfvjG7QT1vcKQo6BzC/\n7AbeL1drkuiKuw+QdZxlaMvG2L5tY5UA19e3j373iaEbj8TQMnQyYIsmvqbPNyxN\nqzAMdMTocoxpMprtQq+BnmybRjEyLPWE/FNbuYYG9rm15jbFS3OmQ88bIBrQmrpV\ndGkcPs4Etdu/dAbTyZu5NA/mSK7EZUr47YTdUssiq+p3r4FouZV28VWdGJpXzV0Y\niKifbMr9WigCSot48VgkPY9dHfLxXhFKmOWgC4AFRQKBgQDbzmtYg0g1++6OMsEO\nZ0Pd6EMTQ65owwx6lAANaJU1xiThjOA9sncvmXfP3ZVsQLg4MZR+ewl23brARB5h\n78y3JIEqfqIyb7cpxdjejD2Z53UzXn3oLxnGw+ZELCBWS6t5ULcnDriU9YwQJbjv\nYuWAqTcdlMJ5F2F5feABuPK/xQKBgQC6Z5kn+RSHBnTQzg2mwpcsja6w/H8ypmXM\ni1AyGEWzaBvnkirMYWPYayjIxv+GztF2g06D6dsKjxfH/mD1NmwO+02g3yXIUgKu\nWm9A4Ztgqk2KLnk/p2kEGWF2B8fyDP2Zeu2z6X2WHB+Y+Qux+B3XZbuyFgrhw0D/\naP/Maq/yJQKBgGY3tynhW1pnf0e3iJn3IdN3aIHz7o6fbhUu8FtL8F+idpJBXiKy\n9MQ4/UO4Sv2dl03imKi89OjHMkqpIuvuhWgB3ONzImCMHUSa0kCkPR1uSs2JusmX\n5cfOYC4By0P2SpbPF21dZi83hVwY/sisWAgeKRhjjpCbc+P4yoxigtj1An8zsofH\njk0jJadAQeWHWnCS6riIXX7pjTyuffS/7/tkxnr2vpMgG+KVIyMsjARSXwm41LHx\n4+ncA9OUo/hACdfuT8Q32aug4x3bPTmdxPRS2uimaj02aje161QcaAwMFY5AAtfq\nDdfGygX5ZxjXQvkDxDNKMNLTylM8guJuzyf9AoGBAI6T5ddLXAOIPDp9HWbF48qF\nQ5VraTIjuscRJckvbS3oi5JP5xlcQQaFlIC+wywd4vOpvozKnxhyqNldfHFyFnNL\nJbdmpqW5xFUDAzu/q46k9Ai0bT00nAXXbdWkWcCbtHbo4AX7uCcj13GSM2Rs/x/9\nTyz2I4bAjpsksIq+lCpc\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@skyla-tech.iam.gserviceaccount.com",
  "client_id": "115568133546334017751",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40skyla-tech.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccountKey)
    });
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw error; // Re-throw to prevent silent failures
  }
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
    try {
      await auth.getUser(uid);
    } catch (error) {
      console.error('User verification failed:', error);
      return res.status(404).json({ error: 'User not found in Firebase Auth' });
    }

    // Set custom claims
    try {
      await auth.setCustomUserClaims(uid, { role });
    } catch (error) {
      console.error('Setting custom claims failed:', error);
      return res.status(500).json({ error: 'Failed to set user role. Please try again.' });
    }

    return res.status(200).json({ 
      message: `Role ${role} set successfully for user ${uid}` 
    });
  } catch (error: any) {
    console.error('Error in setCustomClaims handler:', error);
    return res.status(500).json({ 
      error: 'Internal server error while setting user role',
      details: error.message 
    });
  }
} 