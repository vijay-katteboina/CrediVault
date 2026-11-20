import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './AdminDashboard.css'

const METRICS = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    description: 'All registered system accounts',
    icon: '👥',
  },
  {
    key: 'totalStudents',
    label: 'Student Profiles',
    description: 'Registered academic profiles',
    icon: '🎓',
  },
  {
    key: 'totalIssuers',
    label: 'Total Issuers',
    description: 'Authorized issuer accounts',
    icon: '🏛️',
  },
  {
    key: 'totalInstitutions',
    label: 'Institutions',
    description: 'Registered institutions',
    icon: '🏢',
  },
  {
    key: 'activeAccounts',
    label: 'Active Accounts',
    description: 'Currently active user accounts',
    icon: '✅',
  },
  {
    key: 'inactiveAccounts',
    label: 'Inactive Accounts',
    description: 'Currently inactive user accounts',
    icon: '⏸️',
  },
  {
    key: 'totalAuditEvents',
    label: 'Audit Events',
    description: 'Recorded system activities',
    icon: '📋',
  },
]

function AdminDashboard() {
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Handle API errors and expired sessions.
  const handleApiError = useCallback((err) => {
    const status = err.response?.status

    if (status === 401) {
      localStorage.removeItem('credivaultToken')
      localStorage.removeItem('credivaultRole')

      navigate('/login', { replace: true })
      return
    }

    if (status === 403) {
      setError('Access denied. Administrator permissions are required.')
      return
    }

    setError(
      err.response?.data?.message ||
      'Unable to load administrator dashboard statistics.'
    )
  }, [navigate])

  // Load dashboard statistics.
  useEffect(() => {
    let mounted = true

    const loadDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard')

        if (mounted) {
          setStats(response.data)
          setError('')
        }
      } catch (err) {
        if (mounted) {
          handleApiError(err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [handleApiError])

  // Refresh dashboard statistics.
  const refreshDashboard = async () => {
    setRefreshing(true)
    setError('')

    try {
      const response = await api.get('/admin/dashboard')
      setStats(response.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setRefreshing(false)
    }
  }

  // Logout administrator.
  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  // Format metric values.
  const formatNumber = (value) => {
    if (value === undefined || value === null) {
      return '—'
    }

    return Number(value).toLocaleString('en-IN')
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-dashboard-container">

        {/* Header */}
        <header className="admin-header">
          <div className="admin-header-brand">
            <p className="admin-brand-name">CrediVault</p>
            <span className="admin-role-badge">ADMINISTRATOR</span>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* Page heading */}
        <section className="admin-page-heading">
          <div>
            <p className="admin-section-kicker">
              SYSTEM CONTROL CENTER
            </p>

            <h1>Administrator Dashboard</h1>

            <p className="admin-page-subtitle">
              Monitor users, institutions, academic credentials and system
              activities from one place.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={refreshDashboard}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh Data'}
          </button>
        </section>

        {/* Welcome card */}
        <section className="admin-welcome-card">
          <div className="admin-welcome-icon">
            CV
          </div>

          <div>
            <p className="admin-section-kicker">
              SYSTEM OVERVIEW
            </p>

            <h2>Welcome, Administrator</h2>

            <p>
              Your CrediVault system statistics are retrieved directly from
              the backend database.
            </p>
          </div>

          <span className="admin-system-status">
            <span className="admin-status-dot" />
            Backend Connected
          </span>
        </section>

        {/* Error message */}
        {error && (
          <div className="admin-error-message" role="alert">
            {error}
          </div>
        )}

        {/* Platform statistics */}
        <section className="admin-statistics-section">
          <div className="admin-section-heading">
            <div>
              <p className="admin-section-kicker">
                SYSTEM PERFORMANCE
              </p>

              <h2>Platform Statistics</h2>
            </div>

            <span className="admin-live-label">
              Live API Data
            </span>
          </div>

          <div className="admin-metrics-grid">
            {METRICS.map((metric) => (
              <article
                className="admin-metric-card"
                key={metric.key}
              >
                <div className="admin-metric-top">
                  <div className="admin-metric-icon">
                    {metric.icon}
                  </div>

                  <span className="admin-metric-indicator">
                    {loading ? 'Loading' : 'Database'}
                  </span>
                </div>

                <p className="admin-metric-label">
                  {metric.label}
                </p>

                <h3 className="admin-metric-value">
                  {loading
                    ? '...'
                    : formatNumber(stats?.[metric.key])}
                </h3>

                <p className="admin-metric-description">
                  {metric.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Management modules */}
        <section className="admin-management-section">
          <div className="admin-section-heading">
            <div>
              <p className="admin-section-kicker">
                ADMINISTRATION
              </p>

              <h2>Management Modules</h2>

              <p className="admin-page-subtitle">
                Centralized control of CrediVault resources.
              </p>
            </div>
          </div>

          <div className="admin-management-grid">

            {/* User Management */}
            <article className="admin-management-card">
              <span>👥</span>

              <h3>User Management</h3>

              <p>
                Review registered accounts and manage user account status.
              </p>

              <button
                type="button"
                className="admin-open-module-button"
                onClick={() => navigate('/admin/users')}
              >
                Open User Management →
              </button>
            </article>

            {/* Issuer Management */}
            <article className="admin-management-card">
              <span>🏛️</span>

              <h3>Issuer Management</h3>

              <p>
                Review issuer accounts, institution associations and issuer
                account status.
              </p>

              <button
                type="button"
                className="admin-open-module-button"
                onClick={() => navigate('/admin/issuers')}
              >
                Open Issuer Management →
              </button>
            </article>

            {/* Institution Management */}
            <article className="admin-management-card">
              <span>🏢</span>

              <h3>Institution Management</h3>

              <p>
                Review registered institutions and their account status.
              </p>

              <button
                type="button"
                className="admin-open-module-button"
                onClick={() => navigate('/admin/institutions')}
              >
                Open Institution Management →
              </button>
            </article>

            {/* Audit Management */}
            <article className="admin-management-card">
          <span>📋</span>

          <h3>Audit Management</h3>

          <p>
            Inspect administrative operations and recorded system
            activities.
          </p>

          <button
            type="button"
            className="admin-open-module-button"
            onClick={() => navigate('/admin/audit-logs')}
          >
            Open Audit Management →
          </button>
        </article>

          </div>
        </section>

        {/* Footer */}
        <footer className="admin-dashboard-footer">
          CrediVault · Digital Academic Credential Issuance and Verification
          System
        </footer>

      </div>
    </main>
  )
}

export default AdminDashboard