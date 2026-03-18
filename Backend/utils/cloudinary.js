const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary
 * @param {String} file - Base64 string or file path
 * @param {String} folder - Folder name in Cloudinary
 * @returns {Promise} - Cloudinary upload result
 */
exports.uploadImage = async (file, folder = 'clean2wash/vendors') => {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder,
            resource_type: 'auto'
        });
        return result;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new Error('Image upload failed');
    }
};

module.exports = exports;
