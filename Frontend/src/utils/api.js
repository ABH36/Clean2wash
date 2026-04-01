// Use relative URL in dev so Vite proxy forwards /api to backend (avoids CORS)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/consumer';
const MEDIA_FIELD_HINTS = ['image', 'img', 'icon', 'photo', 'avatar', 'logo', 'banner', 'thumbnail'];

const isPrivateOrLocalHost = (host = '') => {
    if (!host) return false;
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
    if (/^10\./.test(host)) return true;
    if (/^192\.168\./.test(host)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
    return false;
};

const isMediaField = (key = '') => {
    const lower = String(key || '').toLowerCase();
    return MEDIA_FIELD_HINTS.some((hint) => lower.includes(hint));
};

const sanitizeMediaUrl = (value) => {
    if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return value;

    try {
        const parsed = new URL(value);
        const pageIsHttps = typeof window !== 'undefined' && window.location?.protocol === 'https:';
        const pagePort = typeof window !== 'undefined' ? window.location?.port : '';
        const isLocal = isPrivateOrLocalHost(parsed.hostname);

        // Prevent random localhost image ports from causing mixed-content/connection errors.
        if (isLocal && parsed.port && pagePort && parsed.port !== pagePort) {
            return null;
        }

        if (pageIsHttps && parsed.protocol === 'http:') {
            // Browser blocks insecure private/local network requests on HTTPS pages.
            if (isLocal) return null;
            parsed.protocol = 'https:';
            return parsed.toString();
        }

        return value;
    } catch {
        return value;
    }
};

const sanitizeApiPayload = (value, key = '') => {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeApiPayload(item, key));
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, sanitizeApiPayload(v, k)])
        );
    }

    if (typeof value === 'string' && isMediaField(key)) {
        return sanitizeMediaUrl(value);
    }

    return value;
};

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_token') || null;
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

            // Handle 401 Unauthorized globally: Token expired or invalid
            if (response.status === 401) {
                console.warn('api.js: API returned 401 Unauthorized. Dispatching auth:unauthorized event...');
                this.setToken(null);
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
                    data = sanitizeApiPayload(data);
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



    // Payment methods
    async getRazorpayKey() {
        return this.request('/payment/key');
    }

    async createOrder(amount, currency = 'INR', receipt) {
        return this.request('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount, currency, receipt }),
        });
    }

    async verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId) {
        return this.request('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }),
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

    async createWalletOrder(amount) {
        return this.request('/wallet/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });
    }

    async verifyWalletPayment(data) {
        return this.request('/wallet/verify-payment', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async withdrawFromWallet(amount) {
        return this.request('/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify({ amount }),
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

    // Referral methods
    async getReferralStats() {
        return this.request('/referral/stats');
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

    async pauseSubscription() {
        return this.request('/subscription/pause', {
            method: 'PATCH',
        });
    }

    async resumeSubscription() {
        return this.request('/subscription/resume', {
            method: 'PATCH',
        });
    }

    // Vehicles methods
    async getVehicles() {
        return this.request('/vehicles');
    }

    async getVehicleTypes() {
        return this.request('/vehicles/types');
    }

    async getVehicleModels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/services/vehicle-models${query ? `?${query}` : ''}`);
    }

    async validateCoupon(code, amount) {
        return this.request('/services/promotions/validate-coupon', {
            method: 'POST',
            body: { code, amount }
        });
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

    // Safety Contacts
    async getTrustedContacts() {
        return this.request('/profile/trusted-contacts');
    }

    async addTrustedContact(contactData) {
        return this.request('/profile/trusted-contacts', {
            method: 'POST',
            body: JSON.stringify(contactData),
        });
    }

    async removeTrustedContact(contactId) {
        return this.request(`/profile/trusted-contacts/${contactId}`, {
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

    async getBanners(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/services/banners${queryString ? `?${queryString}` : ''}`);
    }

    async getService(serviceId) {
        return this.request(`/services/${serviceId}`);
    }

    async getPortfolio() {
        return this.request('/portfolio');
    }

    async getServiceCategories() {
        return this.request('/services/categories');
    }

    async getServicePlans(serviceId) {
        return this.request(`/services/${serviceId}/plans`);
    }

    async getPlans(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/services/plans${queryString ? `?${queryString}` : ''}`);
    }

    async getApartmentFlowData(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/services/apartment-flow${queryString ? `?${queryString}` : ''}`);
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

    // Profile stats and address
    async getPlatformStats() {
        return this.request('/services/stats');
    }

    async getHubs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/hubs${queryString ? `?${queryString}` : ''}`);
    }

    async getStats() {
        return this.request('/profile/stats');
    }

    async getPromotions() {
        return this.request('/services/promotions');
    }

    async getTransactions(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/wallet/transactions${queryString ? `?${queryString}` : ''}`);
    }

    async updateAddress(addressData) {
        return this.request('/profile/address', {
            method: 'PUT',
            body: JSON.stringify(addressData),
        });
    }

    // --- Captain Specific Methods (Internal) ---
    async getPendingJobs() {
        return this.request('/jobs/pending');
    }

    async getMyJobs() {
        return this.request('/jobs');
    }

    async getMyJob(id) {
        return this.request(`/jobs/${id}`);
    }

    async acceptJob(id) {
        return this.request(`/jobs/${id}/accept`, {
            method: 'POST'
        });
    }

    async updateJobStatus(id, status, metadata = {}) {
        return this.request(`/jobs/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, ...metadata })
        });
    }

    async getCaptainEarnings() {
        return this.request('/earnings');
    }

    async getCaptainDashboard() {
        return this.request('/dashboard');
    }

    async toggleOnline(isOnline) {
        return this.request('/online', {
            method: 'PATCH',
            body: JSON.stringify({ isOnline })
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

    async updateProductMissionStatus(orderId, itemId, status, metadata = {}) {
        return this.request(`/product-missions/${orderId}/items/${itemId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, ...metadata })
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

    async registerFCMToken(token, platform) {
        return this.request('/auth/fcm-token', {
            method: 'POST',
            body: JSON.stringify({ token, platform }),
        });
    }
}

// Create singleton instances for different roles
const consumerApiClient = new ApiClient(import.meta.env.VITE_API_URL || '/api/consumer');
const captainApiClient = new ApiClient('/api/captain');

// Generic export for backward compatibility or general use
export const apiClient = consumerApiClient;
export default consumerApiClient;

// Export individual methods for easier usage
export const authAPI = {
    sendOTP: (identifier, type, userData) => consumerApiClient.sendOTP(identifier, type, userData),
    verifyOTP: (identifier, otp, type, options) => consumerApiClient.verifyOTP(identifier, otp, type, options),
    login: (identifier, password) => consumerApiClient.login(identifier, password),
    signup: (userData) => consumerApiClient.signup(userData),
    logout: () => consumerApiClient.logout(),
    getProfile: () => consumerApiClient.getProfile(),
    updateProfile: (data) => consumerApiClient.updateProfile(data),
    updateAddress: (data) => consumerApiClient.updateAddress(data),
};

export const captainAPI = {
    sendOTP: (phone, userData) => captainApiClient.sendOTP(phone, 'phone', { userData }),
    verifyOTP: (phone, otp, options) => captainApiClient.verifyOTP(phone, otp, 'phone', options),
    login: (phone, password) => captainApiClient.login(phone, password),
    logout: () => captainApiClient.logout(),
    getProfile: () => captainApiClient.getProfile(),
    updateProfile: (data) => captainApiClient.updateProfile(data),
    getPendingJobs: () => captainApiClient.getPendingJobs(),
    getMyJobs: () => captainApiClient.getMyJobs(),
    getMyJob: (id) => captainApiClient.getMyJob(id),
    acceptJob: (id) => captainApiClient.acceptJob(id),
    updateJobStatus: (id, status, metadata) => captainApiClient.updateJobStatus(id, status, metadata),
    getEarnings: () => captainApiClient.getCaptainEarnings(),
    getDashboard: () => captainApiClient.getCaptainDashboard(),
    toggleOnline: (isOnline) => captainApiClient.toggleOnline(isOnline),
    getAvailableProductMissions: () => captainApiClient.getAvailableProductMissions(),
    acceptProductMission: (orderId, itemId) => captainApiClient.acceptProductMission(orderId, itemId),
    updateProductMissionStatus: (orderId, itemId, status, metadata) => captainApiClient.updateProductMissionStatus(orderId, itemId, status, metadata),
};

export const walletAPI = {
    getBalance: (params) => apiClient.getWallet(params),
    createOrder: (amount) => apiClient.createWalletOrder(amount),
    verifyPayment: (data) => apiClient.verifyWalletPayment(data),
    getTransactions: (params) => apiClient.getTransactions(params),
    withdraw: (amount) => apiClient.withdrawFromWallet(amount),
};

export const paymentAPI = {
    getRazorpayKey: () => apiClient.getRazorpayKey(),
    createOrder: (amount, currency, receipt) => apiClient.createOrder(amount, currency, receipt),
    verifyPayment: (orderId, paymentId, signature, bookingId) => apiClient.verifyPayment(orderId, paymentId, signature, bookingId),
};

export const notificationAPI = {
    getNotifications: (params) => apiClient.getNotifications(params),
    markRead: (id) => apiClient.markNotificationRead(id),
    markAllRead: () => apiClient.markAllNotificationsRead(),
    clearAll: () => apiClient.request('/notifications/clear', { method: 'DELETE' }),
};

export const subscriptionAPI = {
    getSubscription: () => apiClient.getSubscription(),
    createSubscription: (data) => apiClient.createSubscription(data),
    cancelSubscription: () => apiClient.cancelSubscription(),
    pauseSubscription: () => apiClient.pauseSubscription(),
    resumeSubscription: () => apiClient.resumeSubscription(),
    useSubscriptionCredit: () => apiClient.post('/subscription/use-credit', {}),
};

export const vehicleAPI = {
    getVehicles: () => apiClient.getVehicles(),
    addVehicle: (data) => apiClient.addVehicle(data),
    updateVehicle: (id, data) => apiClient.updateVehicle(id, data),
    deleteVehicle: (id) => apiClient.deleteVehicle(id),
    getVehicleTypes: () => apiClient.getVehicleTypes(),
    getVehicleModels: (params) => apiClient.getVehicleModels(params),
};

export const bookingAPI = {
    getBookings: (params) => apiClient.getBookings(params),
    getBooking: (id) => apiClient.getBooking(id),
    createBooking: (data) => apiClient.createBooking(data),
    updateBooking: (id, data) => apiClient.updateBooking(id, data),
    cancelBooking: (id) => apiClient.cancelBooking(id),
    submitFeedback: (id, data) => apiClient.request(`/bookings/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

export const productAPI = {
    getProducts: (params) => apiClient.request('/products' + (params ? `?${new URLSearchParams(params).toString()}` : '')),
    getProduct: (id) => apiClient.request(`/products/${id}`),
    getEshopMetadata: () => apiClient.request('/eshop/metadata'),
    submitProductReview: (data) => apiClient.request('/products/reviews', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getTrendingProducts: () => apiClient.request('/products/trending'),
    getProductReviews: (productId) => apiClient.request(`/products/${productId}/reviews`),
};

export const orderAPI = {
    getOrders: () => apiClient.request('/orders'),
    getOrder: (id) => apiClient.request(`/orders/${id}`),
    createOrder: (data) => apiClient.request('/orders', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    verifyOrderPayment: (data) => apiClient.request('/orders/verify-payment', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

export const serviceAPI = {
    getHomeData: () => apiClient.request('/services/home'),
    getServices: (params) => apiClient.getServices(params),
    getBanners: (params) => apiClient.getBanners(params),
    getService: (id) => apiClient.getService(id),
    getHubs: (params) => apiClient.getHubs(params),
    getCategories: () => apiClient.getServiceCategories(),
    getPlans: (params) => apiClient.getPlans(params),
    getApartmentFlowData: (params) => apiClient.getApartmentFlowData(params),
    getServicePlans: (id) => apiClient.getServicePlans(id),
    calculatePricing: (data) => apiClient.calculatePricing(data),
    getTimeSlots: (params) => apiClient.getTimeSlots(params),
    validateAvailability: (data) => apiClient.validateServiceAvailability(data),
    validateCoupon: (code, amount) => apiClient.validateCoupon(code, amount),
    getPlatformStats: () => apiClient.getPlatformStats(),
    getPortfolio: () => apiClient.getPortfolio(),
    likePortfolioItem: (id) => apiClient.request(`/portfolio/${id}/like`, { method: 'PATCH' }),
    getChauffeurServices: () => apiClient.getServices({ category: 'Chauffeur' }),
    getStats: () => apiClient.getStats(),
    getPromotions: () => apiClient.getPromotions(),
    search: (q) => apiClient.request(`/services/search?q=${encodeURIComponent(q)}`),
    getAdminInstantWashConfig: () => apiClient.request('/admin/services/instant-config'),
    getInstantWashConfig: () => apiClient.request('/services/instant-config'),

    updateInstantWashService: (id, data) => apiClient.request(`/admin/services/instant-config/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const referralAPI = {
    getStats: () => apiClient.getReferralStats(),
};

