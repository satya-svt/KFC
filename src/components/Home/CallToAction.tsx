import React from 'react';
import { Play, Download } from 'lucide-react';

// The component now accepts an 'onStartClick' prop
const CallToAction: React.FC<{ onStartClick: () => void }> = ({ onStartClick }) => {
    return (
        <section id="make-difference" className="py-20 bg-gradient-to-br from-red-500 via-red-600 to-orange-600">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
                    Ready to Make a Difference?
                </h2>
                <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed">
                    Join thousands of farmers and consumers taking action to reduce carbon emissions from poultry farming.
                    Every sustainable choice counts, and together we can create lasting impact for our planet.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    {/* The onClick handler now calls the function from props */}
                    <button
                        onClick={onStartClick}
                        className="flex items-center gap-3 bg-white text-red-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        <Play size={20} />
                        Let's Get Started!
                    </button>
                    <button className="flex items-center gap-3 border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-red-600 transition-all duration-300 transform hover:scale-105">
                        <Download size={20} />
                        Download Action Guide
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CallToAction;