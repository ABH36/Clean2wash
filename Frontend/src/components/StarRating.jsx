import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

/**
 * StarRating Component
 * Reusable star rating component with interactive selection
 * 
 * @param {number} rating - Current rating value (0-5)
 * @param {function} onRatingChange - Callback when rating changes
 * @param {number} size - Star size in pixels (default: 32)
 * @param {boolean} readonly - If true, stars are not clickable (default: false)
 * @param {boolean} showValue - Show numeric value next to stars (default: false)
 */
const StarRating = ({ 
    rating = 0, 
    onRatingChange, 
    size = 32, 
    readonly = false,
    showValue = false,
    className = ''
}) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    const displayRating = hoverRating || rating;
    
    const handleClick = (value) => {
        if (!readonly && onRatingChange) {
            onRatingChange(value);
        }
    };
    
    const handleMouseEnter = (value) => {
        if (!readonly) {
            setHoverRating(value);
        }
    };
    
    const handleMouseLeave = () => {
        if (!readonly) {
            setHoverRating(0);
        }
    };
    
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                    <motion.button
                        key={value}
                        type="button"
                        whileTap={!readonly ? { scale: 0.9 } : {}}
                        onClick={() => handleClick(value)}
                        onMouseEnter={() => handleMouseEnter(value)}
                        onMouseLeave={handleMouseLeave}
                        disabled={readonly}
                        className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                        style={{ width: size, height: size }}
                    >
                        <Star
                            size={size}
                            className={`transition-all ${
                                value <= displayRating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'fill-transparent text-gray-300 dark:text-gray-600'
                            }`}
                            strokeWidth={2}
                        />
                    </motion.button>
                ))}
            </div>
            
            {showValue && (
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
};

export default StarRating;
