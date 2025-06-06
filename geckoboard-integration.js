// Geckoboard integration
class GeckoboardIntegration {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.geckoboard.com';
    }

    async initialize(apiKey) {
        this.apiKey = apiKey;
    }

    async pushData(datasetId, data) {
        try {
            const response = await fetch(`${this.baseUrl}/datasets/${datasetId}/data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${this.apiKey}`
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Error pushing data to Geckoboard:', error);
            throw error;
        }
    }
}

// Make the class available globally
window.GeckoboardIntegration = GeckoboardIntegration; 