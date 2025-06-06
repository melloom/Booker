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

async function initializeAdmin() {
  try {
    let adminUser;
    
    try {
      // Try to create a new admin user
      adminUser = await auth.createUser({
        email: 'admin@admin.com',
        password: 'Admin@123',
        displayName: 'Admin User'
      });
      console.log('Created new admin user:', adminUser.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        // If user exists, get the existing user
        adminUser = await auth.getUserByEmail('admin@admin.com');
        console.log('Using existing admin user:', adminUser.uid);
      } else {
        throw error;
      }
    }

    // Create or update admin document in admins collection
    await db.collection('admins').doc(adminUser.uid).set({
      email: adminUser.email,
      displayName: adminUser.displayName,
      role: 'admin',
      permissions: {
        canManageAdmins: true,
        canManageManagers: true,
        canManageUsers: true,
        canManageRegions: true,
        canManageTimeSlots: true,
        canViewAnalytics: true
      },
      createdAt: FieldValue.serverTimestamp(),
      lastActive: FieldValue.serverTimestamp(),
      isActive: true
    }, { merge: true });

    // Create or update corresponding user document
    await db.collection('users').doc(adminUser.uid).set({
      firstName: 'Admin',
      lastName: 'User',
      email: adminUser.email,
      role: 'admin',
      createdAt: FieldValue.serverTimestamp(),
      lastActive: FieldValue.serverTimestamp(),
      isActive: true
    }, { merge: true });

    console.log('Admin collection initialized successfully');
    console.log('\nAdmin credentials:');
    console.log('Email:', adminUser.email);
    console.log('Password: Admin@123');
    console.log('\nPlease change the password after first login!');

  } catch (error) {
    console.error('Error initializing admin:', error);
  } finally {
    process.exit();
  }
}

initializeAdmin(); 