import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserPlus, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Header: React.FC<{ shouldGlow: boolean }> = ({ shouldGlow }) => {
    const navigate = useNavigate();

    const buttonClasses = `flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20`;

    const glowStyle = {
        animation: 'glow 1s ease-in-out 4'
    };

    // 🔹 State for secret button logic
    const [clickCount, setClickCount] = useState(0);
    const [showAdminAccess, setShowAdminAccess] = useState(false);

    // 🔹 Click handler for "GHG EMISSION TRACKER"
    const handleTitleClick = () => {
        setClickCount(prev => prev + 1);

        if (clickCount >= 4) { // On 5th click
            setShowAdminAccess(true);

            // Hide after 10 seconds
            setTimeout(() => {
                setShowAdminAccess(false);
                setClickCount(0);
            }, 10000);
        }

        // Reset clicks if pause > 3 seconds
        setTimeout(() => setClickCount(0), 3000);
    };

    return (
        <header className="absolute top-0 left-0 right-0 z-50 p-6">
            <div className="container mx-auto flex justify-between items-center">
                {/* 🔹 Clickable title */}
                <div className="text-white cursor-pointer" onClick={handleTitleClick}>
                    <h1 className="text-2xl font-bold tracking-wider">
                        GHG<br />
                        EMISSION<br />
                        TRACKER
                    </h1>
                </div>

                <div className="flex gap-4 items-center">
                    {/* 🔹 Show hidden admin button when unlocked */}
                    <AnimatePresence>
                        {showAdminAccess && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => navigate('/admin')}
                                className={buttonClasses}
                            >
                                <Settings size={18} />
                                Admin
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => navigate('/auth')}
                        className={buttonClasses}
                        style={shouldGlow ? glowStyle : {}}
                    >
                        <User size={18} />
                        Login
                    </button>
                    <button
                        onClick={() => navigate('/auth?mode=signup')}
                        className={buttonClasses}
                        style={shouldGlow ? glowStyle : {}}
                    >
                        <UserPlus size={18} />
                        Register
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
