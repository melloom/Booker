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
  ADMINS: 'admins',
  MANAGERS: 'managers',
  REGIONS: 'regions',
  TIME_SLOTS: 'time_slots',
  BOOKINGS: 'bookings',
  CANCELLED_BOOKINGS: 'cancelledBookings',
  SETTINGS: 'settings'
};

// Region data
const REGIONS = [
  {name: "MIDA", subtitle: "DC, Virginia, Maryland"},
  {name: "SOPA", subtitle: "Southern Pennsylvania"},
  {name: "Southern Virginia", subtitle: "Southern Virginia"},
  {name: "Florida", subtitle: ""},
  {name: "New England", subtitle: "Massachusetts & Rhode Island"},
  {name: "Connecticut", subtitle: ""}
];

// Time slot data
const TIME_SLOTS = [
  {time: "10:00 AM", duration: 60, day: "Monday"},
  {time: "2:00 PM", duration: 60, day: "Monday"},
  {time: "6:00 PM", duration: 60, day: "Monday"},
  {time: "10:00 AM", duration: 60, day: "Tuesday"},
  {time: "2:00 PM", duration: 60, day: "Tuesday"},
  {time: "6:00 PM", duration: 60, day: "Tuesday"},
  {time: "10:00 AM", duration: 60, day: "Wednesday"},
  {time: "2:00 PM", duration: 60, day: "Wednesday"},
  {time: "6:00 PM", duration: 60, day: "Wednesday"},
  {time: "10:00 AM", duration: 60, day: "Thursday"},
  {time: "2:00 PM", duration: 60, day: "Thursday"},
  {time: "6:00 PM", duration: 60, day: "Thursday"},
  {time: "10:00 AM", duration: 60, day: "Friday"},
  {time: "2:00 PM", duration: 60, day: "Friday"},
  {time: "6:00 PM", duration: 60, day: "Friday"}
];

// Days of the week
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Products
const PRODUCTS = ["Bathrooms", "Roofing"];

// User data
const USERS = {
  admin: {
    email: 'admin@admin.com',
    password: 'Admin@123',
    displayName: 'Admin User',
    role: 'admin'
  },
  manager: {
    email: 'manager@manager.com',
    password: 'Manager@123',
    displayName: 'Manager User',
    role: 'manager'
  },
  regular: [
    {
      email: 'user1@example.com',
      password: 'User@123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+14155552671'
    },
    {
      email: 'user2@example.com',
      password: 'User@123',
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+447911123456'
    },
    {
      email: 'user3@example.com',
      password: 'User@123',
      firstName: 'Mike',
      lastName: 'Johnson',
      phone: '+61412345678'
    }
  ]
};

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Deleted collection: ${collectionName}`);
}

async function initializeAll() {
  try {
    console.log('Starting complete database initialization...');

    // Delete all existing collections
    console.log('\nDeleting existing collections...');
    for (const collection of Object.values(COLLECTIONS)) {
      await deleteCollection(collection);
    }

    // Initialize admin user
    console.log('\nInitializing admin user...');
    let adminUser;
    try {
      adminUser = await auth.createUser({
        email: USERS.admin.email,
        password: USERS.admin.password,
        displayName: USERS.admin.displayName
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        adminUser = await auth.getUserByEmail(USERS.admin.email);
      } else {
        throw error;
      }
    }

    await db.collection(COLLECTIONS.ADMINS).doc(adminUser.uid).set({
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
    });

    // Initialize manager user
    console.log('\nInitializing manager user...');
    let managerUser;
    try {
      managerUser = await auth.createUser({
        email: USERS.manager.email,
        password: USERS.manager.password,
        displayName: USERS.manager.displayName
      });
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        managerUser = await auth.getUserByEmail(USERS.manager.email);
      } else {
        throw error;
      }
    }

    await db.collection(COLLECTIONS.MANAGERS).doc(managerUser.uid).set({
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

    // Initialize regular users
    console.log('\nInitializing regular users...');
    for (const userData of USERS.regular) {
      let user;
      try {
        user = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: `${userData.firstName} ${userData.lastName}`
        });
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          user = await auth.getUserByEmail(userData.email);
        } else {
          throw error;
        }
      }

      await db.collection(COLLECTIONS.REGULAR_USERS).doc(user.uid).set({
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: 'user',
        createdAt: FieldValue.serverTimestamp(),
        lastActive: FieldValue.serverTimestamp(),
        isActive: true,
        preferences: {
          notifications: true,
          emailNotifications: true,
          smsNotifications: true
        }
      });
    }

    // Initialize regions
    console.log('\nInitializing regions...');
    for (const region of REGIONS) {
      await db.collection(COLLECTIONS.REGIONS).add({
        ...region,
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Initialize time slots
    console.log('\nInitializing time slots...');
    for (const region of REGIONS) {
      for (const product of PRODUCTS) {
        for (const day of DAYS_OF_WEEK) {
          for (const slot of TIME_SLOTS.filter(s => s.day === day)) {
            const regionName = region.name.toLowerCase().replace(/\s+/g, '-');
            await db.collection(COLLECTIONS.TIME_SLOTS).add({
              region: region.name,
              regionId: regionName,
              product: product,
              time: slot.time,
              duration: slot.duration,
              day: day,
              maxSlots: 4,
              availableSlots: 4,
              isActive: true,
              createdAt: FieldValue.serverTimestamp(),
              lastModified: FieldValue.serverTimestamp()
            });
          }
        }
      }
    }

    console.log('\nDatabase initialization completed successfully!');
    console.log('\nUser credentials:');
    console.log('\nAdmin:');
    console.log('Email:', USERS.admin.email);
    console.log('Password:', USERS.admin.password);
    console.log('\nManager:');
    console.log('Email:', USERS.manager.email);
    console.log('Password:', USERS.manager.password);
    console.log('\nRegular Users:');
    USERS.regular.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('Email:', user.email);
      console.log('Password:', user.password);
    });
    console.log('\nPlease ask users to change their passwords after first login!');

  } catch (error) {
    console.error('Error during initialization:', error);
  } finally {
    process.exit();
  }
}

initializeAll(); 