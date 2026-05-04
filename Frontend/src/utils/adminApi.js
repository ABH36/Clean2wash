const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || '/api/admin';
const SUPERADMIN_AUTH_BASE_URL = import.meta.env.VITE_SUPERADMIN_API_URL || '/api/superadmin';

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000, // 1 second
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    timeout: 30000 // 30 seconds
};

class ApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_admin_token') || null;
        this.refreshing = false;
        this.failedQueue = [];
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_admin_token', token);
        } else {
            localStorage.removeItem('auth_admin_token');
        }
    }

    // Process queued requests after token refresh
    processQueue(error, token = null) {
        this.failedQueue.forEach(prom => {
            if (error) {
                prom.reject(error);
            } else {
                prom.resolve(token);
            }
        });
        this.failedQueue = [];
    }

    // Sleep utility for retry delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check if error is retryable
    isRetryableError(error) {
        if (!error.status) return false;
        return RETRY_CONFIG.retryableStatuses.includes(error.status);
    }

    // Calculate exponential backoff delay
    getRetryDelay(attempt) {
        return RETRY_CONFIG.retryDelay * Math.pow(2, attempt);
    }

    // Fetch with timeout
    async fetchWithTimeout(url, config, timeout = RETRY_CONFIG.timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                const timeoutError = new Error('Request timeout');
                timeoutError.status = 408;
                throw timeoutError;
            }
            throw error;
        }
    }

    async request(endpoint, options = {}, retryCount = 0) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        // Special handling for FormData (Content-Type should be set by browser)
        if (config.headers['Content-Type'] === null) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await this.fetchWithTimeout(url, config);

            // Handle 401 Unauthorized
            if (response.status === 401) {
                console.warn('Admin API returned 401 Unauthorized.');
                
                // If already refreshing, queue this request
                if (this.refreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then(token => {
                        config.headers.Authorization = `Bearer ${token}`;
                        return this.request(endpoint, options, retryCount);
                    });
                }

                // Clear token and notify
                this.setToken(null);
                window.dispatchEvent(new CustomEvent('auth:admin_unauthorized'));
                
                const authError = new Error('Unauthorized - Please login again');
                authError.status = 401;
                throw authError;
            }

            // Handle 204 No Content
            if (response.status === 204 || response.headers.get('content-length') === '0') {
                return null;
            }

            // Parse response
            const contentType = response.headers.get('content-type');
            let data;

            if (contentType && contentType.includes('application/json')) {
                try {
                    const text = await response.text();
                    data = text ? JSON.parse(text) : {};
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    data = { 
                        status: 'error',
                        message: 'Failed to parse server response',
                        details: parseError.message 
                    };
                }
            } else {
                const text = await response.text();
                data = { 
                    status: 'error',
                    message: text || `HTTP error! status: ${response.status}` 
                };
            }

            // Handle non-OK responses
            if (!response.ok) {
                const error = new Error(
                    data.message || 
                    data.error || 
                    `HTTP error! status: ${response.status}`
                );
                error.status = response.status;
                error.data = data;
                error.response = response;
                throw error;
            }

            return data;
        } catch (error) {
            // Check if we should retry
            if (this.isRetryableError(error) && retryCount < RETRY_CONFIG.maxRetries) {
                const delay = this.getRetryDelay(retryCount);
                console.warn(`Request failed, retrying in ${delay}ms... (Attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries})`);
                await this.sleep(delay);
                return this.request(endpoint, options, retryCount + 1);
            }

            // Enhance error with additional context
            if (!error.status) {
                error.status = 0;
                error.message = error.message || 'Network error - Please check your connection';
            }

            console.error('API Request failed:', {
                endpoint,
                status: error.status,
                message: error.message,
                retryCount
            });

            throw error;
        }
    }

    // Auth methods
    async login(email, password) {
        const loginUrl = `${SUPERADMIN_AUTH_BASE_URL}/auth/login`;
        const response = await this.fetchWithTimeout(loginUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (response.status === 401) {
            const authError = new Error('Unauthorized - Please login again');
            authError.status = 401;
            throw authError;
        }

        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } else {
            const text = await response.text();
            data = {
                status: 'error',
                message: text || `HTTP error! status: ${response.status}`
            };
        }

        if (!response.ok) {
            const error = new Error(
                data.message ||
                data.error ||
                `HTTP error! status: ${response.status}`
            );
            error.status = response.status;
            error.data = data;
            error.response = response;
            throw error;
        }

        return data;
    }

    async getProfile() { return this.request('/profile'); }
    async getDashboard() { return this.request('/dashboard'); }
    async getUsers(role, page = 1, limit = 50) {
        let endpoint = `/users?page=${page}&limit=${limit}`;
        if (role) endpoint += `&role=${role}`;
        return this.request(endpoint);
    }
    async createUser(userData) { return this.request('/users', { method: 'POST', body: JSON.stringify(userData) }); }
    async updateUser(userId, userData) { return this.request(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(userData) }); }
    async deleteUser(userId) { return this.request(`/users/${userId}`, { method: 'DELETE' }); }
    async updateUserKyc(userId, kycData) { return this.request(`/users/${userId}/kyc`, { method: 'PATCH', body: JSON.stringify(kycData) }); }
    async getPendingBookings() { return this.request('/bookings/pending'); }
    async getCaptains() { return this.request('/captains'); }
    async assignCaptain(bookingId, captainId) { return this.request(`/bookings/${bookingId}/assign`, { method: 'POST', body: JSON.stringify({ captainId }) }); }
    async updateBookingStatus(id, status) { return this.request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
    async assignStaff(bookingId, staffId, type) { return this.request(`/bookings/${bookingId}/assign-staff`, { method: 'POST', body: JSON.stringify({ staffId, type }) }); }
    async getPlans() { return this.request('/plans'); }
    async getChauffeurPlans() { return this.request('/plans/chauffeur'); }
    async createPlan(data) { return this.request('/plans', { method: 'POST', body: JSON.stringify(data) }); }
    async createChauffeurPlan(data) { return this.request('/plans/chauffeur', { method: 'POST', body: JSON.stringify(data) }); }
    async updatePlan(id, data) { return this.request(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async updateChauffeurPlan(id, data) { return this.request(`/plans/chauffeur/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async deletePlan(id) { return this.request(`/plans/${id}`, { method: 'DELETE' }); }
    async deleteChauffeurPlan(id) { return this.request(`/plans/chauffeur/${id}`, { method: 'DELETE' }); }
    async getServices(category) {
        let endpoint = '/services';
        if (category && category !== 'All') endpoint += `?category=${encodeURIComponent(category)}`;
        return this.request(endpoint);
    }
    async getChauffeurServicesConfig() { return this.request('/services/chauffeur-config'); }
    async getApartmentWashConfig() { return this.request('/services/apartment-config'); }
    async updateChauffeurServiceConfig(id, data) { return this.request(`/services/chauffeur-config/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async updateApartmentWashConfig(id, data) { return this.request(`/services/apartment-config/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async createService(data) { return this.request('/services', { method: 'POST', body: JSON.stringify(data) }); }
    async updateService(id, data) { return this.request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async deleteService(id) { return this.request(`/services/${id}`, { method: 'DELETE' }); }
    async getPromotions(type) {
        let endpoint = '/promotions';
        if (type) endpoint += `?type=${encodeURIComponent(type)}`;
        return this.request(endpoint);
    }
    async createPromotion(data) { return this.request('/promotions', { method: 'POST', body: JSON.stringify(data) }); }
    async updatePromotion(id, data) { return this.request(`/promotions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async deletePromotion(id) { return this.request(`/promotions/${id}`, { method: 'DELETE' }); }
    async getAllBookings() { return this.request('/bookings'); }
    async getStudioWashConsole() { return this.request('/studio-wash/console'); }
    async getHubs() { return this.request('/hubs'); }
    async createHub(data) { return this.request('/hubs', { method: 'POST', body: JSON.stringify(data) }); }
    async updateHub(id, data) { return this.request(`/hubs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async deleteHub(id) { return this.request(`/hubs/${id}`, { method: 'DELETE' }); }
    async getProducts(params = {}) {
        let endpoint = '/products';
        const query = new URLSearchParams();
        if (params.status && params.status !== 'All') query.append('status', params.status);
        if (params.category && params.category !== 'All') query.append('category', params.category);
        const queryString = query.toString();
        if (queryString) endpoint += `?${queryString}`;
        return this.request(endpoint);
    }
    async verifyProduct(data) { return this.request('/verify-product', { method: 'POST', body: JSON.stringify(data) }); }
    async getAnalytics(timeRange) {
        let endpoint = '/analytics';
        if (timeRange) endpoint += `?timeRange=${encodeURIComponent(timeRange)}`;
        return this.request(endpoint);
    }
    async getSettings() { return this.request('/settings'); }
    async updateSetting(key, value) { return this.request('/settings', { method: 'PATCH', body: JSON.stringify({ key, value }) }); }
    async getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/transactions${query ? `?${query}` : ''}`);
    }
    async getSettlementStats() { return this.request('/transactions/stats'); }
    async updateTransactionStatus(id, status, adminNote, utr) { return this.request(`/transactions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminNote, utr }) }); }
    async getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/audit/logs${query ? `?${query}` : ''}`);
    }
    async getAuditStats() { return this.request('/audit/stats'); }
    async getVehicleModels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/vehicle-models${query ? `?${query}` : ''}`);
    }
    async createVehicleModel(data) { return this.request('/vehicle-models', { method: 'POST', body: JSON.stringify(data) }); }
    async updateVehicleModel(id, data) { return this.request(`/vehicle-models/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
    async deleteVehicleModel(id) { return this.request(`/vehicle-models/${id}`, { method: 'DELETE' }); }
    async getSpareDrivers() { return this.request('/spare-drivers'); }
    async getSpareDriverBookings() { return this.request('/bookings/chauffeur'); }
    async getApartmentWashConsole() { return this.request('/apartment-wash/console'); }
    async reviewApartmentSubscription(id, action, reason = '', captainId = '') { return this.request(`/apartment-wash/subscriptions/${id}/review`, { method: 'PATCH', body: JSON.stringify({ action, reason, captainId }) }); }
    async getProductStats() { return this.request('/products/stats'); }
    async getMasterInventory() { return this.request('/products/inventory'); }
    async resolveProductDispute(data) { return this.request('/products/resolve-dispute', { method: 'POST', body: JSON.stringify(data) }); }
    async getLiveMissions() { return this.request('/products/live-missions'); }
    async download(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        const response = await this.fetchWithTimeout(url, config);
        if (!response.ok) {
            const error = new Error(`Download failed: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        return await response.blob();
    }

    async get(endpoint, options = {}) { return this.request(endpoint, { ...options, method: 'GET' }); }
    async post(endpoint, body, options = {}) { return this.request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }); }
    async put(endpoint, body, options = {}) { return this.request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }); }
    async patch(endpoint, body, options = {}) { return this.request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }); }
    async delete(endpoint, options = {}) { return this.request(endpoint, { ...options, method: 'DELETE' }); }
}

const apiClient = new ApiClient();
export default apiClient;

export const adminAPI = {
    // --- Support & Issue Management ---
    getSupportTickets: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/support/tickets${query ? `?${query}` : ''}`);
    },
    getSupportStats: () => apiClient.request('/support/tickets/stats'),
    getSupportTicket: (id) => apiClient.request(`/support/tickets/${id}`),
    updateSupportTicket: (id, data) => apiClient.request(`/support/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    login: (email, password) => apiClient.login(email, password),
    getProfile: () => apiClient.getProfile(),
    getDashboard: () => apiClient.getDashboard(),
    getUsers: (role, page, limit) => apiClient.getUsers(role, page, limit),
    createUser: (userData) => apiClient.createUser(userData),
    updateUser: (userId, userData) => apiClient.updateUser(userId, userData),
    deleteUser: (userId) => apiClient.deleteUser(userId),
    getPendingBookings: () => apiClient.getPendingBookings(),
    getAllBookings: () => apiClient.getAllBookings(),
    getCaptains: () => apiClient.getCaptains(),
    assignCaptain: (bookingId, captainId) => apiClient.assignCaptain(bookingId, captainId),
    updateBookingStatus: (id, status) => apiClient.updateBookingStatus(id, status),
    assignStaff: (bookingId, staffId, type) => apiClient.assignStaff(bookingId, staffId, type),
    getPlans: () => apiClient.getPlans(),
    getChauffeurPlans: () => apiClient.getChauffeurPlans(),
    createPlan: (data) => apiClient.createPlan(data),
    createChauffeurPlan: (data) => apiClient.createChauffeurPlan(data),
    updatePlan: (id, data) => apiClient.updatePlan(id, data),
    updateChauffeurPlan: (id, data) => apiClient.updateChauffeurPlan(id, data),
    deletePlan: (id) => apiClient.deletePlan(id),
    deleteChauffeurPlan: (id) => apiClient.deleteChauffeurPlan(id),
    getSubscriptions: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/subscriptions${query ? `?${query}` : ''}`);
    },
    getServices: (category) => apiClient.getServices(category),
    getChauffeurServicesConfig: () => apiClient.getChauffeurServicesConfig(),
    getApartmentWashConfig: () => apiClient.getApartmentWashConfig(),
    updateChauffeurServiceConfig: (id, data) => apiClient.updateChauffeurServiceConfig(id, data),
    updateApartmentWashConfig: (id, data) => apiClient.updateApartmentWashConfig(id, data),
    createService: (data) => apiClient.createService(data),
    updateService: (id, data) => apiClient.updateService(id, data),
    deleteService: (id) => apiClient.deleteService(id),
    getPromotions: (type) => apiClient.getPromotions(type),
    createPromotion: (data) => apiClient.createPromotion(data),
    updatePromotion: (id, data) => apiClient.updatePromotion(id, data),
    deletePromotion: (id) => apiClient.deletePromotion(id),
    getHubs: () => apiClient.getHubs(),
    createHub: (data) => apiClient.createHub(data),
    updateHub: (id, data) => apiClient.updateHub(id, data),
    deleteHub: (id) => apiClient.deleteHub(id),
    getProducts: (params) => apiClient.getProducts(params),
    verifyProduct: (data) => apiClient.verifyProduct(data),
    getAnalytics: (timeRange) => apiClient.getAnalytics(timeRange),
    getSettings: () => apiClient.getSettings(),
    updateSetting: (key, value) => apiClient.updateSetting(key, value),
    getTransactions: (params) => apiClient.getTransactions(params),
    getSettlementStats: () => apiClient.getSettlementStats(),
    getFinancialAnalytics: () => apiClient.request('/transactions/analytics'),
    updateTransactionStatus: (id, status, adminNote, utr) => apiClient.updateTransactionStatus(id, status, adminNote, utr),
    getAuditLogs: (params) => apiClient.getAuditLogs(params),
    getAuditStats: () => apiClient.getAuditStats(),
    getVehicleModels: (params) => apiClient.getVehicleModels(params),
    getVehicleSuggestions: () => apiClient.request('/vehicle-models/suggestions'),
    reviewVehicleSuggestion: (id, data) => apiClient.request(`/vehicle-models/${id}/review`, { method: 'PATCH', body: JSON.stringify(data) }),
    createVehicleModel: (data) => apiClient.createVehicleModel(data),
    updateVehicleModel: (id, data) => apiClient.updateVehicleModel(id, data),
    deleteVehicleModel: (id) => apiClient.deleteVehicleModel(id),
    getSpareDrivers: () => apiClient.getSpareDrivers(),
    getSpareDriverBookings: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/bookings/chauffeur${query ? `?${query}` : ''}`);
    },
    getStudioWashConsole: () => apiClient.getStudioWashConsole(),
    getApartmentWashConsole: () => apiClient.getApartmentWashConsole(),
    reviewApartmentSubscription: (id, action, reason, captainId) => apiClient.reviewApartmentSubscription(id, action, reason, captainId),
    getDispatchStats: () => apiClient.request('/dispatch/stats'),
    triggerAutoAssign: (bookingId) => apiClient.request(`/bookings/${bookingId}/auto-assign`, { method: 'POST' }),
    request: (endpoint, opts) => apiClient.request(endpoint, opts),
    setToken: (token) => apiClient.setToken(token),
    getProductStats: () => apiClient.getProductStats(),
    getMasterInventory: () => apiClient.getMasterInventory(),
    getLiveMissions: () => apiClient.getLiveMissions(),
    resolveProductDispute: (data) => apiClient.resolveProductDispute(data),
    getNotifications: (params) => {
        const filteredParams = Object.fromEntries(Object.entries(params || {}).filter(([_, v]) => v !== undefined));
        const query = new URLSearchParams(filteredParams).toString();
        return apiClient.request(`/notifications${query ? `?${query}` : ''}`);
    },
    markNotificationRead: (id) => apiClient.request(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => apiClient.request('/notifications/read-all', { method: 'POST' }),
    getSpareDriverServices: () => apiClient.request('/spare-driver/services'),
    getSpareDriverService: (type) => apiClient.request(`/spare-driver/services/${type}`),
    updateSpareDriverService: (type, data) => apiClient.request(`/spare-driver/services/${type}`, { method: 'PATCH', body: JSON.stringify(data) }),
    toggleSpareDriverService: (type) => apiClient.request(`/spare-driver/services/${type}/toggle`, { method: 'PATCH' }),
    initializeSpareDriverServices: () => apiClient.request('/spare-driver/services/initialize', { method: 'POST' }),
    getPricingConfig: () => apiClient.request('/spare-driver/pricing/config'),
    updatePricingConfig: (data) => apiClient.request('/spare-driver/pricing/config', { method: 'PATCH', body: JSON.stringify(data) }),
    calculatePrice: (data) => apiClient.request('/spare-driver/pricing/calculate', { method: 'POST', body: JSON.stringify(data) }),
    getPricingSummary: () => apiClient.request('/spare-driver/pricing/summary'),
    toggleSurge: () => apiClient.request('/spare-driver/pricing/surge/toggle', { method: 'PATCH' }),
    toggleNightCharges: () => apiClient.request('/spare-driver/pricing/night/toggle', { method: 'PATCH' }),
    getPayouts: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/spare-driver/payouts${query ? `?${query}` : ''}`);
    },
    getPayout: (id) => apiClient.request(`/spare-driver/payouts/${id}`),
    generatePayout: (data) => apiClient.request('/spare-driver/payouts/generate', { method: 'POST', body: JSON.stringify(data) }),
    generateAllPayouts: (data) => apiClient.request('/spare-driver/payouts/generate-all', { method: 'POST', body: JSON.stringify(data) }),
    addPayoutAdjustment: (id, data) => apiClient.request(`/spare-driver/payouts/${id}/adjustment`, { method: 'POST', body: JSON.stringify(data) }),
    processPayout: (id, transactionId) => apiClient.request(`/spare-driver/payouts/${id}/process`, { method: 'POST', body: JSON.stringify({ transactionId }) }),
    getPayoutStats: () => apiClient.request('/spare-driver/payouts/stats'),
    getWallets: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/finance/wallets${query ? `?${query}` : ''}`);
    },
    getWalletStats: () => apiClient.request('/finance/wallets/stats'),
    adjustWallet: (userId, data) => apiClient.request(`/finance/wallets/${userId}/adjust`, { method: 'PATCH', body: JSON.stringify(data) }),
    holdWalletAmount: (userId, data) => apiClient.request(`/finance/wallets/${userId}/hold`, { method: 'PATCH', body: JSON.stringify(data) }),
    releaseWalletHold: (userId, data) => apiClient.request(`/finance/wallets/${userId}/release`, { method: 'PATCH', body: JSON.stringify(data) }),

    // ── CHAT SUPPORT SYSTEM ─────────────────────────────────────
    getChatRooms: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/chat/rooms${query ? `?${query}` : ''}`);
    },
    getChatRoom: (roomId) => apiClient.request(`/chat/rooms/${roomId}`),
    createChatRoom: (data) => apiClient.request('/chat/rooms', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getChatMessages: (roomId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/chat/rooms/${roomId}/messages${query ? `?${query}` : ''}`);
    },
    sendChatMessage: (roomId, content) => apiClient.request(`/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
    }),
    markChatAsRead: (roomId) => apiClient.request(`/chat/rooms/${roomId}/read`, {
        method: 'PATCH'
    }),
    closeChatRoom: (roomId) => apiClient.request(`/chat/rooms/${roomId}/close`, {
        method: 'PATCH'
    }),

    // ── FILE UPLOAD ─────────────────────────────────────────────
    uploadChatFile: (formData) => apiClient.request('/chat/upload', {
        method: 'POST',
        headers: { 'Content-Type': null },
        body: formData
    }),

    // ── TASK MANAGEMENT SYSTEM ──────────────────────────────────
    getTasks: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/tasks${query ? `?${query}` : ''}`);
    },
    getTask: (id) => apiClient.request(`/tasks/${id}`),
    createTask: (data) => apiClient.request('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateTask: (id, data) => apiClient.request(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),
    deleteTask: (id) => apiClient.request(`/tasks/${id}`, {
        method: 'DELETE'
    }),
    addTaskComment: (id, data) => apiClient.request(`/tasks/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // ── REFUND MANAGEMENT ──────────────────────────────────────
    getRefundRequests: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/refunds${query ? `?${query}` : ''}`);
    },
    processRefund: (id, action, adminNote) => apiClient.request(`/refunds/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ action, adminNote })
    }),

    // ── SOCIAL MEDIA CAMPAIGNS ──────────────────────────────────
    getCampaigns: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/campaigns${query ? `?${query}` : ''}`);
    },
    getCampaignStats: () => apiClient.request('/campaigns/stats'),
    createCampaign: (data) => apiClient.request('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateCampaign: (id, data) => apiClient.request(`/campaigns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),
    deleteCampaign: (id) => apiClient.request(`/campaigns/${id}`, {
        method: 'DELETE'
    }),

    // ── EMERGENCY & SOS ──────────────────────────────────────────
    getActiveSOS: () => apiClient.request('/sos/active'),
    resolveSOS: (id) => apiClient.request(`/sos/${id}/resolve`, { method: 'PATCH' }),

    // ── SUPPORT TICKETS ──────────────────────────────────────────
    getTickets: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/support/tickets${query ? `?${query}` : ''}`);
    },
    getTicketStats: () => apiClient.request('/support/tickets/stats'),
    getTicket: (id) => apiClient.request(`/support/tickets/${id}`),
    updateTicket: (id, data) => apiClient.request(`/support/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),

    // ── ZONE MANAGEMENT ──────────────────────────────────────────
    getZones: () => apiClient.request('/zones'),
    getZone: (id) => apiClient.request(`/zones/${id}`),
    createZone: (data) => apiClient.request('/zones', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateZone: (id, data) => apiClient.request(`/zones/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    }),
    updateZoneStatus: (id, status) => apiClient.request(`/zones/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),
    deleteZone: (id) => apiClient.request(`/zones/${id}`, {
        method: 'DELETE'
    }),

    // ── REPORTING & ANALYTICS ──────────────────────────────────
    getRevenueReport: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/reports/revenue${query ? `?${query}` : ''}`);
    },
    getDriverEarningsReport: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/reports/driver-earnings${query ? `?${query}` : ''}`);
    },
    getBookingAnalytics: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/reports/bookings${query ? `?${query}` : ''}`);
    },
    getFinancialSummary: (params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/reports/financial-summary${query ? `?${query}` : ''}`);
    },
    exportReport: (format, params) => {
        const query = new URLSearchParams(params).toString();
        return apiClient.download(`/reports/export/${format}${query ? `?${query}` : ''}`);
    },

    // ── SUPER ADMIN & RBAC ──────────────────────────────────────
    getAllAdmins: () => apiClient.request('/superadmin/admins'),
    createAdmin: (data) => apiClient.request('/superadmin/admins', { method: 'POST', body: JSON.stringify(data) }),
    deleteAdmin: (id) => apiClient.request(`/superadmin/admins/${id}`, { method: 'DELETE' }),
    resetAdminPassword: (id) => apiClient.request(`/superadmin/admins/${id}/reset-password`, { method: 'POST' }),
    
    getAllRoles: () => apiClient.request('/superadmin/roles'),
    createRole: (data) => apiClient.request('/superadmin/roles', { method: 'POST', body: JSON.stringify(data) }),
    updateRole: (id, data) => apiClient.request(`/superadmin/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRole: (id) => apiClient.request(`/superadmin/roles/${id}`, { method: 'DELETE' }),
    
    getAllPermissions: () => apiClient.request('/superadmin/permissions'),
    updateRolePermissions: (roleId, permissionIds) => apiClient.request(`/superadmin/roles/${roleId}/permissions`, { 
        method: 'PATCH', 
        body: JSON.stringify({ permissions: permissionIds }) 
    })
};
