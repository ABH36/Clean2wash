import { adminAPI } from '../../../utils/adminApi';

class DriverService {
    // ── Driver Registry ─────────────────────────────────────────────
    async getAllDrivers(params = {}) {
        return adminAPI.getSpareDrivers();
    }

    async getDriverById(id) {
        return adminAPI.get(`/spare-drivers/${id}`);
    }

    // ── Actions ──────────────────────────────────────────────────
    async updateDriverStatus(id, status, adminNote = '') {
        return adminAPI.patch(`/spare-drivers/${id}`, { status, adminNote });
    }

    async approveDriver(id) {
        return adminAPI.patch(`/drivers/${id}/approve`, {});
    }

    async rejectDriver(id, reason) {
        return adminAPI.patch(`/drivers/${id}/reject`, { reason });
    }
}

export const driverService = new DriverService();
