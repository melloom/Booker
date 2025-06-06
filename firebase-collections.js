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
const timeSlotsCollection = collection(db, 'timeSlots');
const bookingsCollection = collection(db, 'bookings');

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
    TIME_SLOTS: 'timeSlots',
    SETTINGS: 'settings'
};

// Make COLLECTIONS available globally
window.COLLECTIONS = COLLECTIONS;

// Function to get time slots for a specific date
async function getTimeSlotsForDate(date) {
    try {
        const timeSlotsQuery = query(
            timeSlotsCollection,
            where('date', '==', date),
            where('isActive', '==', true)
        );
        const timeSlotsSnapshot = await getDocs(timeSlotsQuery);
        return timeSlotsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting time slots:', error);
        throw error;
    }
}

// Function to get time slots for a specific day of the week
async function getTimeSlotsForDay(dayName) {
    try {
        const timeSlotsQuery = query(
            timeSlotsCollection,
            where('day', '==', dayName),
            where('isActive', '==', true)
        );
        const timeSlotsSnapshot = await getDocs(timeSlotsQuery);
        return timeSlotsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting time slots:', error);
        throw error;
    }
}

// Function to create a booking
async function createBooking(bookingData) {
    try {
        const bookingRef = doc(bookingsCollection);
        const booking = {
            ...bookingData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'confirmed'
        };
        await setDoc(bookingRef, booking);
        return booking;
    } catch (error) {
        console.error('Error creating booking:', error);
        throw error;
    }
}

// Function to update a time slot's availability
async function updateTimeSlotAvailability(timeSlotId, isBooked) {
    try {
        const timeSlotRef = doc(timeSlotsCollection, timeSlotId);
        await setDoc(timeSlotRef, {
            isBooked,
            updatedAt: serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error updating time slot:', error);
        throw error;
    }
}

// Function to get all regions
async function getRegions() {
    try {
        const regionsSnapshot = await getDocs(collection(db, COLLECTIONS.REGIONS));
        return regionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting regions:', error);
        throw error;
    }
}

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
    COLLECTIONS,
    getTimeSlotsForDate,
    getTimeSlotsForDay,
    createBooking,
    updateTimeSlotAvailability,
    getRegions
}; 