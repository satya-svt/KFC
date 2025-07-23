// src/context/ThemeContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        // 1. Check for a saved theme in the browser's storage
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            return savedTheme;
        }
        // 2. If no saved theme, default to light mode
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove the old theme class and add the new one
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);

        // Save the current theme choice to storage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};