const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setCustomClaims = functions.https.onCall(async (data, context) => {
  // Verify the request is from an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can set custom claims.'
    );
  }

  const { uid, role } = data;
  
  try {
    // Set custom user claims
    await admin.auth().setCustomUserClaims(uid, { role });
    return { success: true };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// When a new employee document is created in Firestore
exports.onEmployeeCreated = functions.firestore
  .document('employees/{employeeId}')
  .onCreate(async (snap, context) => {
    const employeeData = snap.data();
    
    try {
      // Set custom claims for the user
      await admin.auth().setCustomUserClaims(employeeData.uid, {
        role: 'employee',
        companyId: employeeData.companyId
      });
    } catch (error) {
      console.error('Error in onEmployeeCreated:', error);
    }
  });

// When an employee document is deleted
exports.onEmployeeDeleted = functions.firestore
  .document('employees/{employeeId}')
  .onDelete(async (snap, context) => {
    const employeeData = snap.data();
    
    try {
      // Delete the Firebase Auth user
      await admin.auth().deleteUser(employeeData.uid);
    } catch (error) {
      console.error('Error in onEmployeeDeleted:', error);
    }
  }); 