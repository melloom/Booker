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

async function initializeUsers() {
  try {
    // Get all existing regular users
    const usersSnapshot = await db.collection('regular_users').get();
    
    // Delete existing users from Auth and Firestore
    const batch = db.batch();
    for (const doc of usersSnapshot.docs) {
      try {
        // Delete from Auth if it's a valid UID
        if (doc.id.length === 28) { // Firebase UIDs are 28 characters
          await auth.deleteUser(doc.id);
          console.log('Deleted user from Auth:', doc.id);
        }
        batch.delete(doc.ref);
        batch.delete(db.collection('users').doc(doc.id));
      } catch (error) {
        console.log('Error deleting user:', error.message);
      }
    }
    
    await batch.commit();
    console.log('Deleted existing regular users collection');

    // Create sample regular users
    const sampleUsers = [
      {
        email: 'user1@example.com',
        password: 'User@123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+14155552671' // US format
      },
      {
        email: 'user2@example.com',
        password: 'User@123',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+447911123456' // UK format
      },
      {
        email: 'user3@example.com',
        password: 'User@123',
        firstName: 'Mike',
        lastName: 'Johnson',
        phone: '+61412345678' // Australian format
      }
    ];

    for (let i = 0; i < sampleUsers.length; i++) {
      const userData = sampleUsers[i];
      const userId = `user${i + 1}`;

      // Create user in Auth
      const user = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: `${userData.firstName} ${userData.lastName}`
        // Removed phoneNumber as it's optional and can be added later
      });
      console.log(`Created user ${userId}:`, user.uid);

      // Create regular user document
      await db.collection('regular_users').doc(userId).set({
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

      // Create corresponding user document
      await db.collection('users').doc(userId).set({
        uid: user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'user',
        createdAt: FieldValue.serverTimestamp(),
        lastActive: FieldValue.serverTimestamp(),
        isActive: true
      });
    }

    console.log('\nRegular users initialized successfully');
    console.log('\nUser credentials:');
    sampleUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('Email:', user.email);
      console.log('Password: User@123');
    });
    console.log('\nPlease ask users to change their passwords after first login!');

  } catch (error) {
    console.error('Error initializing users:', error);
  } finally {
    process.exit();
  }
}

initializeUsers(); 