import React from 'react';

const TestPage = () => {
    return (
        <div className="p-6">
            <div className="admin-card">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Test Page</h1>
                <p className="text-[var(--text-secondary)]">
                    This is a test page to verify that routing is working correctly.
                    If you can see this content, then the routing system is functioning properly.
                </p>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="admin-card-compact">
                        <h3 className="font-bold text-[var(--text-primary)]">Test Card 1</h3>
                        <p className="text-sm text-[var(--text-secondary)]">This is test content</p>
                    </div>
                    
                    <div className="admin-card-compact">
                        <h3 className="font-bold text-[var(--text-primary)]">Test Card 2</h3>
                        <p className="text-sm text-[var(--text-secondary)]">This is test content</p>
                    </div>
                    
                    <div className="admin-card-compact">
                        <h3 className="font-bold text-[var(--text-primary)]">Test Card 3</h3>
                        <p className="text-sm text-[var(--text-secondary)]">This is test content</p>
                    </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">✅ Routing Test Successful</h4>
                    <p className="text-green-700 text-sm">
                        If you can see this message, it means:
                    </p>
                    <ul className="text-green-700 text-sm mt-2 list-disc list-inside">
                        <li>React Router is working</li>
                        <li>AdminLayout is rendering correctly</li>
                        <li>CSS variables are loading</li>
                        <li>Component lazy loading is working</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TestPage;