// Use relative URL in dev so Vite proxy forwards /api to backend (avoids CORS)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/consumer';

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
    async sendOTP(identifier, type = 'phone', userData = null) {
        const body = { identifier, type };
        if (userData) body.userData = userData;
        return this.request('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async verifyOTP(identifier, otp, type = 'phone', options = {}) {
        const { userData = null, isSignup = false } = options;
        const body = { identifier, otp, type };
        if (userData) body.userData = userData;
        if (isSignup) body.isSignup = true;
        return this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async login(identifier, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ identifier, password }),
        });
    }

    async signup(userData) {
        return this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    }

    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST',
        });
        this.setToken(null);
        return response;
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

    // Wallet methods
    async getWallet(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/wallet${queryString ? `?${queryString}` : ''}`);
    }

    async addToWallet(amount, paymentMethod) {
        return this.request('/wallet/add', {
            method: 'POST',
            body: JSON.stringify({ amount, paymentMethod }),
        });
    }

    // Notifications methods
    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
    }

    async markNotificationRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'PATCH',
        });
    }

    async markAllNotificationsRead() {
        return this.request('/notifications/read-all', {
            method: 'PATCH',
        });
    }

    // Subscription methods
    async getSubscription() {
        return this.request('/subscription');
    }

    async createSubscription(planData) {
        return this.request('/subscription', {
            method: 'POST',
            body: JSON.stringify(planData),
        });
    }

    async cancelSubscription() {
        return this.request('/subscription', {
            method: 'DELETE',
        });
    }

    // Vehicles methods
    async getVehicles() {
        return this.request('/vehicles');
    }

    async addVehicle(vehicleData) {
        return this.request('/vehicles', {
            method: 'POST',
            body: JSON.stringify(vehicleData),
        });
    }

    async updateVehicle(vehicleId, vehicleData) {
        return this.request(`/vehicles/${vehicleId}`, {
            method: 'PUT',
            body: JSON.stringify(vehicleData),
        });
    }

    async deleteVehicle(vehicleId) {
        return this.request(`/vehicles/${vehicleId}`, {
            method: 'DELETE',
        });
    }

    // Bookings methods
    async getBookings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/bookings${queryString ? `?${queryString}` : ''}`);
    }

    async getBooking(bookingId) {
        return this.request(`/bookings/${bookingId}`);
    }

    async createBooking(bookingData) {
        return this.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    }

    async updateBooking(bookingId, bookingData) {
        return this.request(`/bookings/${bookingId}`, {
            method: 'PUT',
            body: JSON.stringify(bookingData),
        });
    }

    async cancelBooking(bookingId) {
        return this.request(`/bookings/${bookingId}`, {
            method: 'DELETE',
        });
    }

    // Services methods
    async getServices(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/services${queryString ? `?${queryString}` : ''}`);
    }

    async getService(serviceId) {
        return this.request(`/services/${serviceId}`);
    }

    async getServiceCategories() {
        return this.request('/services/categories');
    }

    async getServicePlans(serviceId) {
        return this.request(`/services/${serviceId}/plans`);
    }

    async calculatePricing(serviceData) {
        return this.request('/services/calculate-pricing', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
    }

    async getTimeSlots(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/services/time-slots${queryString ? `?${queryString}` : ''}`);
    }

    async validateServiceAvailability(serviceData) {
        return this.request('/services/validate-availability', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });
    }

    // Profile stats
    async getStats() {
        return this.request('/profile/stats');
    }
}

// Create and export singleton instance
const apiClient = new ApiClient();

export default apiClient;

// Export individual methods for easier usage
export const authAPI = {
    sendOTP: (identifier, type, userData) => apiClient.sendOTP(identifier, type, userData),
    verifyOTP: (identifier, otp, type, options) => apiClient.verifyOTP(identifier, otp, type, options),
    login: (identifier, password) => apiClient.login(identifier, password),
    signup: (userData) => apiClient.signup(userData),
    logout: () => apiClient.logout(),
    getProfile: () => apiClient.getProfile(),
    updateProfile: (data) => apiClient.updateProfile(data),
};

export const walletAPI = {
    getWallet: (params) => apiClient.getWallet(params),
    addToWallet: (amount, method) => apiClient.addToWallet(amount, method),
};

export const notificationAPI = {
    getNotifications: (params) => apiClient.getNotifications(params),
    markRead: (id) => apiClient.markNotificationRead(id),
    markAllRead: () => apiClient.markAllNotificationsRead(),
};

export const subscriptionAPI = {
    getSubscription: () => apiClient.getSubscription(),
    createSubscription: (data) => apiClient.createSubscription(data),
    cancelSubscription: () => apiClient.cancelSubscription(),
};

export const vehicleAPI = {
    getVehicles: () => apiClient.getVehicles(),
    addVehicle: (data) => apiClient.addVehicle(data),
    updateVehicle: (id, data) => apiClient.updateVehicle(id, data),
    deleteVehicle: (id) => apiClient.deleteVehicle(id),
};

export const bookingAPI = {
    getBookings: (params) => apiClient.getBookings(params),
    getBooking: (id) => apiClient.getBooking(id),
    createBooking: (data) => apiClient.createBooking(data),
    updateBooking: (id, data) => apiClient.updateBooking(id, data),
    cancelBooking: (id) => apiClient.cancelBooking(id),
};

export const serviceAPI = {
    getServices: (params) => apiClient.getServices(params),
    getService: (id) => apiClient.getService(id),
    getCategories: () => apiClient.getServiceCategories(),
    getPlans: (id) => apiClient.getServicePlans(id),
    calculatePricing: (data) => apiClient.calculatePricing(data),
    getTimeSlots: (params) => apiClient.getTimeSlots(params),
    validateAvailability: (data) => apiClient.validateServiceAvailability(data),
};
