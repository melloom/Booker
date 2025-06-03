import { db } from './firebase-config.js';
import { 
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
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js';

const COLLECTIONS = {
    USERS: 'users',
    BOOKINGS: 'bookings',
    CANCELLED_BOOKINGS: 'cancelledBookings',
    REGIONS: 'regions',
    TIME_SLOTS: 'timeSlots'
};

const cancellationReasons = [
    'Customer Request',
    'No Show',
    'Double Booking',
    'Technical Issue',
    'Other'
];

const collectionHelpers = {
    async getUsers() {
        const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async getBookings() {
        const snapshot = await getDocs(collection(db, COLLECTIONS.BOOKINGS));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async getRegions() {
        const snapshot = await getDocs(collection(db, COLLECTIONS.REGIONS));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    },

    async getTimeSlots() {
        const snapshot = await getDocs(collection(db, COLLECTIONS.TIME_SLOTS));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }
};

export { collectionHelpers, COLLECTIONS, cancellationReasons }; 