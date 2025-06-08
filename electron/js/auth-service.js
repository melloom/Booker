import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
    const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));
    initializeApp({
        credential: cert(serviceAccount)
    });
}

const adminAuth = getAuth();

// Function to verify user credentials
export async function verifyUserCredentials(email, password) {
    try {
        // Get user by email
        const userRecord = await adminAuth.getUserByEmail(email);
        
        // Verify the password
        const signInResult = await adminAuth.verifyIdToken(userRecord.uid);
        
        if (signInResult) {
            return {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                photoURL: userRecord.photoURL
            };
        }
        return null;
    } catch (error) {
        console.error('Error verifying credentials:', error);
        throw error;
    }
}

// Function to create a custom token
export async function createCustomToken(uid) {
    try {
        return await adminAuth.createCustomToken(uid);
    } catch (error) {
        console.error('Error creating custom token:', error);
        throw error;
    }
}

// Function to verify a custom token
export async function verifyCustomToken(token) {
    try {
        return await adminAuth.verifyIdToken(token);
    } catch (error) {
        console.error('Error verifying custom token:', error);
        throw error;
    }
} 