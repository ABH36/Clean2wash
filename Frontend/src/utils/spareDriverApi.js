const API_BASE_URL = import.meta.env.VITE_SPAREDRIVERS_API_URL || '/api/sparedrivers';

class SpareDriverApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('chauffeur_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('chauffeur_token', token);
        } else {
            localStorage.removeItem('chauffeur_token');
        }
    }

    clearToken() {
        this.setToken(null);
    }

    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const isFormData = options.body instanceof FormData;

        const config = {
            headers: {
                ...(!isFormData && { 'Content-Type': 'application/json' }),
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            if (response.status === 204) return null;

            const data = await response.json();
            if (response.status === 401) {
                this.clearToken();
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('SpareDriver API Error:', error);
            throw error;
        }
    }

    async register(driverData) {
        const data = await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(driverData),
        });
        const token = data.token || data.data?.token;
        if (token) this.setToken(token);
        return data;
    }

    async registerComplete(formData) {
        const data = await this.request('/register-complete', {
            method: 'POST',
            body: formData,
        });
        const token = data.token || data.data?.token;
        if (token) this.setToken(token);
        return data;
    }

    async sendSignupOTP(phone, userData) {
        return this.request('/auth/send-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, userData })
        });
    }

    async verifySignupOTP(phone, otp) {
        const data = await this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp })
        });
        const token = data.token || data.data?.token;
        if (token) this.setToken(token);
        return data;
    }

    async login(credentials) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        const token = data.token || data.data?.token;
        if (token) this.setToken(token);
        return data;
    }

    async uploadDocs(formData) {
        return this.request('/upload-docs', {
            method: 'POST',
            body: formData,
        });
    }

    async getKitPaymentKey() {
        return this.request('/kit-payment/key');
    }

    async createKitPaymentOrder() {
        return this.request('/kit-payment/order', {
            method: 'POST'
        });
    }

    async verifyKitPayment(paymentData) {
        return this.request('/kit-payment/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async getKitConfig() {
        return this.request('/kit-config');
    }

    async getPremiumConfig() {
        return this.request('/premium-config');
    }

    async submitKitPayment(formData) {
        return this.request('/kit-payment', {
            method: 'POST',
            body: formData,
        });
    }

    async getProfile() {
        return this.request('/profile');
    }

    async updateProfilePicture(formData) {
        return this.request('/profile-picture', {
            method: 'PATCH',
            body: formData,
        });
    }

    async uploadPoliceVerification(formData) {
        return this.request('/police-verification', {
            method: 'PATCH',
            body: formData,
        });
    }

    async updateProfile(payload) {
        return this.request('/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }

    async submitInquiry(payload) {
        return this.request('/inquiry', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
    }

    async getBookings() {
        return this.request('/bookings');
    }

    async acceptBooking(id) {
        return this.request(`/bookings/${id}/accept`, {
            method: 'PATCH'
        });
    }

    async rejectBooking(id, reason = '') {
        return this.request(`/bookings/${id}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ reason })
        });
    }

    async updateBookingStatus(id, status, pin = null) {
        return this.request(`/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status, pin })
        });
    }

    getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/transactions${query ? `?${query}` : ''}`);
    }

    async getTripHistory() {
        return this.request('/history');
    }

    async cancelBooking(id, reason = '') {
        return this.request(`/bookings/${id}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({ reason })
        });
    }

    async updateLocation(lat, lng) {
        return this.request('/location', {
            method: 'PATCH',
            body: JSON.stringify({ lat, lng })
        });
    }

    async reportEmergency(data) {
        return this.request('/emergency', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async toggleOnline(isOnline) {
        return this.request('/toggle-online', {
            method: 'PATCH',
            body: JSON.stringify({ isOnline })
        });
    }

    async getNotifications(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/notifications${query ? `?${query}` : ''}`);
    }

    async markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, {
            method: 'PATCH'
        });
    }

    async clearNotifications() {
        return this.request('/notifications/clear', {
            method: 'DELETE'
        });
    }

    async getDutyStats() {
        return this.request('/duty-stats');
    }

    async updateAvailability(availabilitySlots) {
        return this.request('/availability', {
            method: 'PATCH',
            body: JSON.stringify({ availabilitySlots })
        });
    }

    adminRequest(endpoint, options = {}) {
        const adminToken = localStorage.getItem('auth_admin_token');
        const url = `${this.baseURL}${endpoint}`;

        return fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
            },
            ...options,
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Admin API error');
            return data;
        });
    }

    async adminGetDrivers(status, scope = 'assigned') {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (scope) params.set('scope', scope);
        const qs = params.toString() ? `?${params.toString()}` : '';
        return this.adminRequest(`/admin/drivers${qs}`);
    }

    async adminRebalanceDriverQueue() {
        return this.adminRequest('/admin/drivers/rebalance-queue', {
            method: 'POST'
        });
    }

    async adminVerifyDriver(id, status, adminNote = '') {
        return this.adminRequest(`/admin/drivers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, adminNote }),
        });
    }

    async adminUpdatePremiumVerification(id, action, reason = '') {
        return this.adminRequest(`/admin/drivers/${id}/premium`, {
            method: 'PATCH',
            body: JSON.stringify({ action, reason }),
        });
    }

    async adminAssignBooking(id, driverId, adminNote = '') {
        return this.adminRequest(`/admin/bookings/${id}/assign`, {
            method: 'PATCH',
            body: JSON.stringify({ driverId, adminNote }),
        });
    }

    async adminReleaseBooking(id, reason = '') {
        return this.adminRequest(`/admin/bookings/${id}/release`, {
            method: 'PATCH',
            body: JSON.stringify({ reason }),
        });
    }

    async adminCancelBooking(id, reason = '') {
        return this.adminRequest(`/admin/bookings/${id}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify({ reason }),
        });
    }

    async adminUpdateBookingIssue(id, issueId, status, adminNote = '') {
        return this.adminRequest(`/admin/bookings/${id}/issue`, {
            method: 'PATCH',
            body: JSON.stringify({ issueId, status, adminNote }),
        });
    }

    async registerFCMToken(token, platform) {
        return this.request('/fcm-token', {
            method: 'POST',
            body: JSON.stringify({ token, platform }),
        });
    }

    // Chat and Communication Methods
    async getBooking(bookingId) {
        return this.request(`/bookings/${bookingId}`);
    }

    async getChatMessages(bookingId) {
        return this.request(`/bookings/${bookingId}/messages`);
    }

    async sendChatMessage(bookingId, messageData) {
        return this.request(`/bookings/${bookingId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    async sendLocation(bookingId, location) {
        return this.request(`/bookings/${bookingId}/location`, {
            method: 'POST',
            body: JSON.stringify({ location })
        });
    }

    async markChatAsRead(bookingId) {
        return this.request(`/bookings/${bookingId}/messages/read`, {
            method: 'PATCH'
        });
    }

    async getUnreadMessageCount() {
        return this.request('/messages/unread-count');
    }

    async getActiveChats() {
        return this.request('/messages/active-chats');
    }

    async uploadChatFile(formData) {
        return this.request('/chat/upload', {
            method: 'POST',
            body: formData
        });
    }

    async addMessageReaction(bookingId, messageId, reaction) {
        return this.request(`/bookings/${bookingId}/messages/${messageId}/reaction`, {
            method: 'POST',
            body: JSON.stringify({ reaction })
        });
    }

    async removeMessageReaction(bookingId, messageId, reaction) {
        return this.request(`/bookings/${bookingId}/messages/${messageId}/reaction`, {
            method: 'DELETE',
            body: JSON.stringify({ reaction })
        });
    }

    async startVoiceCall(bookingId) {
        return this.request(`/bookings/${bookingId}/call/start`, {
            method: 'POST'
        });
    }

    async endVoiceCall(bookingId, callId) {
        return this.request(`/bookings/${bookingId}/call/${callId}/end`, {
            method: 'PATCH'
        });
    }

    // Earnings and Payout Methods
    async getEarningsSummary() {
        return this.request('/earnings/summary');
    }

    async getTodayEarnings() {
        return this.request('/earnings/today');
    }

    async getWeeklyEarnings() {
        return this.request('/earnings/weekly');
    }

    async getMonthlyEarnings() {
        return this.request('/earnings/monthly');
    }

    async getPayoutHistory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/payouts${query ? `?${query}` : ''}`);
    }

    async requestWithdrawal(withdrawalData) {
        return this.request('/payouts/withdrawal', {
            method: 'POST',
            body: JSON.stringify(withdrawalData)
        });
    }

    // Advanced Tracking Methods
    async getETAToCustomer(bookingId) {
        return this.request(`/bookings/${bookingId}/eta`);
    }

    async getOptimizedRoute(bookingId) {
        return this.request(`/bookings/${bookingId}/route`);
    }

    async shareLocationWithCustomer(bookingId, location) {
        return this.request(`/bookings/${bookingId}/share-location`, {
            method: 'POST',
            body: JSON.stringify(location)
        });
    }

    // Fraud Detection Methods
    async reportSuspiciousActivity(reportData) {
        return this.request('/fraud/report', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
    }

    async getFraudAlerts() {
        return this.request('/fraud/alerts');
    }

    async acknowledgeFraudAlert(alertId) {
        return this.request(`/fraud/alerts/${alertId}/acknowledge`, {
            method: 'PATCH'
        });
    }
}

export const spareDriverAPI = new SpareDriverApiClient();
