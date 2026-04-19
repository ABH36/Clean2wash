const API_BASE_URL = import.meta.env.VITE_DRIVER_API_URL || '/api/sparedrivers';

class DriverApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_driver_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_driver_token', token);
        } else {
            localStorage.removeItem('auth_driver_token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                console.warn('Driver API returned 401 Unauthorized.');
                this.setToken(null);
                window.dispatchEvent(new CustomEvent('auth:driver_unauthorized'));
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    data = { message: 'Failed to parse server response' };
                }
            } else {
                const text = await response.text();
                data = { message: text || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    // Earnings APIs
    async getTodayEarnings() {
        return this.request('/earnings/today');
    }

    async getWeeklyEarnings() {
        return this.request('/earnings/weekly');
    }

    async getMonthlyEarnings(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/earnings/monthly${query ? `?${query}` : ''}`);
    }

    async getEarningsHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/earnings/history${query ? `?${query}` : ''}`);
    }

    async getEarningsSummary() {
        return this.request('/earnings/summary');
    }

    // Payout APIs
    async getPayoutHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/earnings/payouts${query ? `?${query}` : ''}`);
    }

    async requestWithdrawal(data) {
        return this.request('/earnings/withdraw', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Generic HTTP methods
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    async patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

const driverApiClient = new DriverApiClient();

export default driverApiClient;

export const driverAPI = {
    // Earnings
    getTodayEarnings: () => driverApiClient.getTodayEarnings(),
    getWeeklyEarnings: () => driverApiClient.getWeeklyEarnings(),
    getMonthlyEarnings: (params) => driverApiClient.getMonthlyEarnings(params),
    getEarningsHistory: (params) => driverApiClient.getEarningsHistory(params),
    getEarningsSummary: () => driverApiClient.getEarningsSummary(),
    
    // Payouts
    getPayoutHistory: (params) => driverApiClient.getPayoutHistory(params),
    requestWithdrawal: (data) => driverApiClient.requestWithdrawal(data),
    
    // Generic
    get: (endpoint, options) => driverApiClient.get(endpoint, options),
    post: (endpoint, body, options) => driverApiClient.post(endpoint, body, options),
    patch: (endpoint, body, options) => driverApiClient.patch(endpoint, body, options),
    delete: (endpoint, options) => driverApiClient.delete(endpoint, options),
    setToken: (token) => driverApiClient.setToken(token)
};