const API_BASE_URL = import.meta.env.VITE_CAPTAIN_API_URL || '/api/captain';
const CAPTAIN_TOKEN_KEY = 'auth_captain_token';

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem(CAPTAIN_TOKEN_KEY) || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem(CAPTAIN_TOKEN_KEY, token);
        } else {
            localStorage.removeItem(CAPTAIN_TOKEN_KEY);
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

            // Handle 401 Unauthorized globally: Token expired or invalid
            if (response.status === 401) {
                console.warn('Captain API returned 401 Unauthorized. Clearing token to force re-login.');
                this.setToken(null);
                // Dispatch event so AuthContext or Root can catch and redirect
                window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }

            // Check if response is empty (status 204) or has no body
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null;
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    data = { message: 'Failed to parse server response' };
                }
            } else {
                const text = await response.text();
                data = { message: text || `HTTP error! status: ${response.status}` };
            }

            if (!response.ok) {
                // Attach the status to the error object so callers can distinguish types of failures
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;

                error.data = data;
                throw error;
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

    async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
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

    async updateLocation(lat, lng) {
        // Handle both positional (lat, lng) and object {lat, lng} calls
        // This ensures compatibility with existing calls and fixes the sync bug
        const payload = (lat && typeof lat === 'object') ? lat : { lat, lng };
        return this.request('/profile/location', {
            method: 'PUT',
            body: JSON.stringify(payload),
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

    async declineJob(jobId) {
        return this.request(`/jobs/${jobId}/decline`, {
            method: 'POST',
        });
    }

    async commitToScheduledJob(jobId) {
        return this.request(`/jobs/${jobId}/commit`, {
            method: 'POST',
        });
    }

    async updateJobStatus(jobId, status, extraData = {}) {
        return this.request(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, ...extraData }),
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

    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
    }

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, {
            method: 'PATCH'
        });
    }

    async markAllNotificationsRead() {
        return this.request('/notifications/read-all', {
            method: 'PATCH'
        });
    }

    async clearNotifications() {
        return this.request('/notifications/clear', {
            method: 'DELETE'
        });
    }

    async getAvailableProductMissions() {
        return this.request('/product-missions/available');
    }

    async acceptProductMission(orderId, itemId) {
        return this.request(`/product-missions/${orderId}/items/${itemId}/accept`, {
            method: 'POST'
        });
    }

    async acceptProductBatch(batchItems) {
        return this.request('/product-missions/accept-batch', {
            method: 'POST',
            body: JSON.stringify({ batchItems })
        });
    }

    async updateProductMissionStatus(orderId, itemId, status, metadata = {}) {
        return this.request(`/product-missions/${orderId}/items/${itemId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, ...metadata })
        });
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
    signup: (userData) => apiClient.signup(userData),
    logout: () => apiClient.logout(),
    getProfile: () => apiClient.getProfile(),
    updateProfile: (data) => apiClient.updateProfile(data),
    updateLocation: (lat, lng) => apiClient.updateLocation(lat, lng),
    getPendingJobs: () => apiClient.getPendingJobs(),
    getMyJobs: (params) => apiClient.getMyJobs(params),
    getMyJob: (id) => apiClient.getMyJob(id),
    acceptJob: (id) => apiClient.acceptJob(id),
    declineJob: (id) => apiClient.declineJob(id),
    commitToScheduledJob: (id) => apiClient.commitToScheduledJob(id),
    updateJobStatus: (id, status, extraData) => apiClient.updateJobStatus(id, status, extraData),
    getDashboard: () => apiClient.getDashboard(),
    getEarnings: (params) => apiClient.getEarnings(params),
    getHistory: (params) => apiClient.getHistory(params),
    withdrawPayout: (amount) => apiClient.withdrawPayout(amount),
    toggleOnline: (isOnline) => apiClient.toggleOnline(isOnline),
    getRewards: () => apiClient.getRewards(),
    getNotifications: (params) => apiClient.getNotifications(params),
    markNotificationRead: (id) => apiClient.markNotificationRead(id),
    markAllNotificationsRead: () => apiClient.markAllNotificationsRead(),
    clearNotifications: () => apiClient.clearNotifications(),
    getAvailableProductMissions: () => apiClient.getAvailableProductMissions(),
    acceptProductMission: (orderId, itemId) => apiClient.acceptProductMission(orderId, itemId),
    acceptProductBatch: (batchItems) => apiClient.acceptProductBatch(batchItems),
    updateProductMissionStatus: (orderId, itemId, status, metadata) => apiClient.updateProductMissionStatus(orderId, itemId, status, metadata),
    setToken: (token) => apiClient.setToken(token)
};
