import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Read and parse the service account key
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createUserDocuments() {
  try {
    console.log('Starting to create user documents...');
    
    // Get all users from Firebase Auth
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    console.log(`Found ${users.length} users in Firebase Auth`);
    
    // Process each user
    for (const user of users) {
      try {
        console.log(`\nProcessing user: ${user.email}`);
        
        // Check if user document exists in users collection
        const userDoc = await db.collection('users').doc(user.uid).get();
        const regularUserDoc = await db.collection('regular_users').doc(user.uid).get();
        
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        
        // Create base user data
        const userData = {
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || 'User',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          role: 'user',
          createdAt: timestamp,
          updatedAt: timestamp,
          lastActive: timestamp,
          isActive: true
        };

        // Create or update user document
        if (!userDoc.exists) {
          console.log('Creating user document...');
          await db.collection('users').doc(user.uid).set(userData);
        } else {
          console.log('Updating user document...');
          await db.collection('users').doc(user.uid).update({
            lastActive: timestamp,
            updatedAt: timestamp
          });
        }

        // Create or update regular_user document
        if (!regularUserDoc.exists) {
          console.log('Creating regular_user document...');
          await db.collection('regular_users').doc(user.uid).set(userData);
        } else {
          console.log('Updating regular_user document...');
          await db.collection('regular_users').doc(user.uid).update({
            lastActive: timestamp,
            updatedAt: timestamp
          });
        }

        // Create user preferences if they don't exist
        const preferencesDoc = await db.collection('userPreferences').doc(user.uid).get();
        if (!preferencesDoc.exists) {
          console.log('Creating user preferences...');
          await db.collection('userPreferences').doc(user.uid).set({
            emailNotifications: true,
            smsNotifications: false,
            theme: 'light',
            language: 'en',
            createdAt: timestamp,
            updatedAt: timestamp
          });
        }

        console.log(`Successfully processed user: ${user.email}`);
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
      }
    }
    
    console.log('\nFinished processing all users');
  } catch (error) {
    console.error('Error creating user documents:', error);
  }
}

// Run the script
createUserDocuments(); 