import { auth } from './firebase-init.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const handleLogout = async () => {
    try {
        await signOut(auth);
        // Redirect will be handled by firebase-init.js
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

export const checkAuth = () => {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe(); // Stop listening after first check
            resolve(user);
        });
    });
}; 