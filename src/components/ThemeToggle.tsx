// src/components/ThemeToggle.tsx
import React from 'react';
import { useTheme } from './context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-300 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-400 dark:hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle theme"
        >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </motion.button>
    );
};