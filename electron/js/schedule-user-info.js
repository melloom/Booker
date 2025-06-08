import { auth, db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Function to update user information in header
async function updateHeaderUserInfo() {
    try {
        const user = auth.currentUser;
        if (!user) {
            console.error('No user logged in');
            return;
        }

        // Try to get user from admins collection first
        let userDoc = await getDoc(doc(db, 'admins', user.uid));
        let userData;
        
        // If not found in admins, try regular_users collection
        if (!userDoc.exists()) {
            userDoc = await getDoc(doc(db, 'regular_users', user.uid));
        }
        
        // If not found in regular_users, try users collection
        if (!userDoc.exists()) {
            userDoc = await getDoc(doc(db, 'users', user.uid));
        }

        if (!userDoc.exists()) {
            console.error('User document not found in any collection');
            return;
        }

        userData = userDoc.data();
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        // Set user avatar with initial
        if (userAvatar) {
            const initial = userData.firstName ? userData.firstName[0].toUpperCase() : user.email[0].toUpperCase();
            userAvatar.textContent = initial;
        }

        // Set user name
        if (userName) {
            userName.textContent = `${userData.firstName} ${userData.lastName}`;
        }

        // Set user role with proper styling
        if (userRole) {
            userRole.textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
            userRole.className = `user-role ${userData.role}`;
        }
    } catch (error) {
        console.error('Error updating header user info:', error);
    }
}

// Initialize user info when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is authenticated
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            await updateHeaderUserInfo();
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Export the function for use in other files
export { updateHeaderUserInfo }; 