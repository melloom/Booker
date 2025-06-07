import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export const handleLogout = async () => {
    const auth = getAuth();
    try {
        await signOut(auth);
        // Use replace instead of href to prevent back button issues
        window.location.replace('/login.html');
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

export const checkAuth = (auth) => {
    return new Promise((resolve) => {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.replace('/login.html');
            }
            resolve(user);
        });
    });
}; 