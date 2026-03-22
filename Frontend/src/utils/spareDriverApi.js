const API_BASE_URL = import.meta.env.VITE_SPAREDRIVERS_API_URL || '/api/sparedrivers';

class SpareDriverApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('chauffeur_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('chauffeur_token', token);
        else localStorage.removeItem('chauffeur_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const isFormData = options.body instanceof FormData;

        const config = {
            headers: {
                // Don't set Content-Type for FormData — browser sets it with boundary
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
            if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
            return data;
        } catch (error) {
            console.error('SpareDriver API Error:', error);
            throw error;
        }
    }

    // ── Driver methods ──
    async register(driverData) {
        const data = await this.request('/register', {
            method: 'POST',
            body: JSON.stringify(driverData),
        });
        const token = data.token || data.data?.token;
        if (token) this.setToken(token);
        return data;
    }

    async uploadDocs(formData) {
        // formData is a FormData instance with aadhaarCard, drivingLicense, selfie files
        return this.request('/upload-docs', {
            method: 'POST',
            body: formData,
        });
    }

    async getProfile() {
        return this.request('/profile');
    }

    async getBookings() {
        return this.request('/bookings');
    }

    async acceptBooking(id) {
        return this.request(`/bookings/${id}/accept`, {
            method: 'PATCH'
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

    // ── Admin methods (uses admin JWT stored as consumer token) ──
    adminRequest(endpoint, options = {}) {
        const adminToken = localStorage.getItem('auth_admin_token'); // admin token
        const url = `${this.baseURL}${endpoint}`;
        return fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
            },
            ...options,
        }).then(async res => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Admin API error');
            return data;
        });
    }

    async adminGetDrivers(status) {
        const qs = status ? `?status=${status}` : '';
        return this.adminRequest(`/admin/drivers${qs}`);
    }

    async adminVerifyDriver(id, status, adminNote = '') {
        return this.adminRequest(`/admin/drivers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status, adminNote }),
        });
    }

    async registerFCMToken(token, platform) {
        return this.request('/fcm-token', {
            method: 'POST',
            body: JSON.stringify({ token, platform }),
        });
    }
}

export const spareDriverAPI = new SpareDriverApiClient();

