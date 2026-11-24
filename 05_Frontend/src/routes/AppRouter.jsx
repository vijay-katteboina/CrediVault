import LoginPage from '../pages/auth/LoginPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'

import StudentDashboard from '../pages/student/StudentDashboard'
import StudentWallet from '../pages/student/StudentWallet'

import VerifierDashboard from '../pages/verifier/VerifierDashboard'
import VerifierHistory from '../pages/verifier/VerifierHistory'

import IssuerDashboard from '../pages/issuer/IssuerDashboard'

import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUserManagement from '../pages/admin/AdminUserManagement'
import IssuerManagement from '../pages/admin/IssuerManagement'
import InstitutionManagement from '../pages/admin/InstitutionManagement'
import AuditManagement from '../pages/admin/AuditManagement'

import HomePage from '../pages/public/HomePage'

import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

const ROLE_ROUTES = {
  STUDENT: '/student',
  ISSUER: '/issuer',
  VERIFIER: '/verifier',
  ADMIN: '/admin',
}

function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem('credivaultToken')
  const role = (localStorage.getItem('credivaultRole') || '').toUpperCase()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={ROLE_ROUTES[role] || '/login'}
        replace
      />
    )
  }

  return children
}

function Placeholder({ title }) {
  return (
    <main className="not-found-page">
      <section className="cv-card not-found-card" aria-labelledby="not-found-title">
        <h1 id="not-found-title">{title}</h1>
        <p>This CrediVault page is under development.</p>
        <Link to="/" className="cv-button cv-button--primary">
          Back to Home
        </Link>
      </section>
    </main>
  )
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        {/* Public Credential Verification */}
        <Route
          path="/verify"
          element={<VerifierDashboard />}
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/wallet"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentWallet />
            </ProtectedRoute>
          }
        />

        {/* Verifier Routes */}
        <Route
          path="/verifier"
          element={<Navigate to="/verify" replace />}
        />

        <Route
          path="/verifier/history"
          element={
            <ProtectedRoute allowedRoles={['VERIFIER']}>
              <VerifierHistory />
            </ProtectedRoute>
          }
        />

        {/* Issuer Routes */}
        <Route
          path="/issuer"
          element={
            <ProtectedRoute allowedRoles={['ISSUER']}>
              <IssuerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/issuers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <IssuerManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/institutions"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <InstitutionManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditManagement />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={<Placeholder title="404 - Page Not Found" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter