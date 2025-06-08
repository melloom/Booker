// Geckoboard Integration Module
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

// Geckoboard configuration
let geckoboardConfig = {
    apiKey: '',
    isConnected: false
};

// Function to save Geckoboard settings
export async function saveGeckoboardSettings(apiKey) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // Update the user's document with Geckoboard settings
        await updateDoc(doc(db, 'users', user.uid), {
            'integrations.geckoboard': {
                apiKey,
                isConnected: true,
                lastUpdated: new Date()
            }
        });

        // Update local config
        geckoboardConfig = {
            apiKey,
            isConnected: true
        };

        return true;
    } catch (error) {
        console.error('Error saving Geckoboard settings:', error);
        throw error;
    }
}

// Function to test Geckoboard connection
export async function testGeckoboardConnection() {
    try {
        if (!geckoboardConfig.apiKey) {
            throw new Error('Geckoboard API key is not set');
        }

        // Test the connection by making a simple API call
        const response = await fetch('https://api.geckoboard.com/datasets', {
            headers: {
                'Authorization': `Basic ${btoa(geckoboardConfig.apiKey + ':')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to connect to Geckoboard');
        }

        return true;
    } catch (error) {
        console.error('Error testing Geckoboard connection:', error);
        throw error;
    }
}

// Function to disconnect Geckoboard
export async function disconnectGeckoboard() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // Remove Geckoboard settings from user's document
        await updateDoc(doc(db, 'users', user.uid), {
            'integrations.geckoboard': null
        });

        // Reset local config
        geckoboardConfig = {
            apiKey: '',
            isConnected: false
        };

        return true;
    } catch (error) {
        console.error('Error disconnecting Geckoboard:', error);
        throw error;
    }
}

// Function to get Geckoboard connection status
export function getGeckoboardStatus() {
    return {
        isConnected: geckoboardConfig.isConnected
    };
}

// Function to initialize Geckoboard integration
export async function initializeGeckoboard() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.integrations?.geckoboard) {
                geckoboardConfig = {
                    apiKey: userData.integrations.geckoboard.apiKey,
                    isConnected: userData.integrations.geckoboard.isConnected
                };
            }
        }
    } catch (error) {
        console.error('Error initializing Geckoboard:', error);
    }
}

// Function to push data to Geckoboard
export async function pushDataToGeckoboard(datasetId, data) {
    try {
        if (!geckoboardConfig.isConnected) {
            throw new Error('Geckoboard is not connected');
        }

        const response = await fetch(`https://api.geckoboard.com/datasets/${datasetId}/data`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(geckoboardConfig.apiKey + ':')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: data
            })
        });

        if (!response.ok) {
            throw new Error('Failed to push data to Geckoboard');
        }

        return true;
    } catch (error) {
        console.error('Error pushing data to Geckoboard:', error);
        throw error;
    }
} 