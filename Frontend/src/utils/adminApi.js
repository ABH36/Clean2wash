const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || '/api/admin';

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_admin_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_admin_token', token);
        } else {
            localStorage.removeItem('auth_admin_token');
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
                console.warn('Admin API returned 401 Unauthorized.');
                this.setToken(null);
                window.dispatchEvent(new CustomEvent('auth:admin_unauthorized'));
            }

            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null;
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

    // Auth methods
    async login(email, password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getProfile() {
        return this.request('/profile');
    }

    async getDashboard() {
        return this.request('/dashboard');
    }

    async getUsers(role) {
        let endpoint = '/users';
        if (role) {
            endpoint += `?role=${role}`;
        }
        return this.request(endpoint);
    }

    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(userId, userData) {
        return this.request(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(userId) {
        return this.request(`/users/${userId}`, {
            method: 'DELETE'
        });
    }

    async getPendingBookings() {
        return this.request('/bookings/pending');
    }

    async getCaptains() {
        return this.request('/captains');
    }

    async assignCaptain(bookingId, captainId) {
        return this.request(`/bookings/${bookingId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ captainId })
        });
    }

    async updateBookingStatus(id, status) {
        return this.request(`/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }

    async assignStaff(bookingId, staffId, type) {
        return this.request(`/bookings/${bookingId}/assign-staff`, {
            method: 'POST',
            body: JSON.stringify({ staffId, type })
        });
    }

    // ── Plans ─────────────────────────────────────────────────────
    async getPlans() {
        return this.request('/plans');
    }

    async createPlan(data) {
        return this.request('/plans', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePlan(id, data) {
        return this.request(`/plans/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deletePlan(id) {
        return this.request(`/plans/${id}`, {
            method: 'DELETE'
        });
    }

    // ── Services ──────────────────────────────────────────────────
    async getServices(category) {
        let endpoint = '/services';
        if (category && category !== 'All') endpoint += `?category=${encodeURIComponent(category)}`;
        return this.request(endpoint);
    }

    async createService(data) {
        return this.request('/services', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateService(id, data) {
        return this.request(`/services/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteService(id) {
        return this.request(`/services/${id}`, { method: 'DELETE' });
    }

    // ── Promotions ────────────────────────────────────────────────
    async getPromotions(type) {
        let endpoint = '/promotions';
        if (type) endpoint += `?type=${encodeURIComponent(type)}`;
        return this.request(endpoint);
    }

    async createPromotion(data) {
        return this.request('/promotions', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePromotion(id, data) {
        return this.request(`/promotions/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deletePromotion(id) {
        return this.request(`/promotions/${id}`, { method: 'DELETE' });
    }

    // ── Named getAllBookings ────────────────────────────────────────
    async getAllBookings() {
        return this.request('/bookings');
    }

    // ── Hubs ──────────────────────────────────────────────────────
    async getHubs() {
        return this.request('/hubs');
    }

    async createHub(data) {
        return this.request('/hubs', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateHub(id, data) {
        return this.request(`/hubs/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteHub(id) {
        return this.request(`/hubs/${id}`, { method: 'DELETE' });
    }

    // ── Product Governance ────────────────────────────────────────
    async getProducts(params = {}) {
        let endpoint = '/products';
        const query = new URLSearchParams();
        if (params.status && params.status !== 'All') query.append('status', params.status);
        if (params.category && params.category !== 'All') query.append('category', params.category);

        const queryString = query.toString();
        if (queryString) endpoint += `?${queryString}`;

        return this.request(endpoint);
    }

    async verifyProduct(data) {
        return this.request('/verify-product', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getAnalytics(timeRange) {
        let endpoint = '/analytics';
        if (timeRange) endpoint += `?timeRange=${encodeURIComponent(timeRange)}`;
        return this.request(endpoint);
    }

    // Settings
    async getSettings() {
        return this.request('/settings');
    }

    async updateSetting(key, value) {
        return this.request('/settings', {
            method: 'PATCH',
            body: JSON.stringify({ key, value })
        });
    }

    // Transactions
    async getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/transactions${query ? `?${query}` : ''}`);
    }

    async getSettlementStats() {
        return this.request('/transactions/stats');
    }

    async updateTransactionStatus(id, status, adminNote, utr) {
        return this.request(`/transactions/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, adminNote, utr })
        });
    }

    // Audit Logs
    async getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/audit/logs${query ? `?${query}` : ''}`);
    }

    async getAuditStats() {
        return this.request('/audit/stats');
    }

    // ── Vehicle Models ───────────────────────────────────────────
    async getVehicleModels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/vehicle-models${query ? `?${query}` : ''}`);
    }

    async createVehicleModel(data) {
        return this.request('/vehicle-models', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateVehicleModel(id, data) {
        return this.request(`/vehicle-models/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteVehicleModel(id) {
        return this.request(`/vehicle-models/${id}`, { method: 'DELETE' });
    }

    async getSpareDrivers() {
        return this.request('/spare-drivers');
    }

    async getSpareDriverBookings() {
        return this.request('/bookings/chauffeur');
    }

    // ── Global Product Stats (Phase 35) ─────────────────────────
    async getProductStats() {
        return this.request('/products/stats');
    }

    async getMasterInventory() {
        return this.request('/products/inventory');
    }

    async resolveProductDispute(data) {
        return this.request('/products/resolve-dispute', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    async put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    }

    async patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
}

const apiClient = new ApiClient();

export default apiClient;

export const adminAPI = {
    login: (email, password) => apiClient.login(email, password),
    getProfile: () => apiClient.getProfile(),
    getDashboard: () => apiClient.getDashboard(),
    getUsers: (role) => apiClient.getUsers(role),
    createUser: (userData) => apiClient.createUser(userData),
    updateUser: (userId, userData) => apiClient.updateUser(userId, userData),
    deleteUser: (userId) => apiClient.deleteUser(userId),
    getPendingBookings: () => apiClient.getPendingBookings(),
    getAllBookings: () => apiClient.getAllBookings(),
    getCaptains: () => apiClient.getCaptains(),
    assignCaptain: (bookingId, captainId) => apiClient.assignCaptain(bookingId, captainId),
    updateBookingStatus: (id, status) => apiClient.updateBookingStatus(id, status),
    assignStaff: (bookingId, staffId, type) => apiClient.assignStaff(bookingId, staffId, type),
    // Plans
    getPlans: () => apiClient.getPlans(),
    createPlan: (data) => apiClient.createPlan(data),
    updatePlan: (id, data) => apiClient.updatePlan(id, data),
    deletePlan: (id) => apiClient.deletePlan(id),
    // Services
    getServices: (category) => apiClient.getServices(category),
    createService: (data) => apiClient.createService(data),
    updateService: (id, data) => apiClient.updateService(id, data),
    deleteService: (id) => apiClient.deleteService(id),
    // Promotions
    getPromotions: (type) => apiClient.getPromotions(type),
    createPromotion: (data) => apiClient.createPromotion(data),
    updatePromotion: (id, data) => apiClient.updatePromotion(id, data),
    deletePromotion: (id) => apiClient.deletePromotion(id),
    // Hubs
    getHubs: () => apiClient.getHubs(),
    createHub: (data) => apiClient.createHub(data),
    updateHub: (id, data) => apiClient.updateHub(id, data),
    deleteHub: (id) => apiClient.deleteHub(id),
    // Product Governance
    getProducts: (params) => apiClient.getProducts(params),
    verifyProduct: (data) => apiClient.verifyProduct(data),
    getAnalytics: (timeRange) => apiClient.getAnalytics(timeRange),
    // Settings
    getSettings: () => apiClient.getSettings(),
    updateSetting: (key, value) => apiClient.updateSetting(key, value),
    // Transactions
    getTransactions: (params) => apiClient.getTransactions(params),
    getSettlementStats: () => apiClient.getSettlementStats(),
    updateTransactionStatus: (id, status, adminNote, utr) => apiClient.updateTransactionStatus(id, status, adminNote, utr),
    // Audit Logs
    getAuditLogs: (params) => apiClient.getAuditLogs(params),
    getAuditStats: () => apiClient.getAuditStats(),
    // Vehicle Models
    getVehicleModels: (params) => apiClient.getVehicleModels(params),
    createVehicleModel: (data) => apiClient.createVehicleModel(data),
    updateVehicleModel: (id, data) => apiClient.updateVehicleModel(id, data),
    deleteVehicleModel: (id) => apiClient.deleteVehicleModel(id),
    getSpareDrivers: () => apiClient.getSpareDrivers(),
    getSpareDriverBookings: () => apiClient.getSpareDriverBookings(),
    // Expose raw request for legacy callers
    request: (endpoint, opts) => apiClient.request(endpoint, opts),
    setToken: (token) => apiClient.setToken(token),

    // Global Product Stats
    getProductStats: () => apiClient.getProductStats(),
    getMasterInventory: () => apiClient.getMasterInventory(),
    resolveProductDispute: (data) => apiClient.resolveProductDispute(data),

    // Notifications
    getNotifications: (params) => {
        const filteredParams = Object.fromEntries(
            Object.entries(params || {}).filter(([_, v]) => v !== undefined)
        );
        const query = new URLSearchParams(filteredParams).toString();
        return apiClient.request(`/notifications${query ? `?${query}` : ''}`);
    },
    markNotificationRead: (id) => apiClient.request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => apiClient.request('/notifications/read-all', { method: 'POST' })
};
