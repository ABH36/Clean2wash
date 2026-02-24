import { useTheme } from '../../../../context/ThemeContext';

const MobileLayout = ({ children }) => {
    const { isDarkMode } = useTheme();
    return (
        <div className={`mobile-container min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default MobileLayout;
