import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();
const auth = getAuth();

async function initializeManagers() {
  try {
    // Get all existing managers
    const managersSnapshot = await db.collection('managers').get();
    
    // Delete existing managers from Auth and Firestore
    const batch = db.batch();
    for (const doc of managersSnapshot.docs) {
      try {
        // Delete from Auth if it's a valid UID
        if (doc.id.length === 28) { // Firebase UIDs are 28 characters
          await auth.deleteUser(doc.id);
          console.log('Deleted manager user from Auth:', doc.id);
        }
        batch.delete(doc.ref);
        batch.delete(db.collection('users').doc(doc.id));
      } catch (error) {
        console.log('Error deleting manager:', error.message);
      }
    }
    
    await batch.commit();
    console.log('Deleted existing managers collection');

    // Create new manager user
    const managerUser = await auth.createUser({
      email: 'manager@manager.com',
      password: 'Manager@123',
      displayName: 'Manager User'
    });
    console.log('Created new manager user:', managerUser.uid);

    // Create manager document with sequential ID
    await db.collection('managers').doc('manager1').set({
      uid: managerUser.uid, // Store the actual UID in the document
      email: managerUser.email,
      displayName: managerUser.displayName,
      role: 'manager',
      permissions: {
        canManageUsers: true,
        canManageRegions: true,
        canManageTimeSlots: true,
        canViewAnalytics: true
      },
      createdAt: FieldValue.serverTimestamp(),
      lastActive: FieldValue.serverTimestamp(),
      isActive: true
    });

    // Create corresponding user document with sequential ID
    await db.collection('users').doc('manager1').set({
      uid: managerUser.uid, // Store the actual UID in the document
      firstName: 'Manager',
      lastName: 'User',
      email: managerUser.email,
      role: 'manager',
      createdAt: FieldValue.serverTimestamp(),
      lastActive: FieldValue.serverTimestamp(),
      isActive: true
    });

    console.log('Manager collection initialized successfully');
    console.log('\nManager credentials:');
    console.log('Email:', managerUser.email);
    console.log('Password: Manager@123');
    console.log('\nPlease change the password after first login!');

  } catch (error) {
    console.error('Error initializing managers:', error);
  } finally {
    process.exit();
  }
}

initializeManagers(); 