import React from 'react';

import heroVideo from '../../assets/HEN.mp4.mp4';

const HeroSection: React.FC = () => {
    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
            {/* Background Video */}
            <video
                className="absolute inset-0 w-full h-full object-cover"
                src={heroVideo}
                autoPlay
                loop
                muted
                playsInline
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50"></div> {/* Increased overlay darkness slightly for better contrast */}

            {/* Content - Apply the new font and adjust text styles */}
            <div className="relative z-10 text-center text-white max-w-4xl px-6 font-script"> {/* Apply script font to parent */}

                {/* Top two lines grouped together with small spacing */}
                <div className="mb-10"> {/* Increased margin-bottom for a larger gap */}
                    <p className="text-3xl md:text-4xl font-medium mb-2"> {/* Adjusted size and spacing */}
                        90% of Global Chicken Meat is BROILER
                    </p>
                    <p className="text-3xl md:text-4xl font-medium"> {/* Matched size to the line above */}
                        A lot can be made - More Sustainable
                    </p>
                </div>

                {/* Main heading */}
                <h2 className="text-5xl md:text-7xl font-bold"> {/* Increased size and removed tracking */}
                    Together, Shall we!
                </h2>
            </div>

            {/* You can keep or remove the scroll indicator as needed */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <div
                    className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center cursor-pointer"
                    onClick={() => document.getElementById('make-difference')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;