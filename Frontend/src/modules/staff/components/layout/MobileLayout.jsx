import React from 'react';

const MobileLayout = ({ children }) => {
    return (
        <div className="mobile-container bg-gray-50 min-h-screen">
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default MobileLayout;
