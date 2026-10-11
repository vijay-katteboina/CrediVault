import LoginPage from '../pages/auth/LoginPage'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentWallet from '../pages/student/StudentWallet'
import VerifierDashboard from '../pages/verifier/VerifierDashboard'
import VerifierHistory from '../pages/verifier/VerifierHistory'
import IssuerDashboard from '../pages/issuer/IssuerDashboard'

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

function Placeholder({ title }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{title}</h1>
      <p>This CrediVault page is under development.</p>
    </div>
  )
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Student pages */}
        <Route
          path="/student"
          element={<StudentDashboard />}
        />

        <Route
          path="/student/wallet"
          element={<StudentWallet />}
        />

        {/* Verifier pages */}
        <Route
          path="/verifier/history"
          element={<VerifierHistory />}
        />

        <Route
          path="/verifier"
          element={<VerifierDashboard />}
        />

        {/* Issuer page */}
        <Route
          path="/issuer"
          element={<IssuerDashboard />}
        />

        {/* Administrator page */}
        <Route
          path="/admin"
          element={<Placeholder title="Administrator Dashboard" />}
        />

        {/* 404 page */}
        <Route
          path="*"
          element={<Placeholder title="404 - Page Not Found" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter