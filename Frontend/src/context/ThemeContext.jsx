import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            const saved = localStorage.getItem('carwash_dark_mode');
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    useEffect(() => {
        localStorage.setItem('carwash_dark_mode', JSON.stringify(isDarkMode));
        const root = document.documentElement;
        const body = document.body;
        
        if (isDarkMode) {
            root.classList.add('dark_mode_active');
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
            body.classList.add('dark');
        } else {
            root.classList.remove('dark_mode_active');
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
            body.classList.remove('dark');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, toggleTheme: toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};
