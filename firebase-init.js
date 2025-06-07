import { auth, db, doc, getDoc, updateDoc, serverTimestamp, setDoc, signInWithEmailAndPassword } from './firebase-config.js';

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