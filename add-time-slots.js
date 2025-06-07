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

// Time slot data
const TIME_SLOTS = [
  {time: "10:00 AM", duration: 60},
  {time: "2:00 PM", duration: 60},
  {time: "6:00 PM", duration: 60}
];

// Products
const PRODUCTS = ["Bathrooms", "Roofing"];

// Regions
const REGIONS = [
  {name: "MIDA", subtitle: "DC, Virginia, Maryland"},
  {name: "SOPA", subtitle: "Southern Pennsylvania"},
  {name: "Southern Virginia", subtitle: "Southern Virginia"},
  {name: "Florida", subtitle: ""},
  {name: "New England", subtitle: "Massachusetts & Rhode Island"},
  {name: "Connecticut", subtitle: ""}
];

async function addTimeSlots() {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const days = [
      { date: today, name: today.toLocaleDateString('en-US', { weekday: 'long' }) },
      { date: tomorrow, name: tomorrow.toLocaleDateString('en-US', { weekday: 'long' }) }
    ];

    for (const day of days) {
      for (const region of REGIONS) {
        for (const product of PRODUCTS) {
          for (const slot of TIME_SLOTS) {
            const regionName = region.name.toLowerCase().replace(/\s+/g, '-');
            
            // Check if time slot already exists
            const existingSlots = await db.collection('time_slots')
              .where('day', '==', day.name)
              .where('region', '==', region.name)
              .where('product', '==', product)
              .where('time', '==', slot.time)
              .get();

            if (existingSlots.empty) {
              await db.collection('time_slots').add({
                region: region.name,
                regionId: regionName,
                product: product,
                time: slot.time,
                duration: slot.duration,
                day: day.name,
                maxSlots: 4,
                availableSlots: 4,
                isActive: true,
                createdAt: FieldValue.serverTimestamp(),
                lastModified: FieldValue.serverTimestamp()
              });
              console.log(`Added time slot for ${day.name} at ${slot.time} for ${region.name} - ${product}`);
            } else {
              console.log(`Time slot already exists for ${day.name} at ${slot.time} for ${region.name} - ${product}`);
            }
          }
        }
      }
    }

    console.log('Time slots added successfully!');
  } catch (error) {
    console.error('Error adding time slots:', error);
  } finally {
    process.exit();
  }
}

addTimeSlots(); 