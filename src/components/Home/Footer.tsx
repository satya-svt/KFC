import React from 'react';
import { Mail, Globe, Users } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-white py-16">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Climate Action Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                                <Globe size={20} />
                            </div>
                            <h3 className="text-2xl font-bold">Climate Action</h3>
                        </div>
                        <p className="text-gray-300 leading-relaxed">
                            Empowering farmers and communities to reduce carbon emissions
                            from poultry farming through sustainable practices, education,
                            and innovative solutions for a greener future.
                        </p>
                    </div>


                    {/* Contact Info - This div is now forced into the 3rd column */}
                    <div className="md:col-start-3">
                        <h4 className="text-xl font-semibold mb-6 text-red-400">Contact Info</h4>
                        <div className="space-y-4">
                            {/* Corrected 'items-right' to 'items-center' */}
                            <div className="flex items-center gap-3">
                                <Mail size={18} className="text-red-400" />
                                <a href="mailto:sandeep.pathuri25@gmail.com" className="text-gray-300 hover:text-white transition-colors duration-300">
                                   
                                </a>
                            </div>
                            {/* Corrected 'items-right' to 'items-center' */}
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-red-400" />
                              
                            </div>
                            {/* Corrected 'items-right' to 'items-center' */}

                        </div>
                    </div>
                </div>

                {/* Bottom Border */}
               
            </div>
        </footer>
    );
};

export default Footer;