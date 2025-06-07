import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

// Collection names
const COLLECTIONS = {
  REGIONS: 'regions',
  TIME_SLOTS: 'time_slots'
};

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
  {time: "6:00 PM", duration: 60, day: "Friday"}
];

async function addTimeSlots() {
  try {
    console.log('Starting to add time slots...');

    // Get existing regions
    const regionsSnapshot = await db.collection(COLLECTIONS.REGIONS).get();
    if (regionsSnapshot.empty) {
      console.log('No regions found. Please create regions first.');
      return;
    }

    // Add time slots for each region
    for (const regionDoc of regionsSnapshot.docs) {
      const region = regionDoc.data();
      console.log(`Adding time slots for region: ${region.name}`);

      // Check if time slots already exist for this region
      const existingSlots = await db.collection(COLLECTIONS.TIME_SLOTS)
        .where('regionId', '==', regionDoc.id)
        .get();

      if (!existingSlots.empty) {
        console.log(`Time slots already exist for region: ${region.name}`);
        continue;
      }

      // Create time slots for this region
      for (const slot of TIME_SLOTS) {
        await db.collection(COLLECTIONS.TIME_SLOTS).add({
          regionId: regionDoc.id,
          region: region.name,
          day: slot.day,
          time: slot.time,
          duration: slot.duration,
          maxSlots: 5,
          availableSlots: 5,
          isAvailable: true,
          createdAt: FieldValue.serverTimestamp()
        });
      }
      console.log(`Added time slots for region: ${region.name}`);
    }

    console.log('Time slots added successfully!');
  } catch (error) {
    console.error('Error adding time slots:', error);
  }
}

// Run the function
addTimeSlots(); 