const admin = require('firebase-admin');
const serviceAccount = require('./booking-b1567-firebase-adminsdk-fbsvc-5d4adbdb59.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Helper function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry operations
async function retryOperation(operation, maxRetries = 3, delayMs = 10000) { // Increased to 10 seconds
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (error.code === 8 && i < maxRetries - 1) { // Quota exceeded error
                console.log(`Quota exceeded, retrying in ${delayMs/1000} seconds... (Attempt ${i + 1}/${maxRetries})`);
                console.log('Error details:', error.details);
                await delay(delayMs);
                continue;
            }
            throw error;
        }
    }
}

async function migrateManagers() {
    console.log('Starting manager migration...');
    console.log('Waiting 5 seconds before starting to ensure quota reset...');
    await delay(5000);
    
    try {
        console.log('Fetching managers from users collection...');
        // Get all users with role 'manager'
        const usersSnapshot = await retryOperation(() => 
            db.collection('users')
                .where('role', '==', 'manager')
                .get()
        );
            
        console.log(`Found ${usersSnapshot.size} managers to migrate`);
        
        // Process in smaller batches to avoid quota issues
        const batchSize = 1; // Reduced to 1
        const batches = [];
        let currentBatch = [];
        
        usersSnapshot.forEach(doc => {
            currentBatch.push(doc);
            if (currentBatch.length === batchSize) {
                batches.push([...currentBatch]);
                currentBatch = [];
            }
        });
        
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        console.log(`Processing in ${batches.length} batches of ${batchSize}`);

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`Processing batch ${i + 1}/${batches.length}`);
            
            const writeBatch = db.batch();
            
            for (const doc of batch) {
                const userData = doc.data();
                console.log(`Processing manager: ${userData.email || doc.id}`);
                
                // Create new manager document
                const managerRef = db.collection('managers').doc(doc.id);
                writeBatch.set(managerRef, {
                    ...userData,
                    migratedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Update original user document
                const userRef = db.collection('users').doc(doc.id);
                writeBatch.update(userRef, {
                    role: 'user',
                    migratedToManager: true,
                    migratedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            
            try {
                console.log(`Committing batch ${i + 1}...`);
                await retryOperation(() => writeBatch.commit());
                console.log(`Successfully processed batch ${i + 1}`);
                
                // Add longer delay between batches to avoid quota issues
                if (i < batches.length - 1) {
                    console.log('Waiting 10 seconds before next batch...');
                    await delay(10000); // Increased to 10 seconds
                }
            } catch (error) {
                console.error(`Error processing batch ${i + 1}:`, error);
                console.error('Error details:', error.details);
                // Continue with next batch even if this one failed
                continue;
            }
        }

        console.log('Manager migration completed successfully');
    } catch (error) {
        console.error('Error during manager migration:', error);
        console.error('Error details:', error.details);
        throw error;
    }
}

// Run the migration
migrateManagers()
    .then(() => {
        console.log('Migration process finished');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration failed:', error);
        console.error('Error details:', error.details);
        process.exit(1);
    }); 