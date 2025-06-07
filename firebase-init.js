import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth, db, doc, getDoc, updateDoc, serverTimestamp, setDoc, signInWithEmailAndPassword } from './firebase-config.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAN7eGZ8KuVug7My2_-GPg7DC3pVPIWTo4",
    authDomain: "booking-b1567.firebaseapp.com",
    projectId: "booking-b1567",
    storageBucket: "booking-b1567.firebasestorage.app",
    messagingSenderId: "1027148740103",
    appId: "1:1027148740103:web:2b580beab39f01a0b6dca2",
    measurementId: "G-X1BE24TK3Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle initial auth state
let isInitialized = false;

// Function to handle auth state changes
const handleAuthState = (user) => {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login.html');
    const isRegisterPage = currentPath.includes('register.html');

    if (!user && !isLoginPage && !isRegisterPage) {
        // Not logged in and not on auth pages - redirect to login
        window.location.replace('/login.html');
    } else if (user && (isLoginPage || isRegisterPage)) {
        // Logged in but on auth pages - redirect to dashboard
        window.location.replace('/dashboard.html');
    }
};

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
    if (!isInitialized) {
        isInitialized = true;
        handleAuthState(user);
    }
});

// Export auth instance
export { auth };

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous error
    errorMessage.style.display = 'none';

    try {
        console.log('Starting login process...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check all collections for user role
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const regularUserDoc = await getDoc(doc(db, 'regular_users', user.uid));
        
        const timestamp = serverTimestamp();
        let userRole = 'user';
        let userData = {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            role: userRole,
            createdAt: timestamp,
            lastActive: timestamp,
            isActive: true
        };

        // Determine user role
        if (adminDoc.exists()) {
            userRole = 'admin';
            userData.role = 'admin';
        } else if (userDoc.exists()) {
            userRole = userDoc.data().role;
            userData.role = userRole;
        }

        // Update or create documents in all collections
        if (userRole === 'admin') {
            // Update admin document
            if (!adminDoc.exists()) {
                await setDoc(doc(db, 'admins', user.uid), {
                    ...userData,
                    permissions: {
                        canManageAdmins: true,
                        canManageManagers: true,
                        canManageUsers: true,
                        canManageRegions: true,
                        canManageTimeSlots: true,
                        canViewAnalytics: true
                    }
                });
            } else {
                await updateDoc(doc(db, 'admins', user.uid), {
                    lastActive: timestamp
                });
            }
        }

        // Update users collection
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), userData);
        } else {
            await updateDoc(doc(db, 'users', user.uid), {
                lastActive: timestamp,
                role: userRole
            });
        }

        // Update regular_users collection
        if (!regularUserDoc.exists()) {
            await setDoc(doc(db, 'regular_users', user.uid), userData);
        } else {
            await updateDoc(doc(db, 'regular_users', user.uid), {
                lastActive: timestamp,
                role: userRole
            });
        }

        // Redirect based on user role
        if (userRole === 'admin' || userRole === 'manager') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = 'block';
    }
}); 