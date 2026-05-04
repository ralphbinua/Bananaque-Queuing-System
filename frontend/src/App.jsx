import React from 'react'
import { Routes, Route } from 'react-router-dom'

// Auth
import LogInPage  from './pages/LogInPage'
import SignUpPage from './pages/SignUpPage'

// Customer
import UserDashboard   from './pages/user/UserDashboard'
import CustomerHistory from './pages/user/CustomerHistory'

// Staff
import StaffDashboard from './pages/staff/StaffDashboard'

// Admin
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminQueuePage  from './pages/admin/AdminQueuePage'
import ManageUsers     from './pages/admin/ManageUsers'
import ManageService   from './pages/admin/ManageService'

const App = () => {
  return (
    <div>
      <Routes>
        {/* Auth */}
        <Route path="/"       element={<LogInPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Customer */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/history"   element={<CustomerHistory />} />

        {/* Staff */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />

        {/* Admin */}
        <Route path="/admin"                element={<AdminDashboard />} />
        <Route path="/admin/queue/:dept"    element={<AdminQueuePage />} />
        <Route path="/admin/users"          element={<ManageUsers />} />
        <Route path="/admin/service"        element={<ManageService />} />
      </Routes>
    </div>
  )
}

export default App