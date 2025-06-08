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

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  REGULAR_USERS: 'regular_users',
  MANAGERS: 'managers'
};

// Manager data
const MANAGER = {
  email: 'manager@manager.com',
  password: 'Manager@123',
  firstName: 'Manager',
  lastName: 'User',
  phone: '+14155552671',
  role: 'manager'
};

async function addManager() {
  try {
    console.log('Creating manager user...');
    
    // Create auth user
    let managerUser;
    try {
      managerUser = await auth.createUser({
        email: MANAGER.email,
        password: MANAGER.password,
        displayName: `${MANAGER.firstName} ${MANAGER.lastName}`,
        phoneNumber: MANAGER.phone
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        managerUser = await auth.getUserByEmail(MANAGER.email);
        console.log('Manager user already exists in auth');
      } else {
        throw error;
      }
    }

    // Create manager document in managers collection
    await db.collection(COLLECTIONS.MANAGERS).doc(managerUser.uid).set({
      uid: managerUser.uid,
      email: managerUser.email,
      firstName: MANAGER.firstName,
      lastName: MANAGER.lastName,
      phone: MANAGER.phone,
      role: MANAGER.role,
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

    // Create corresponding user document
    await db.collection(COLLECTIONS.USERS).doc(managerUser.uid).set({
      firstName: MANAGER.firstName,
      lastName: MANAGER.lastName,
      email: managerUser.email,
      role: MANAGER.role,
      createdAt: FieldValue.serverTimestamp(),
      lastActive: FieldValue.serverTimestamp(),
      isActive: true
    });

    // Create regular user document for manager
    await db.collection(COLLECTIONS.REGULAR_USERS).doc(managerUser.uid).set({
      uid: managerUser.uid,
      email: managerUser.email,
      firstName: MANAGER.firstName,
      lastName: MANAGER.lastName,
      role: MANAGER.role,
      createdAt: FieldValue.serverTimestamp(),
      lastActive: FieldValue.serverTimestamp(),
      isActive: true,
      preferences: {
        notifications: true,
        emailNotifications: true,
        smsNotifications: true
      }
    });

    console.log('\nManager created successfully!');
    console.log('Email:', MANAGER.email);
    console.log('Password:', MANAGER.password);
    console.log('\nPlease save these credentials securely.');

  } catch (error) {
    console.error('Error creating manager:', error);
  }
}

// Run the function
addManager(); 