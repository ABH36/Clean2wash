import React from 'react';
import { MapPin, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

/**
 * Zone Badge Component
 * Shows zone availability status and information
 */
const ZoneBadge = ({ 
    zoneInfo, 
    available = true, 
    className = '', 
    showIcon = true,
    size = 'md' 
}) => {
    if (!zoneInfo && available) return null;

    const getStatusConfig = () => {
        if (available && zoneInfo) {
            return {
                icon: CheckCircle,
                bgColor: 'bg-green-50',
                textColor: 'text-green-700',
                borderColor: 'border-green-200',
                iconColor: 'text-green-500'
            };
        } else if (!available) {
            return {
                icon: XCircle,
                bgColor: 'bg-red-50',
                textColor: 'text-red-700',
                borderColor: 'border-red-200',
                iconColor: 'text-red-500'
            };
        } else {
            return {
                icon: AlertTriangle,
                bgColor: 'bg-yellow-50',
                textColor: 'text-yellow-700',
                borderColor: 'border-yellow-200',
                iconColor: 'text-yellow-500'
            };
        }
    };

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'px-2 py-1 text-xs';
            case 'lg':
                return 'px-4 py-3 text-base';
            default:
                return 'px-3 py-2 text-sm';
        }
    };

    const config = getStatusConfig();
    const StatusIcon = config.icon;
    const sizeClasses = getSizeClasses();

    const displayText = available && zoneInfo 
        ? `Service available in ${zoneInfo.displayName || zoneInfo.name}`
        : 'Service not available in this area';

    return (
        <div className={`
            inline-flex items-center gap-2 rounded-lg border
            ${config.bgColor} ${config.textColor} ${config.borderColor}
            ${sizeClasses} ${className}
        `}>
            {showIcon && (
                <StatusIcon 
                    size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} 
                    className={config.iconColor}
                />
            )}
            <span className="font-medium">
                {displayText}
            </span>
            {zoneInfo?.code && (
                <span className="text-xs opacity-75 font-mono">
                    {zoneInfo.code}
                </span>
            )}
        </div>
    );
};

export default ZoneBadge;