import React, { useState } from 'react';
import Header from './Header';
import HeroSection from './HeroSection';
import CallToAction from './CallToAction';
import Footer from './Footer';

const HomePage = () => {
    // State to control the glow effect
    const [isGlowing, setIsGlowing] = useState(false);

    // This function will be called from the CallToAction component
    const handleStartClick = () => {
        // Scroll to the top of the page smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trigger the glow effect
        setIsGlowing(true);

        // Reset the glow effect after the animation finishes (2 seconds)
        setTimeout(() => {
            setIsGlowing(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans">
            {/* Pass the glowing state to the Header */}
            <Header shouldGlow={isGlowing} />
            <main>
                <HeroSection />
                {/* Pass the handler function to the CallToAction button */}
                <CallToAction onStartClick={handleStartClick} />
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;