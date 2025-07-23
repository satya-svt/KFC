// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/context/ThemeContext'; // <-- IMPORT THIS

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* WRAP YOUR APP WITH THE PROVIDER */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);