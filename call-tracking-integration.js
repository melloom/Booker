// Call Tracking Metrics Integration
class CallTrackingIntegration {
    constructor() {
        this.apiKey = '';
        this.baseUrl = 'https://api.calltrackingmetrics.com/api/v1';
    }

    async initialize(apiKey) {
        this.apiKey = apiKey;
        try {
            await this.testConnection();
            return true;
        } catch (error) {
            console.error('Call Tracking initialization failed:', error);
            return false;
        }
    }

    async testConnection() {
        const response = await fetch(`${this.baseUrl}/accounts`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to connect to Call Tracking Metrics');
        return await response.json();
    }

    async getCalls(startDate, endDate) {
        try {
            const response = await fetch(
                `${this.baseUrl}/calls?start_date=${startDate}&end_date=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching calls:', error);
            throw error;
        }
    }

    async getCallDetails(callId) {
        try {
            const response = await fetch(`${this.baseUrl}/calls/${callId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error fetching call details:', error);
            throw error;
        }
    }

    async getCallMetrics(startDate, endDate) {
        try {
            const calls = await this.getCalls(startDate, endDate);
            const metrics = {
                totalCalls: calls.length,
                answeredCalls: calls.filter(call => call.status === 'answered').length,
                missedCalls: calls.filter(call => call.status === 'missed').length,
                averageDuration: this.calculateAverageDuration(calls),
                callsByHour: this.groupCallsByHour(calls)
            };
            return metrics;
        } catch (error) {
            console.error('Error calculating call metrics:', error);
            throw error;
        }
    }

    calculateAverageDuration(calls) {
        const answeredCalls = calls.filter(call => call.duration);
        if (answeredCalls.length === 0) return 0;
        const totalDuration = answeredCalls.reduce((sum, call) => sum + call.duration, 0);
        return Math.round(totalDuration / answeredCalls.length);
    }

    groupCallsByHour(calls) {
        const callsByHour = {};
        calls.forEach(call => {
            const hour = new Date(call.timestamp).getHours();
            callsByHour[hour] = (callsByHour[hour] || 0) + 1;
        });
        return callsByHour;
    }
}

// Export the integration
window.CallTrackingIntegration = CallTrackingIntegration; 