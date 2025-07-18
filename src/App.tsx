import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import the new HomePage
import HomePage from './components/Home/HomePage';

// Import other components
import Navbar from './components/Navbar';
import UserForm from './components/UserForm';
import AdminDashboard from './components/AdminDashboard';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import ManureManagement from './components/ManureManagement';
import EnergyProcessing from './components/EnergyProcessing';
import WasteManagement from './components/WasteManagement';
import Transport from './components/Transport';
import ReviewDownload from './components/ReviewDownload';

// This new layout component will wrap all protected pages to give them the Navbar
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Navbar />
    <motion.div
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans pt-16"
    >
      {children}
    </motion.div>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      {/* --- Route Updated --- */}
      {/* Route 1: The new public home page. It doesn't have the main Navbar. */}
      <Route path="/" element={<HomePage />} />

      {/* Route 2: The public authentication page. */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Route 3: The admin dashboard. */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* --- Protected Routes with Navbar --- */}
      {/* These routes are for logged-in users and will have the main Navbar. */}
      <Route path="/form" element={<ProtectedLayout><UserForm /></ProtectedLayout>} />
      <Route path="/manure" element={<ProtectedLayout><ManureManagement /></ProtectedLayout>} />
      <Route path="/energy" element={<ProtectedLayout><EnergyProcessing /></ProtectedLayout>} />
      <Route path="/waste" element={<ProtectedLayout><WasteManagement /></ProtectedLayout>} />
      <Route path="/transport" element={<ProtectedLayout><Transport /></ProtectedLayout>} />
      <Route path="/review" element={<ProtectedLayout><ReviewDownload /></ProtectedLayout>} />
    </Routes>
  );
}

export default App;