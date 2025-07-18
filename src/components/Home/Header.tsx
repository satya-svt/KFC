import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserPlus } from 'lucide-react';

// The component now accepts a 'shouldGlow' prop
const Header: React.FC<{ shouldGlow: boolean }> = ({ shouldGlow }) => {
    const navigate = useNavigate();

    // Conditionally add the 'animate-glow' class based on the prop
    const buttonClasses = `flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20 ${shouldGlow ? 'animate-glow' : ''
        }`;

    return (
        <header className="absolute top-0 left-0 right-0 z-50 p-6">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-white">
                    <h1 className="text-2xl font-bold tracking-wider">
                        GHG<br />
                        EMISSION<br />
                        TRACKER
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/auth')} className={buttonClasses}>
                        <User size={18} />
                        Login
                    </button>
                    <button onClick={() => navigate('/auth')} className={buttonClasses}>
                        <UserPlus size={18} />
                        Register
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;