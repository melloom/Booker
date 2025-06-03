// Salesforce Integration
class SalesforceIntegration {
    constructor() {
        this.accessToken = '';
        this.instanceUrl = '';
        this.baseUrl = '';
    }

    async initialize(clientId, clientSecret, username, password) {
        try {
            const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'password',
                    client_id: clientId,
                    client_secret: clientSecret,
                    username: username,
                    password: password
                })
            });

            const data = await response.json();
            this.accessToken = data.access_token;
            this.instanceUrl = data.instance_url;
            this.baseUrl = `${this.instanceUrl}/services/data/v52.0`;
            return true;
        } catch (error) {
            console.error('Salesforce initialization failed:', error);
            return false;
        }
    }

    async createLead(leadData) {
        try {
            const response = await fetch(`${this.baseUrl}/sobjects/Lead`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leadData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating Salesforce lead:', error);
            throw error;
        }
    }

    async createOpportunity(opportunityData) {
        try {
            const response = await fetch(`${this.baseUrl}/sobjects/Opportunity`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(opportunityData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating Salesforce opportunity:', error);
            throw error;
        }
    }

    async syncAppointment(appointmentData) {
        try {
            // Create lead if it doesn't exist
            const lead = await this.createLead({
                FirstName: appointmentData.firstName,
                LastName: appointmentData.lastName,
                Email: appointmentData.email,
                Phone: appointmentData.phone,
                Company: 'Appointment Customer',
                LeadSource: 'Website Appointment'
            });

            // Create opportunity
            await this.createOpportunity({
                Name: `Appointment - ${appointmentData.firstName} ${appointmentData.lastName}`,
                LeadId: lead.id,
                StageName: 'Appointment Scheduled',
                CloseDate: appointmentData.date,
                Amount: appointmentData.estimatedValue || 0
            });

            return true;
        } catch (error) {
            console.error('Error syncing appointment to Salesforce:', error);
            throw error;
        }
    }
}

// Export the integration
window.SalesforceIntegration = SalesforceIntegration; 