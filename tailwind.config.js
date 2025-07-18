/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Kept your existing font setting
        script: ['Kalam', 'cursive'],
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.6)',
            borderColor: 'rgba(255, 255, 255, 0.6)'
          },
          '50%': {
            boxShadow: '0 0 20px rgba(255, 255, 255, 1)',
            borderColor: 'rgba(255, 255, 255, 1)'
          },
        },
      },
      animation: {
        // Changed from 'infinite' to '2' to make it run twice
        glow: 'glow 1s ease-in-out 2',
      },
    },
  },
  plugins: [],
};