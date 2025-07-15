import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import UserForm from './components/UserForm'
import AdminDashboard from './components/AdminDashboard'
import AuthPage from './components/AuthPage'
import ProtectedRoute from './components/ProtectedRoute'
import ManureManagement from './components/ManureManagement'
import EnergyProcessing from './components/EnergyProcessing'
import WasteManagement from './components/WasteManagement'
import Transport from './components/Transport'

function App() {
  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        
        <Route path="/form" element={
          <ProtectedRoute>
            <UserForm />
          </ProtectedRoute>
        } />
        <Route path="/manure" element={
          <ProtectedRoute>
            <ManureManagement />
          </ProtectedRoute>
        } />
        <Route path="/energy" element={
          <ProtectedRoute>
            <EnergyProcessing />
          </ProtectedRoute>
        } />
        <Route path="/waste" element={
          <ProtectedRoute>
            <WasteManagement />
          </ProtectedRoute>
        } />
        <Route path="/transport" element={
          <ProtectedRoute>
            <Transport />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </motion.div>
  )
}

export default App