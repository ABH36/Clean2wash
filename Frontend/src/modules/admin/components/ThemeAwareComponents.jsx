/**
 * Theme-Aware Components for Admin Panel
 * These components automatically adapt to light/dark themes
 */

import React from 'react';

// Card Component - Always uses theme variables
export const ThemeCard = ({ children, className = '', hover = false, ...props }) => {
    return (
        <div
            className={`bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-6 transition-colors ${
                hover ? 'hover:bg-[var(--card-hover)]' : ''
            } ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

// Text Components
export const ThemeText = {
    Primary: ({ children, className = '', ...props }) => (
        <span className={`text-[var(--text-primary)] ${className}`} {...props}>
            {children}
        </span>
    ),
    Secondary: ({ children, className = '', ...props }) => (
        <span className={`text-[var(--text-secondary)] ${className}`} {...props}>
            {children}
        </span>
    ),
    Muted: ({ children, className = '', ...props }) => (
        <span className={`text-[var(--text-muted)] ${className}`} {...props}>
            {children}
        </span>
    ),
};

// Table Component - Theme-aware
export const ThemeTable = ({ children, className = '' }) => {
    return (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow overflow-hidden">
            <table className={`min-w-full divide-y divide-[var(--border)] ${className}`}>
                {children}
            </table>
        </div>
    );
};

export const ThemeTableHead = ({ children }) => {
    return (
        <thead className="bg-[var(--bg-secondary)]">
            {children}
        </thead>
    );
};

export const ThemeTableBody = ({ children }) => {
    return (
        <tbody className="bg-[var(--card)] divide-y divide-[var(--border)]">
            {children}
        </tbody>
    );
};

export const ThemeTableRow = ({ children, hover = true, ...props }) => {
    return (
        <tr
            className={hover ? 'hover:bg-[var(--card-hover)] transition-colors' : ''}
            {...props}
        >
            {children}
        </tr>
    );
};

export const ThemeTableHeader = ({ children, className = '' }) => {
    return (
        <th className={`px-6 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider ${className}`}>
            {children}
        </th>
    );
};

export const ThemeTableCell = ({ children, className = '' }) => {
    return (
        <td className={`px-6 py-4 text-sm text-[var(--text-primary)] ${className}`}>
            {children}
        </td>
    );
};

// Badge Component - Theme-aware with status colors
export const ThemeBadge = ({ children, variant = 'neutral', className = '' }) => {
    const variants = {
        success: 'bg-[var(--success-light)] text-[var(--success-text)]',
        warning: 'bg-[var(--warning-light)] text-[var(--warning-text)]',
        error: 'bg-[var(--error-light)] text-[var(--error-text)]',
        neutral: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
        primary: 'bg-[var(--primary-light)] text-[var(--primary)]',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

// Button Component - Theme-aware
export const ThemeButton = ({ children, variant = 'primary', className = '', ...props }) => {
    const variants = {
        primary: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white',
        secondary: 'bg-[var(--bg-secondary)] hover:bg-[var(--card-hover)] text-[var(--text-primary)] border border-[var(--border)]',
        danger: 'bg-[var(--error)] hover:bg-red-700 text-white',
        ghost: 'bg-transparent hover:bg-[var(--card-hover)] text-[var(--text-primary)]',
    };

    return (
        <button
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// Input Component - Theme-aware
export const ThemeInput = ({ className = '', ...props }) => {
    return (
        <input
            className={`w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors ${className}`}
            {...props}
        />
    );
};

// Select Component - Theme-aware
export const ThemeSelect = ({ children, className = '', ...props }) => {
    return (
        <select
            className={`w-full px-3 py-2 bg-[var(--card)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

// Stat Card Component - Theme-aware
export const ThemeStatCard = ({ title, value, icon: Icon, iconColor = 'blue', trend, className = '' }) => {
    const iconColors = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    };

    return (
        <ThemeCard className={className}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-[var(--text-secondary)]">{title}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
                    {trend && (
                        <p className={`text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className={`p-3 rounded-lg ${iconColors[iconColor]}`}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
        </ThemeCard>
    );
};

// Tab Component - Theme-aware
export const ThemeTabs = ({ tabs, activeTab, onChange, className = '' }) => {
    return (
        <div className={`border-b border-[var(--border)] ${className}`}>
            <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => onChange(tab.value)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                            activeTab === tab.value
                                ? 'border-[var(--primary)] text-[var(--primary)]'
                                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default {
    Card: ThemeCard,
    Text: ThemeText,
    Table: ThemeTable,
    TableHead: ThemeTableHead,
    TableBody: ThemeTableBody,
    TableRow: ThemeTableRow,
    TableHeader: ThemeTableHeader,
    TableCell: ThemeTableCell,
    Badge: ThemeBadge,
    Button: ThemeButton,
    Input: ThemeInput,
    Select: ThemeSelect,
    StatCard: ThemeStatCard,
    Tabs: ThemeTabs,
};
