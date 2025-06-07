import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { GeckoboardIntegration } from './geckoboard-integration.js';
import { SalesforceIntegration } from './salesforce-integration.js';

class IntegrationSettings {
    constructor() {
        this.geckoboard = new GeckoboardIntegration();
        this.salesforce = new SalesforceIntegration();
        this.db = getFirestore();
    }

    async loadSettings() {
        try {
            const settingsDoc = await getDoc(doc(this.db, 'settings', 'integrations'));
            if (settingsDoc.exists()) {
                const settings = settingsDoc.data();
                if (settings.geckoboard?.apiKey) {
                    await this.geckoboard.initialize(settings.geckoboard.apiKey);
                }
                if (settings.salesforce?.accessToken && settings.salesforce?.instanceUrl) {
                    await this.salesforce.initialize(settings.salesforce.accessToken, settings.salesforce.instanceUrl);
                }
                return settings;
            }
            return null;
        } catch (error) {
            console.error('Error loading integration settings:', error);
            throw error;
        }
    }

    async saveGeckoboardSettings(apiKey) {
        try {
            await this.geckoboard.initialize(apiKey);
            await setDoc(doc(this.db, 'settings', 'integrations'), {
                geckoboard: { apiKey }
            }, { merge: true });
        } catch (error) {
            console.error('Error saving Geckoboard settings:', error);
            throw error;
        }
    }

    async saveSalesforceSettings(accessToken, instanceUrl) {
        try {
            await this.salesforce.initialize(accessToken, instanceUrl);
            await setDoc(doc(this.db, 'settings', 'integrations'), {
                salesforce: { accessToken, instanceUrl }
            }, { merge: true });
        } catch (error) {
            console.error('Error saving Salesforce settings:', error);
            throw error;
        }
    }

    async testGeckoboardConnection() {
        try {
            await this.geckoboard.validateApiKey();
        } catch (error) {
            console.error('Error testing Geckoboard connection:', error);
            throw error;
        }
    }

    async testSalesforceConnection() {
        try {
            await this.salesforce.validateConnection();
        } catch (error) {
            console.error('Error testing Salesforce connection:', error);
            throw error;
        }
    }

    async syncBookingToGeckoboard(booking) {
        try {
            await this.geckoboard.pushBookingData(booking);
        } catch (error) {
            console.error('Error syncing booking to Geckoboard:', error);
            throw error;
        }
    }

    async syncBookingToSalesforce(booking) {
        try {
            await this.salesforce.createLead(booking);
        } catch (error) {
            console.error('Error syncing booking to Salesforce:', error);
            throw error;
        }
    }
}

export { IntegrationSettings }; 