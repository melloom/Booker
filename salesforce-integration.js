// Salesforce integration
class SalesforceIntegration {
    constructor() {
        this.accessToken = '';
        this.instanceUrl = '';
    }

    async initialize(accessToken, instanceUrl) {
        this.accessToken = accessToken;
        this.instanceUrl = instanceUrl;
    }

    async createLead(leadData) {
        try {
            const response = await fetch(`${this.instanceUrl}/services/data/v52.0/sobjects/Lead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify(leadData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating Salesforce lead:', error);
            throw error;
        }
    }
}

// Make the class available globally
window.SalesforceIntegration = SalesforceIntegration; 