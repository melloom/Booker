// Call tracking integration
class CallTrackingIntegration {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.calltracking.com/v1';
    }

    async initialize(apiKey) {
        this.apiKey = apiKey;
    }

    async trackCall(callData) {
        try {
            const response = await fetch(`${this.baseUrl}/calls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(callData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error tracking call:', error);
            throw error;
        }
    }
}

// Make the class available globally
window.CallTrackingIntegration = CallTrackingIntegration; 