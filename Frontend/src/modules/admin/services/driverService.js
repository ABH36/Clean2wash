import apiClient from '../../../utils/adminApi';

class DriverService {
    // ── Driver Registry ─────────────────────────────────────────────
    async getAllDrivers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiClient.request(`/drivers${query ? `?${query}` : ''}`);
    }

    async getDriverById(id) {
        return apiClient.request(`/drivers/${id}`);
    }

    // ── Actions ──────────────────────────────────────────────────
    async approveDriver(id) {
        return apiClient.request(`/drivers/${id}/approve`, { method: 'PATCH' });
    }

    async rejectDriver(id, reason) {
        return apiClient.request(`/drivers/${id}/reject`, {
            method: 'PATCH',
            body: JSON.stringify({ reason })
        });
    }

    async updateKitStatus(id, kitStatus) {
        return apiClient.request(`/drivers/${id}/kit`, {
            method: 'PATCH',
            body: JSON.stringify({ kitStatus })
        });
    }

    async updatePoliceVerification(id, policeVerification) {
        return apiClient.request(`/drivers/${id}/police`, {
            method: 'PATCH',
            body: JSON.stringify({ policeVerification })
        });
    }

    async updateDriverStatus(id, status) {
        return apiClient.request(`/drivers/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }) // ACTIVE or BLOCKED
        });
    }
}

export const driverService = new DriverService();
