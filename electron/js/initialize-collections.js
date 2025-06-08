import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));
const adminApp = initializeApp({
    credential: cert(serviceAccount)
});
const adminDb = getFirestore(adminApp);

// Test data for initialization
const testUsers = [
    {
        uid: 'user1',
        email: 'user1@example.com',
        displayName: 'Test User 1',
        phoneNumber: '+1234567890'
    },
    {
        uid: 'manager1',
        email: 'manager1@example.com',
        displayName: 'Test Manager 1',
        phoneNumber: '+1234567891'
    },
    {
        uid: 'admin1',
        email: 'admin1@example.com',
        displayName: 'Test Admin 1',
        phoneNumber: '+1234567892'
    }
];

async function initializeCollections() {
    try {
        console.log('Starting collection initialization...');

        // Create regular user
        await adminDb.collection('users').doc(testUsers[0].uid).set({
            ...testUsers[0],
            role: 'user',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Created regular user:', testUsers[0].email);

        // Create manager
        await adminDb.collection('users').doc(testUsers[1].uid).set({
            ...testUsers[1],
            role: 'manager',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Created manager:', testUsers[1].email);

        // Create admin
        await adminDb.collection('users').doc(testUsers[2].uid).set({
            ...testUsers[2],
            role: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Created admin:', testUsers[2].email);

        console.log('Collection initialization completed successfully!');
    } catch (error) {
        console.error('Error initializing collections:', error);
    }
}

// Run the initialization
initializeCollections(); 