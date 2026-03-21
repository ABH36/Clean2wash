const API_BASE_URL = import.meta.env.VITE_STAFF_API_URL || '/api/staff';

class StaffApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_staff_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_staff_token', token);
        } else {
            localStorage.removeItem('auth_staff_token');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);

            if (response.status === 401) {
                this.setToken(null);
            }

            if (response.status === 204) return null;

            const data = await response.json();
            if (!response.ok) {
                const err = new Error(data.message || `HTTP error! status: ${response.status}`);
                err.status = response.status;
                throw err;
            }
            return data;
        } catch (error) {
            console.error(`Staff API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth
    async sendOTP(phone) {
        return this.request('/send-otp', { method: 'POST', body: { phone } });
    }

    async login(phone, otp) {
        const res = await this.request('/login', { method: 'POST', body: { phone, otp } });
        const token = res.token || res.data?.token;
        if (token) this.setToken(token);
        return res;
    }

    async getProfile() {
        return this.request('/profile');
    }

    async updateProfile(data) {
        return this.request('/profile', { method: 'PATCH', body: data });
    }

    // Operations
    async getDashboard() {
        return this.request('/dashboard');
    }

    async getEarnings() {
        return this.request('/earnings');
    }

    async getTasks() {
        return this.request('/tasks');
    }

    async getTaskById(id) {
        return this.request(`/tasks/${id}`);
    }

    async uploadProof(images, type) {
        return this.request('/upload-proof', { method: 'POST', body: { images, type } });
    }

    async updateTaskStatus(id, status, details = {}) {
        return this.request(`/tasks/${id}/status`, {
            method: 'PATCH',
            body: { status, ...details },
        });
    }

    async updateLocation(id, lat, lng) {
        return this.request(`/tasks/${id}/location`, {
            method: 'PUT',
            body: { lat, lng }
        });
    }

    // Notifications
    async getNotifications() {
        return this.request('/notifications');
    }

    async toggleAvailability() {
        return this.request('/availability', { method: 'PATCH' });
    }

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
    }

    async clearNotifications() {
        return this.request('/notifications/clear', { method: 'DELETE' });
    }
}

const apiClient = new StaffApiClient();

export const staffAPI = {
    sendOTP: (phone) => apiClient.sendOTP(phone),
    login: (phone, otp) => apiClient.login(phone, otp),
    getProfile: () => apiClient.getProfile(),
    getDashboard: () => apiClient.getDashboard(),
    getEarnings: () => apiClient.getEarnings(),
    getTasks: () => apiClient.getTasks(),
    getTaskById: (id) => apiClient.getTaskById(id),
    uploadProof: (images, type) => apiClient.uploadProof(images, type),
    updateTaskStatus: (id, data) => apiClient.updateTaskStatus(id, data),
    commitToSlot: (id) => apiClient.request(`/tasks/${id}/commit`, { method: 'POST' }),
    getNotifications: () => apiClient.getNotifications(),
    toggleAvailability: () => apiClient.toggleAvailability(),
    markNotificationRead: (id) => apiClient.markNotificationRead(id),
    clearNotifications: () => apiClient.clearNotifications(),
    reportMissedWash: (id, data) => apiClient.request(`/tasks/${id}/missed-wash`, {
        method: 'POST',
        body: data
    }),

    // Phase 32: Product Logistics
    updateProductItemStatus: (orderId, itemId, status) => apiClient.request(`/product-orders/${orderId}/items/${itemId}/status`, {
        method: 'PATCH',
        body: { status }
    }),
    verifyProductItemPin: (orderId, itemId, pin) => apiClient.request(`/product-orders/${orderId}/items/${itemId}/verify-pin`, {
        method: 'POST',
        body: { pin }
    }),

    setToken: (token) => apiClient.setToken(token)
};
