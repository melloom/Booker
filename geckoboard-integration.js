// Geckoboard Integration
class GeckoboardIntegration {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.geckoboard.com';
    }

    async initialize(apiKey) {
        this.apiKey = apiKey;
        // Test connection
        try {
            await this.testConnection();
            return true;
        } catch (error) {
            console.error('Geckoboard initialization failed:', error);
            return false;
        }
    }

    async testConnection() {
        const response = await fetch(`${this.baseUrl}/datasets`, {
            headers: {
                'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to connect to Geckoboard');
        return await response.json();
    }

    async pushMetrics(metrics) {
        try {
            const response = await fetch(`${this.baseUrl}/datasets/appointment_metrics/data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: metrics
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Error pushing metrics to Geckoboard:', error);
            throw error;
        }
    }

    async getDashboardData() {
        try {
            const response = await fetch(`${this.baseUrl}/dashboards`, {
                headers: {
                    'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching Geckoboard dashboards:', error);
            throw error;
        }
    }
}

// Export the integration
window.GeckoboardIntegration = GeckoboardIntegration; 