import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Wheat,
  Recycle,
  Zap,
  Droplets,
  Truck,
  LogOut,
  Settings,
  Menu,
  X,
  FileText,
  ClipboardList
} from 'lucide-react';
import silvergrey from '../assets/silvergrey.jpg';

const navigationItems = [
  { path: '/general', label: 'GENERAL', icon: ClipboardList, color: 'text-pink-400', hoverColor: 'hover:text-pink-300' },
  { path: '/form', label: 'FEED', icon: Wheat, color: 'text-green-400', hoverColor: 'hover:text-green-300' },
  { path: '/manure', label: 'Manure', icon: Recycle, color: 'text-yellow-400', hoverColor: 'hover:text-yellow-300' },
  { path: '/energy', label: 'Energy', icon: Zap, color: 'text-blue-400', hoverColor: 'hover:text-blue-300' },
  { path: '/waste', label: 'Waste', icon: Droplets, color: 'text-cyan-400', hoverColor: 'hover:text-cyan-300' },
  { path: '/transport', label: 'Transport', icon: Truck, color: 'text-purple-400', hoverColor: 'hover:text-purple-300' },
  { path: '/review', label: 'Review', icon: FileText, color: 'text-teal-400', hoverColor: 'hover:text-teal-300' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showAdminAccess, setShowAdminAccess] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (location.pathname === '/auth' || location.pathname === '/admin') {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount >= 4) {
      setShowAdminAccess(true);
      setTimeout(() => {
        setShowAdminAccess(false);
        setClickCount(0);
      }, 10000);
    }
    setTimeout(() => setClickCount(0), 3000);
  };

  const isActivePage = (path) => location.pathname === path;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-gray-300 backdrop-blur-lg border-b border-white/10"
      style={{
        backgroundImage: `url(${silvergrey})`,
        backgroundSize: 'cover',
        backgroundPosition: 'left'
      }}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between h-16 px-4">
        {/* Logo - Aligned to the far left */}
        <motion.div
          className="flex-shrink-0 ml-4 cursor-pointer"
          onClick={handleLogoClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.h1
            className="text-xl font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            GHG EMISSION TRACKER
          </motion.h1>
        </motion.div>

        {/* Desktop Navigation - Centered absolutely */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-1 bg-black/50 border border-white/10 rounded-xl p-1">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActivePage(item.path);

              return (
                <motion.button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : `text-gray-300 hover:bg-white/10 ${item.hoverColor}`
                    }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (index + 1) }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-3 mr-4">
          {/* Admin Access (Desktop) */}
          <AnimatePresence>
            {showAdminAccess && (
              <motion.button
                onClick={() => navigate('/admin')}
                className="hidden md:flex items-center space-x-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-300 hover:text-gray-200 px-3 py-2 rounded-lg text-sm transition-all duration-300"
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Logout Button (Desktop) */}
          <motion.button
            onClick={handleLogout}
            className="hidden md:flex items-center space-x-2 bg-transparent hover:bg-red-600/30 text-red-500 hover:text-red-300 px-3 py-2 rounded-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-white/10 bg-black/30 backdrop-blur-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isActivePage(item.path);

                return (
                  <motion.button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-all duration-300 ${isActive
                      ? 'bg-white/20 text-white'
                      : `text-gray-300 hover:bg-white/10 ${item.hoverColor}`
                      }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                );
              })}

              {/* Mobile Admin Access */}
              {showAdminAccess && (
                <motion.button
                  onClick={() => {
                    navigate('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-300 hover:text-gray-200 transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Settings className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </motion.button>
              )}

              {/* Mobile Logout */}
              <motion.button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-300"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}