import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize Firebase Admin with service account
const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json'));
const adminApp = initializeApp({
    credential: cert(serviceAccount)
});
const adminDb = getFirestore(adminApp);

// Collection names
const COLLECTIONS = {
    REGIONS: "regions",
    TIME_SLOTS: "timeSlots",
    BOOKINGS: "bookings",
    CANCELLED_BOOKINGS: "cancelledBookings",
    USERS: "users",
};

// Region data
const REGIONS = [
    {name: "MIDA", subtitle: "DC, Virginia, Maryland"},
    {name: "SOPA", subtitle: "Southern Pennsylvania"},
    {name: "Southern Virginia", subtitle: "Southern Virginia"},
    {name: "Florida", subtitle: ""},
    {name: "New England", subtitle: "Massachusetts & Rhode Island"},
    {name: "Connecticut", subtitle: ""}
];

// Time slot data
const TIME_SLOTS = [
    {time: "10:00 AM", duration: 60},
    {time: "2:00 PM", duration: 60},
    {time: "6:00 PM", duration: 60}
];

// Days of the week
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Products
const PRODUCTS = ["Bathrooms", "Roofing"];

/**
 * Generates time slots for the next 30 days
 * @returns {Array} Array of time slot objects with dates
 */
function generateTimeSlotsForNext30Days() {
    const timeSlots = [];
    const today = new Date();
    
    // Generate slots for next 30 days
    for (let i = 0; i < 30; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        
        // Skip weekends
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
        
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const formattedDate = currentDate.toISOString().split('T')[0];
        
        // Create time slots for each time in TIME_SLOTS
        TIME_SLOTS.forEach(slot => {
            timeSlots.push({
                ...slot,
                day: dayName,
                date: formattedDate,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });
    }
    
    return timeSlots;
}

/**
 * Initializes Firestore collections for the appointment scheduler app.
 * Deletes existing data and sets up regions, time slots, and manager structure.
 */
async function initializeCollections() {
    try {
        console.log("Starting collection initialization...");

        // Delete existing data
        console.log("Deleting existing data...");

        // Delete regions
        const regionsSnapshot = await adminDb.collection(COLLECTIONS.REGIONS).get();
        const deleteRegionsPromises = regionsSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteRegionsPromises);
        console.log("Existing regions deleted");

        // Delete time slots
        const timeSlotsSnapshot = await adminDb.collection(COLLECTIONS.TIME_SLOTS).get();
        const deleteTimeSlotsPromises = timeSlotsSnapshot.docs.map((doc) => doc.ref.delete());
        await Promise.all(deleteTimeSlotsPromises);
        console.log("Existing time slots deleted");

        // Initialize regions
        console.log("Initializing regions...");
        const addRegionsPromises = REGIONS.map((region) =>
            adminDb.collection(COLLECTIONS.REGIONS).add({
                ...region,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        );
        await Promise.all(addRegionsPromises);
        console.log("Regions initialized successfully");

        // Initialize time slots for next 30 days
        console.log("Initializing time slots...");
        const timeSlots = generateTimeSlotsForNext30Days();
        const addTimeSlotsPromises = timeSlots.map(slot =>
            adminDb.collection(COLLECTIONS.TIME_SLOTS).add(slot)
        );
        await Promise.all(addTimeSlotsPromises);
        console.log("Time slots initialized successfully");

        console.log("Collection initialization completed successfully!");
    } catch (error) {
        console.error("Error initializing collections:", error);
    }
}

// Run the initialization
initializeCollections(); 