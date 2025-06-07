// Salesforce Integration Module
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

// Salesforce configuration
let salesforceConfig = {
    accessToken: '',
    instanceUrl: '',
    isConnected: false
};

// Function to save Salesforce settings
export async function saveSalesforceSettings(accessToken, instanceUrl) {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // Update the user's document with Salesforce settings
        await updateDoc(doc(db, 'users', user.uid), {
            'integrations.salesforce': {
                accessToken,
                instanceUrl,
                isConnected: true,
                lastUpdated: new Date()
            }
        });

        // Update local config
        salesforceConfig = {
            accessToken,
            instanceUrl,
            isConnected: true
        };

        return true;
    } catch (error) {
        console.error('Error saving Salesforce settings:', error);
        throw error;
    }
}

// Function to test Salesforce connection
export async function testSalesforceConnection() {
    try {
        if (!salesforceConfig.accessToken || !salesforceConfig.instanceUrl) {
            throw new Error('Salesforce configuration is incomplete');
        }

        // Test the connection by making a simple API call
        const response = await fetch(`${salesforceConfig.instanceUrl}/services/data/v52.0/sobjects`, {
            headers: {
                'Authorization': `Bearer ${salesforceConfig.accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to connect to Salesforce');
        }

        return true;
    } catch (error) {
        console.error('Error testing Salesforce connection:', error);
        throw error;
    }
}

// Function to disconnect Salesforce
export async function disconnectSalesforce() {
    try {
        const user = auth.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        // Remove Salesforce settings from user's document
        await updateDoc(doc(db, 'users', user.uid), {
            'integrations.salesforce': null
        });

        // Reset local config
        salesforceConfig = {
            accessToken: '',
            instanceUrl: '',
            isConnected: false
        };

        return true;
    } catch (error) {
        console.error('Error disconnecting Salesforce:', error);
        throw error;
    }
}

// Function to get Salesforce connection status
export function getSalesforceStatus() {
    return {
        isConnected: salesforceConfig.isConnected,
        instanceUrl: salesforceConfig.instanceUrl
    };
}

// Function to initialize Salesforce integration
export async function initializeSalesforce() {
    try {
        const user = auth.currentUser;
        if (!user) {
            return;
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.integrations?.salesforce) {
                salesforceConfig = {
                    accessToken: userData.integrations.salesforce.accessToken,
                    instanceUrl: userData.integrations.salesforce.instanceUrl,
                    isConnected: userData.integrations.salesforce.isConnected
                };
            }
        }
    } catch (error) {
        console.error('Error initializing Salesforce:', error);
    }
} 