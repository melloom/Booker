// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js';

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
const db = getFirestore(app);
const auth = getAuth(app);

// Export Firebase instances and functions
export { 
    db, 
    auth,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp,
    onSnapshot
}; 