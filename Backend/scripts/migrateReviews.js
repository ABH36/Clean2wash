const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const User = require('../models/User');

const migrateReviews = async () => {
    try {
        console.log('Starting Review Migration...');

        // Find all bookings with feedback that haven't been migrated yet
        const bookingsWithFeedback = await Booking.find({
            'feedback.rating': { $exists: true, $ne: null },
            isActive: true
        });

        console.log(`Found ${bookingsWithFeedback.length} bookings with feedback.`);

        let migratedCount = 0;
        let skippedCount = 0;

        for (const booking of bookingsWithFeedback) {
            try {
                // Check if a review already exists for this booking
                const existingReview = await Review.findOne({
                    refId: booking._id,
                    refModel: 'Booking'
                });

                if (existingReview) {
                    skippedCount++;
                    continue;
                }

                // Create new Review
                await Review.create({
                    user: booking.consumer,
                    refId: booking._id,
                    refModel: 'Booking',
                    targetId: booking._id,
                    targetModel: 'Booking',
                    providerId: booking.provider?.id,
                    providerModel: booking.provider?.model,
                    rating: booking.feedback.rating,
                    comment: booking.feedback.review || '',
                    images: booking.feedback.photos || [],
                    isVerifiedPurchase: booking.status === 'completed',
                    createdAt: booking.feedback.submittedAt || booking.updatedAt
                });

                migratedCount++;
            } catch (err) {
                console.error(`Failed to migrate booking ${booking._id}:`, err.message);
            }
        }

        console.log('Migration Complete!');
        console.log(`Migrated: ${migratedCount}`);
        console.log(`Skipped (Already existed): ${skippedCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    }
};

// This script is intended to be run within the backend environment
module.exports = migrateReviews;
