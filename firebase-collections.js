import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp 
} from './firebase-config.js';

// Collection references
const usersCollection = collection(db, 'users');
const managersCollection = collection(db, 'managers');
const adminsCollection = collection(db, 'admins');

// User role types
const USER_ROLES = {
    USER: 'user',
    MANAGER: 'manager',
    ADMIN: 'admin'
};

// Firebase Collections
const COLLECTIONS = {
    USERS: 'users',
    REGULAR_USERS: 'regular_users',
    BOOKINGS: 'bookings',
    REGIONS: 'regions',
    PRODUCTS: 'products',
    TIME_SLOTS: 'time_slots',
    SETTINGS: 'settings'
};

// Make COLLECTIONS available globally
window.COLLECTIONS = COLLECTIONS;

// Function to create a new user
async function createUser(userData) {
    try {
        const userRef = doc(usersCollection, userData.uid);
        const userDoc = {
            ...userData,
            role: USER_ROLES.USER,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(userRef, userDoc);
        return userDoc;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// Function to create a new manager
async function createManager(managerData) {
    try {
        // Add to users collection
        const userRef = doc(usersCollection, managerData.uid);
        const userDoc = {
            ...managerData,
            role: USER_ROLES.MANAGER,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(userRef, userDoc);

        // Add to managers collection
        const managerRef = doc(managersCollection, managerData.uid);
        const managerDoc = {
            ...managerData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(managerRef, managerDoc);
        return managerDoc;
    } catch (error) {
        console.error('Error creating manager:', error);
        throw error;
    }
}

// Function to create a new admin
async function createAdmin(adminData) {
    try {
        // Add to users collection
        const userRef = doc(usersCollection, adminData.uid);
        const userDoc = {
            ...adminData,
            role: USER_ROLES.ADMIN,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(userRef, userDoc);

        // Add to admins collection
        const adminRef = doc(adminsCollection, adminData.uid);
        const adminDoc = {
            ...adminData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        await setDoc(adminRef, adminDoc);
        return adminDoc;
    } catch (error) {
        console.error('Error creating admin:', error);
        throw error;
    }
}

// Function to get user role
async function getUserRole(uid) {
    try {
        // First check the users collection
        const userRef = doc(usersCollection, uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            return userDoc.data().role;
        }

        // Then check admins collection
        const adminRef = doc(adminsCollection, uid);
        const adminDoc = await getDoc(adminRef);
        if (adminDoc.exists()) {
            return adminDoc.data().role;
        }

        // Then check managers collection
        const managerRef = doc(managersCollection, uid);
        const managerDoc = await getDoc(managerRef);
        if (managerDoc.exists()) {
            return managerDoc.data().role;
        }

        // Finally check regular_users collection
        const regularUserRef = doc(collection(db, 'regular_users'), uid);
        const regularUserDoc = await getDoc(regularUserRef);
        if (regularUserDoc.exists()) {
            return regularUserDoc.data().role;
        }

        return null;
    } catch (error) {
        console.error('Error getting user role:', error);
        throw error;
    }
}

// Function to get all users
async function getAllUsers() {
    try {
        const usersSnapshot = await getDocs(usersCollection);
        return usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
}

// Function to get all managers
async function getAllManagers() {
    try {
        const managersSnapshot = await getDocs(managersCollection);
        return managersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all managers:', error);
        throw error;
    }
}

// Function to get all admins
async function getAllAdmins() {
    try {
        const adminsSnapshot = await getDocs(adminsCollection);
        return adminsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all admins:', error);
        throw error;
    }
}

export {
    USER_ROLES,
    createUser,
    createManager,
    createAdmin,
    getUserRole,
    getAllUsers,
    getAllManagers,
    getAllAdmins,
    usersCollection,
    managersCollection,
    adminsCollection,
    COLLECTIONS
}; 