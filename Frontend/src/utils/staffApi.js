const API_BASE_URL = import.meta.env.VITE_STAFF_API_URL || '/api/staff';

class StaffApiClient {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('auth_staff_token') || null;
    }

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('auth_staff_token', token);
        else localStorage.removeItem('auth_staff_token');
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
                this.setToken(null);
                console.warn('Staff API returned 401 Unauthorized.');
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
            throw error;
        }
    }

    async login(email, password) {
        const res = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        const token = res.token || res.data?.token;
        if (token) this.setToken(token);
        return res;
    }

    async getProfile() {
        return this.request('/profile');
    }

    async getDashboard() {
        return this.request('/dashboard');
    }

    async getTasks() {
        return this.request('/tasks');
    }

    async getTaskById(id) {
        return this.request(`/tasks/${id}`);
    }

    async updateTaskStatus(id, data) {
        return this.request(`/tasks/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }
}

const apiClient = new StaffApiClient();

export const staffAPI = {
    login: (email, password) => apiClient.login(email, password),
    getProfile: () => apiClient.getProfile(),
    getDashboard: () => apiClient.getDashboard(),
    getTasks: () => apiClient.getTasks(),
    getTaskById: (id) => apiClient.getTaskById(id),
    updateTaskStatus: (id, data) => apiClient.updateTaskStatus(id, data),
    setToken: (token) => apiClient.setToken(token)
};
