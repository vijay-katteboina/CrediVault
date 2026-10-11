import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './StudentDashboard.css'

function StudentDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the authenticated user's profile.
  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem('credivaultToken')

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')

          navigate('/login', { replace: true })
          return
        }

        setError(
          err.response?.data?.message ||
          'Unable to load your profile. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  // Log out the current user.
  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  // Navigate to the Student Wallet.
  const handleOpenWallet = () => {
    navigate('/student/wallet')
  }

  // Display a loading state while fetching the profile.
  if (loading) {
    return (
      <main className="student-page">
        <section className="dashboard-card">
          <p>Loading your dashboard...</p>
        </section>
      </main>
    )
  }

  // Display an error if the profile cannot be loaded.
  if (error) {
    return (
      <main className="student-page">
        <section className="dashboard-card">
          <h1>Unable to Load Dashboard</h1>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
          >
            Go to Login
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="student-page">
      {/* Dashboard Header */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">CrediVault</p>

          <h1>Student Dashboard</h1>

          <p className="dashboard-subtitle">
            Welcome back, {user?.fullName}
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </header>

      {/* Welcome Card */}
      <section className="welcome-card">
        <div>
          <p className="card-label">WELCOME</p>

          <h2>{user?.fullName}</h2>

          <p>
            Manage and access your academic credentials securely through
            CrediVault.
          </p>
        </div>

        <div className="status-badge">
          {user?.accountStatus}
        </div>
      </section>

      {/* Student Profile */}
      <section className="profile-grid">
        <article className="info-card">
          <span className="info-label">Full Name</span>
          <strong>{user?.fullName}</strong>
        </article>

        <article className="info-card">
          <span className="info-label">Email</span>
          <strong>{user?.email}</strong>
        </article>

        <article className="info-card">
          <span className="info-label">Role</span>
          <strong>{user?.role}</strong>
        </article>

        <article className="info-card">
          <span className="info-label">Account Status</span>
          <strong>{user?.accountStatus}</strong>
        </article>
      </section>

      {/* Quick Actions */}
      <section className="quick-section">
        <div className="section-heading">
          <p className="card-label">QUICK ACTIONS</p>

          <h2>Your Academic Credentials</h2>
        </div>

        <div className="action-grid">
          {/* My Wallet */}
          <button
            type="button"
            className="action-card"
            onClick={handleOpenWallet}
          >
            <span className="action-icon">🎓</span>

            <span>
              <strong>My Wallet</strong>
              <small>View your academic credentials</small>
            </span>
          </button>

          {/* Verification History - Coming in a later step */}
          <button
            type="button"
            className="action-card"
            disabled
            title="Verification History is coming soon"
          >
            <span className="action-icon">✓</span>

            <span>
              <strong>Verification History</strong>
              <small>Coming soon</small>
            </span>
          </button>
        </div>
      </section>
    </main>
  )
}

export default StudentDashboard