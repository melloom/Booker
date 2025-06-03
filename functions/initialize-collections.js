const admin = require("firebase-admin");

// Initialize Firebase Admin with project ID
admin.initializeApp({
  projectId: "booking-b1567",
});

const db = admin.firestore();

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
  {name: "SOVAS", subtitle: "Southern Virginia"},
  {name: "Florida", subtitle: ""},
  {name: "Massachusetts", subtitle: ""},
  {name: "Rhode Island", subtitle: ""},
  {name: "Connecticut", subtitle: ""},
];

// Time slot data
const TIME_SLOTS = [
  {time: "10:00 AM", duration: 60, day: "Monday"},
  {time: "2:00 PM", duration: 60, day: "Monday"},
  {time: "6:00 PM", duration: 60, day: "Monday"},
  {time: "10:00 AM", duration: 60, day: "Tuesday"},
  {time: "2:00 PM", duration: 60, day: "Tuesday"},
  {time: "6:00 PM", duration: 60, day: "Tuesday"},
  {time: "10:00 AM", duration: 60, day: "Wednesday"},
  {time: "2:00 PM", duration: 60, day: "Wednesday"},
  {time: "6:00 PM", duration: 60, day: "Wednesday"},
  {time: "10:00 AM", duration: 60, day: "Thursday"},
  {time: "2:00 PM", duration: 60, day: "Thursday"},
  {time: "6:00 PM", duration: 60, day: "Thursday"},
  {time: "10:00 AM", duration: 60, day: "Friday"},
  {time: "2:00 PM", duration: 60, day: "Friday"},
  {time: "6:00 PM", duration: 60, day: "Friday"},
];

// Days of the week
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Products
const PRODUCTS = ["Bathrooms", "Roofing"];

/**
 * Initializes Firestore collections for the appointment scheduler app.
 * Deletes existing data and sets up regions, time slots, and manager structure.
 */
// Initialize collections
async function initializeCollections() {
    try {
    // Delete existing data
    console.log("Deleting existing data...");

    // Delete regions
    const regionsSnapshot = await db.collection(COLLECTIONS.REGIONS).get();
    const deleteRegionsPromises = regionsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deleteRegionsPromises);
    console.log("Existing regions deleted");

    // Delete time slots
    const timeSlotsSnapshot = await db.collection(COLLECTIONS.TIME_SLOTS).get();
    const deleteTimeSlotsPromises = timeSlotsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deleteTimeSlotsPromises);
    console.log("Existing time slots deleted");

        // Initialize regions
    console.log("Initializing regions...");
    const addRegionsPromises = REGIONS.map((region) =>
      db.collection(COLLECTIONS.REGIONS).add({
                    ...region,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    );
    await Promise.all(addRegionsPromises);
    console.log("Regions initialized successfully");

    // Initialize time slots for each region, product, and day
    console.log("Initializing time slots...");
    const addTimeSlotsPromises = [];
            for (const region of REGIONS) {
                for (const product of PRODUCTS) {
        for (const day of DAYS_OF_WEEK) {
          for (const slot of TIME_SLOTS.filter((s) => s.day === day)) {
            addTimeSlotsPromises.push(
                db.collection(COLLECTIONS.TIME_SLOTS).add({
                            region: region.name,
                            product: product,
                            time: slot.time,
                            duration: slot.duration,
                  day: day,
                            maxSlots: 4,
                            availableSlots: 4,
                  isActive: true,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  lastModified: admin.firestore.FieldValue.serverTimestamp(),
                }),
            );
                    }
                }
            }
    }
    await Promise.all(addTimeSlotsPromises);
    console.log("Time slots initialized successfully");

    console.log("All collections initialized successfully");
    } catch (error) {
    console.error("Error initializing collections:", error);
        throw error;
    }
}

// Run the initialization
initializeCollections()
    .then(() => {
      console.log("Initialization complete");
        process.exit(0);
    })
    .catch((error) => {
      console.error("Initialization failed:", error);
        process.exit(1);
    }); 
