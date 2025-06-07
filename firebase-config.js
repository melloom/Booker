import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, increment, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
    authDomain: "booking-b1567.firebaseapp.com",
    projectId: "booking-b1567",
    storageBucket: "booking-b1567.appspot.com",
    messagingSenderId: "1027148740103",
    appId: "1:1027148740103:web:2b580beab39f01a0b6dca2",
    measurementId: "G-X1BE24TK3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics only if supported and not in Electron
let analytics = null;
if (typeof window !== 'undefined' && !window.navigator.userAgent.toLowerCase().includes('electron')) {
    isSupported().then(yes => {
        if (yes) {
            analytics = getAnalytics(app);
        }
    }).catch(error => {
        console.warn('Analytics initialization failed:', error);
    });
}

// Make Firebase functions available globally
window.auth = auth;
window.db = db;
window.collection = collection;
window.doc = doc;
window.getDoc = getDoc;
window.getDocs = getDocs;
window.addDoc = addDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;
window.query = query;
window.where = where;
window.orderBy = orderBy;
window.serverTimestamp = serverTimestamp;
window.onAuthStateChanged = onAuthStateChanged;
window.increment = increment;
window.onSnapshot = onSnapshot;
window.setDoc = setDoc;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;

// Logout function
window.logout = async () => {
    try {
        await auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

// Export all Firebase functions and instances
export {
    app,
    auth,
    db,
    analytics,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    onAuthStateChanged,
    increment,
    onSnapshot,
    setDoc,
    signInWithEmailAndPassword
}; 