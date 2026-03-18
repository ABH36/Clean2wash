/**
 * Sanitizes a phone number by removing non-digit characters and 
 * stripping leading '0' or '+91' to ensure a clean 10-digit number.
 * @param {string} phone - The raw phone number input
 * @returns {string} - The sanitized 10-digit phone number
 */
exports.sanitizePhone = (phone) => {
    if (!phone) return '';

    // Remove all non-digit characters
    let cleaned = phone.toString().replace(/\D/g, '');

    // Remove leading '91' if it's 12 digits (with nation code)
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        cleaned = cleaned.slice(2);
    }

    // Remove leading '0' if it's 11 digits
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
        cleaned = cleaned.slice(1);
    }

    // Final check: if it's still longer than 10, take the last 10
    if (cleaned.length > 10) {
        cleaned = cleaned.slice(-10);
    }

    return cleaned;
};
