import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Update state with error details
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // TODO: Send error to logging service in production
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const { error, errorInfo, errorCount } = this.state;
            const isDevelopment = process.env.NODE_ENV === 'development';

            // If error keeps happening, suggest reload
            const shouldSuggestReload = errorCount > 2;

            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-red-200 dark:border-red-900">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <AlertTriangle size={40} className="text-red-600 dark:text-red-400" />
                            </div>
                        </div>

                        {/* Error Title */}
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
                            Oops! Something went wrong
                        </h1>

                        {/* Error Description */}
                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                            {shouldSuggestReload 
                                ? 'The application encountered a persistent error. Please try reloading the page.'
                                : 'We encountered an unexpected error. Don\'t worry, your data is safe.'}
                        </p>

                        {/* Error Details (Development Only) */}
                        {isDevelopment && error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                                    Error Details (Development Mode):
                                </h3>
                                <p className="text-xs text-red-700 dark:text-red-400 font-mono mb-2">
                                    {error.toString()}
                                </p>
                                {errorInfo && errorInfo.componentStack && (
                                    <details className="mt-2">
                                        <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                                            Component Stack
                                        </summary>
                                        <pre className="mt-2 text-xs text-red-700 dark:text-red-400 overflow-auto max-h-40 p-2 bg-white dark:bg-gray-900 rounded">
                                            {errorInfo.componentStack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        )}

                        {/* Error Count Warning */}
                        {errorCount > 1 && (
                            <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <p className="text-sm text-yellow-800 dark:text-yellow-300 text-center">
                                    ⚠️ This error has occurred {errorCount} times. Consider reloading the page.
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <RefreshCw size={18} />
                                Try Again
                            </button>

                            {shouldSuggestReload && (
                                <button
                                    onClick={this.handleReload}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    <RefreshCw size={18} />
                                    Reload Page
                                </button>
                            )}

                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                            >
                                <Home size={18} />
                                Go Home
                            </button>
                        </div>

                        {/* Support Info */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                If this problem persists, please contact support at{' '}
                                <a 
                                    href="mailto:support@sparedriver.in" 
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    support@sparedriver.in
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
