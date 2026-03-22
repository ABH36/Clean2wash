const API_BASE_URL = import.meta.env.VITE_VENDOR_API_URL || '/api/vendor';

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_vendor_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_vendor_token', token);
        } else {
            localStorage.removeItem('auth_vendor_token');
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
                console.warn('Vendor API returned 401 Unauthorized.');
                this.setToken(null);
                window.dispatchEvent(new CustomEvent('auth:vendor_unauthorized'));
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

    async signup(data) {
        return this.request('/signup', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getProfile() {
        return this.request('/profile');
    }

    async updateProfile(data) {
        return this.request('/profile', {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async getDashboard() {
        return this.request('/dashboard');
    }

    async getOrders() {
        return this.request('/orders');
    }

    async getOrderById(orderId) {
        return this.request(`/orders/${orderId}`);
    }

    async updateOrderStatus(orderId, status, photos = []) {
        return this.request(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, photos })
        });
    }

    async verifyBookingPin(orderId, pin) {
        return this.request(`/orders/${orderId}/verify-pin`, {
            method: 'POST',
            body: JSON.stringify({ pin })
        });
    }

    // Product Management
    async getProducts() {
        return this.request('/products');
    }

    async createProduct(data) {
        return this.request('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateProduct(id, data) {
        return this.request(`/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Staff Management
    async getStaff() {
        return this.request('/staff');
    }

    async linkStaff(phone) {
        return this.request('/staff/link', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    }

    async searchStaff(phone) {
        return this.request(`/staff/search?phone=${phone}`);
    }

    async createStaff(data) {
        return this.request('/staff/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async unlinkStaff(staffId) {
        return this.request(`/staff/${staffId}`, {
            method: 'DELETE'
        });
    }

    // Service Management
    async getServices() {
        return this.request('/services');
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
        return this.request(`/services/${id}`, {
            method: 'DELETE'
        });
    }

    // Customers & Reports
    async getCustomers() {
        return this.request('/customers');
    }

    async getReports() {
        return this.request('/reports');
    }

    async assignStaff(orderId, staffId, type) {
        return this.request(`/orders/${orderId}/assign-staff`, {
            method: 'POST',
            body: JSON.stringify({ staffId, type })
        });
    }

    async getNotifications() {
        return this.request('/notifications');
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

    async requestPayout(amount) {
        return this.request('/payout', {
            method: 'POST',
            body: JSON.stringify({ amount })
        });
    }

    async sendOTP(phone) {
        return this.request('/send-otp', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    }

    // Product Order & Logistics (Phase 30)
    async getProductOrders() {
        return this.request('/product-orders');
    }

    async assignProductAgent(orderId, itemId, agentId, agentType) {
        return this.request(`/product-orders/${orderId}/items/${itemId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ agentId, agentType })
        });
    }

    async verifyProductPin(orderId, itemId, pin) {
        return this.request(`/product-orders/${orderId}/items/${itemId}/verify-pin`, {
            method: 'POST',
            body: JSON.stringify({ pin })
        });
    }

    async cancelProductItem(orderId, itemId, reason) {
        return this.request(`/product-orders/${orderId}/items/${itemId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
    }

    async acknowledgeProductReturn(orderId, itemId) {
        return this.request(`/product-orders/${orderId}/items/${itemId}/return-ack`, {
            method: 'POST'
        });
    }

    async registerFCMToken(token, platform) {
        return this.request('/fcm-token', {
            method: 'POST',
            body: JSON.stringify({ token, platform }),
        });
    }
}

const apiClient = new ApiClient();

export default apiClient;

export const vendorAPI = {
    setToken: (token) => apiClient.setToken(token),
    login: (email, password) => apiClient.login(email, password),
    signup: (data) => apiClient.signup(data),
    sendOTP: (phone) => apiClient.sendOTP(phone),
    getProfile: () => apiClient.getProfile(),
    updateProfile: (data) => apiClient.updateProfile(data),
    getDashboard: () => apiClient.getDashboard(),
    getOrders: () => apiClient.getOrders(),
    getOrderById: (orderId) => apiClient.getOrderById(orderId),
    updateOrderStatus: (orderId, status, photos = []) => apiClient.updateOrderStatus(orderId, status, photos),
    verifyBookingPin: (orderId, pin) => apiClient.verifyBookingPin(orderId, pin),
    assignStaff: (orderId, staffId, type) => apiClient.assignStaff(orderId, staffId, type),
    // Notifications
    getNotifications: () => apiClient.getNotifications(),
    markNotificationRead: (id) => apiClient.markNotificationRead(id),
    markAllNotificationsRead: () => apiClient.markAllNotificationsRead(),
    clearNotifications: () => apiClient.clearNotifications(),
    // Products
    getProducts: () => apiClient.getProducts(),
    createProduct: (data) => apiClient.createProduct(data),
    updateProduct: (id, data) => apiClient.updateProduct(id, data),
    deleteProduct: (id) => apiClient.deleteProduct(id),
    // Staff
    getStaff: () => apiClient.getStaff(),
    searchStaff: (phone) => apiClient.searchStaff(phone),
    linkStaff: (phone) => apiClient.linkStaff(phone),
    createStaff: (data) => apiClient.createStaff(data),
    unlinkStaff: (staffId) => apiClient.unlinkStaff(staffId),
    // Services
    getServices: () => apiClient.getServices(),
    createService: (data) => apiClient.createService(data),
    updateService: (id, data) => apiClient.updateService(id, data),
    deleteService: (id) => apiClient.deleteService(id),
    // Customers & Reports
    getCustomers: () => apiClient.getCustomers(),
    getReports: () => apiClient.getReports(),
    requestPayout: (amount) => apiClient.requestPayout(amount),
    // Product Logistics (Phase 30 & 34)
    getProductOrders: () => apiClient.getProductOrders(),
    assignProductAgent: (orderId, itemId, agentId, agentType) => apiClient.assignProductAgent(orderId, itemId, agentId, agentType),
    verifyProductPin: (orderId, itemId, pin) => apiClient.verifyProductPin(orderId, itemId, pin),
    cancelProductItem: (orderId, itemId, reason) => apiClient.cancelProductItem(orderId, itemId, reason),
    acknowledgeProductReturn: (orderId, itemId) => apiClient.acknowledgeProductReturn(orderId, itemId),
    registerFCMToken: (token, platform) => apiClient.registerFCMToken(token, platform)
};
