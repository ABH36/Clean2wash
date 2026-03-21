try {
    console.log('Attempting to require User model...');
    const User = require('./Backend/models/User');
    console.log('User model loaded successfully');
} catch (error) {
    console.error('Error loading User model:', error);
}
