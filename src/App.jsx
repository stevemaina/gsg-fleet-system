// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Public
import HomePage from './pages/public/HomePage'

// Admin
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import DriversPage from './pages/admin/DriversPage'
import TrucksPage from './pages/admin/TrucksPage'
import ReportsPage from './pages/admin/ReportsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />

          {/* Admin Auth */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Admin Protected */}
          <Route path="/admin/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/admin/drivers" element={<ProtectedRoute><DriversPage /></ProtectedRoute>} />
          <Route path="/admin/trucks" element={<ProtectedRoute><TrucksPage /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
