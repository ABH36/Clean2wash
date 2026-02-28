const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/captain';

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
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
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async sendOTP(phone, userData = null) {
        const body = { phone, userData };
        return this.request('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async verifyOTP(phone, otp, options = {}) {
        const { userData = null, isSignup = false } = options;
        const body = { phone, otp, userData, isSignup };
        return this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async login(phone, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST',
        });
    }

    async getProfile() {
        return this.request('/profile');
    }

    async updateProfile(profileData) {
        return this.request('/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    }

    async getPendingJobs() {
        return this.request('/jobs/pending');
    }

    async getMyJobs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/jobs${queryString ? `?${queryString}` : ''}`);
    }

    async getMyJob(jobId) {
        return this.request(`/jobs/${jobId}`);
    }

    async acceptJob(jobId) {
        return this.request(`/jobs/${jobId}/accept`, {
            method: 'POST',
        });
    }

    async updateJobStatus(jobId, status) {
        return this.request(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async getDashboard() {
        return this.request('/dashboard');
    }

    async getEarnings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/earnings${queryString ? `?${queryString}` : ''}`);
    }

    async getHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/history${queryString ? `?${queryString}` : ''}`);
    }

    async withdrawPayout(amount) {
        return this.request('/earnings/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });
    }

    async toggleOnline(isOnline) {
        return this.request('/online', {
            method: 'PATCH',
            body: JSON.stringify({ isOnline }),
        });
    }

    async getRewards() {
        return this.request('/rewards');
    }
}

// Create and export singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export individual methods for easier usage
export const captainAPI = {
    sendOTP: (phone, userData) => apiClient.sendOTP(phone, userData),
    verifyOTP: (phone, otp, options) => apiClient.verifyOTP(phone, otp, options),
    login: (phone, password) => apiClient.login(phone, password),
    logout: () => apiClient.logout(),
    getProfile: () => apiClient.getProfile(),
    updateProfile: (data) => apiClient.updateProfile(data),
    getPendingJobs: () => apiClient.getPendingJobs(),
    getMyJobs: (params) => apiClient.getMyJobs(params),
    getMyJob: (id) => apiClient.getMyJob(id),
    acceptJob: (id) => apiClient.acceptJob(id),
    updateJobStatus: (id, status) => apiClient.updateJobStatus(id, status),
    getDashboard: () => apiClient.getDashboard(),
    getEarnings: (params) => apiClient.getEarnings(params),
    getHistory: (params) => apiClient.getHistory(params),
    withdrawPayout: (amount) => apiClient.withdrawPayout(amount),
    toggleOnline: (isOnline) => apiClient.toggleOnline(isOnline),
    getRewards: () => apiClient.getRewards(),
};
