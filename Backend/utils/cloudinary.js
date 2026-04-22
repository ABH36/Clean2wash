const cloudinary = require('cloudinary').v2;

// Function to ensure cloudinary is configured
const configureCloudinary = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn('⚠️ Cloudinary configuration missing! Check your .env file.');
        return false;
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });
    return true;
};

// Initial config
configureCloudinary();

/**
 * Upload an image to Cloudinary
 * @param {String} file - Base64 string or file path
 * @param {String} folder - Folder name in Cloudinary
 * @returns {Promise} - Cloudinary upload result
 */
exports.uploadImage = async (file, folder = 'clean2wash/vendors') => {
    try {
        // Ensure config is applied (in case env vars were loaded late)
        configureCloudinary();

        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: 'auto'
        });
        return result;
    } catch (error) {
        console.error('❌ Cloudinary Upload Error Details:', error);
        throw new Error(error.message || 'Image upload failed');
    }
};

module.exports = exports;

