import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
  authDomain: "booking-b1567.firebaseapp.com",
  projectId: "booking-b1567",
  storageBucket: "booking-b1567.firebasestorage.app",
  messagingSenderId: "1027148740103",
  appId: "1:1027148740103:web:6624959d0dd09527b6dca2",
  measurementId: "G-GKTL2B6S3Y"
};

// Create a function to initialize Firebase
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (getApps().length === 0) {
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      
      // Initialize services
      const auth = getAuth(app);
      const db = getFirestore(app);
      const analytics = getAnalytics(app);
      
      // Set persistence
      setPersistence(auth, browserLocalPersistence);
      
      return { app, auth, db, analytics };
    } else {
      // Get existing Firebase instance
      const app = getApp();
      
      // Initialize services with existing app
      const auth = getAuth(app);
      const db = getFirestore(app);
      const analytics = getAnalytics(app);
      
      return { app, auth, db, analytics };
    }
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
}

// Initialize Firebase and export services
const { auth, db, analytics } = initializeFirebase();

export { auth, db, analytics }; 