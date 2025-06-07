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
        
        // Check if user document exists in users collection
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const regularUserDoc = await getDoc(doc(db, 'regular_users', user.uid));
        
        const timestamp = serverTimestamp();
        const userData = {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
            role: 'user',
            createdAt: timestamp,
            lastActive: timestamp,
            isActive: true
        };

        // Create or update user document
        if (!userDoc.exists()) {
            console.log('Creating user document...');
            await setDoc(doc(db, 'users', user.uid), userData);
        } else {
            console.log('Updating user document...');
            await updateDoc(doc(db, 'users', user.uid), {
                lastActive: timestamp
            });
        }

        // Create or update regular_user document
        if (!regularUserDoc.exists()) {
            console.log('Creating regular_user document...');
            await setDoc(doc(db, 'regular_users', user.uid), userData);
        } else {
            console.log('Updating regular_user document...');
            await updateDoc(doc(db, 'regular_users', user.uid), {
                lastActive: timestamp
            });
        }

        // Redirect based on user role
        const userRole = userDoc.exists() ? userDoc.data().role : 'user';
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