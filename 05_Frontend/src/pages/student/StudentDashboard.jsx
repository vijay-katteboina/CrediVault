import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import RoleLayout from '../../components/layout/RoleLayout'
import {
  Alert,
  Button,
  Card,
  ErrorState,
  Spinner,
  StatusBadge,
} from '../../components/ui'
import './StudentDashboard.css'

const STUDENT_NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    pageTitle: 'Student Dashboard',
    description: 'View your academic profile and credential overview.',
    icon: '⌂',
  },
  {
    key: 'wallet',
    label: 'My Credential Wallet',
    pageTitle: 'My Credential Wallet',
    description: 'Access your issued academic credentials and QR presentations.',
    icon: '▣',
  },
]

function StudentDashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [walletError, setWalletError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadStudentDashboard = async () => {
      const token = localStorage.getItem('credivaultToken')
      const role = (localStorage.getItem('credivaultRole') || '').toUpperCase()

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      if (role !== 'STUDENT') {
        const roleRoutes = {
          ADMIN: '/admin',
          ISSUER: '/issuer',
          VERIFIER: '/verifier',
        }
        navigate(roleRoutes[role] || '/login', { replace: true })
        return
      }

      try {
        const [profileResult, walletResult] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/student/wallet'),
        ])

        if (cancelled) return

        if (profileResult.status === 'rejected') {
          const status = profileResult.reason?.response?.status
          if (status === 401) {
            localStorage.removeItem('credivaultToken')
            localStorage.removeItem('credivaultRole')
            navigate('/login', { replace: true })
            return
          }
          throw profileResult.reason
        }

        setUser(profileResult.value.data)

        if (walletResult.status === 'fulfilled') {
          setWallet(walletResult.value.data)
        } else {
          const walletStatus = walletResult.reason?.response?.status
          if (walletStatus === 401) {
            localStorage.removeItem('credivaultToken')
            localStorage.removeItem('credivaultRole')
            navigate('/login', { replace: true })
            return
          }
          setWalletError(
            walletResult.reason?.response?.data?.message ||
              'Credential statistics are temporarily unavailable. You can still view your profile.',
          )
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              'Unable to load your student profile. Please try again.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadStudentDashboard()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')
    navigate('/login', { replace: true })
  }

  const handleNavigate = (key) => {
    if (key === 'wallet') navigate('/student/wallet')
    else navigate('/student')
  }

  const credentials = wallet?.credentials ?? []
  const activeCount = credentials.filter(
    (credential) => String(credential.status || '').toUpperCase() === 'ACTIVE',
  ).length
  const revokedCount = credentials.filter(
    (credential) => String(credential.status || '').toUpperCase() === 'REVOKED',
  ).length

  const studentProfile = {
    fullName: wallet?.fullName || user?.fullName,
    email: wallet?.email || user?.email,
    role: user?.role || 'STUDENT',
    accountStatus: user?.accountStatus,
    institutionName: wallet?.institutionName || user?.institutionName,
  }

  return (
    <RoleLayout
      role="STUDENT"
      navItems={STUDENT_NAV_ITEMS}
      activeKey="dashboard"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      profile={studentProfile}
      profileLoading={loading}
    >
      {loading ? (
        <Spinner
          label="Loading your student dashboard..."
          className="student-state-card"
        />
      ) : error ? (
        <ErrorState
          title="Unable to Load Dashboard"
          description={error}
          action={(
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          )}
          className="student-state-card student-error-card"
        />
      ) : (
        <div className="student-dashboard-content">
          <Card className="student-welcome-panel">
            <div className="student-welcome-avatar">
              {(user?.fullName || 'Student').trim().charAt(0).toUpperCase()}
            </div>
            <div className="student-welcome-copy">
              <p className="student-eyebrow">WELCOME TO CREDIVAULT</p>
              <h2>Hello, {user?.fullName || 'Student'}!</h2>
              <p>
                Your academic credentials are available in one secure place.
                Open your wallet to view or present an issued credential.
              </p>
            </div>
            <StatusBadge
              status={user?.accountStatus || 'STATUS UNKNOWN'}
              className="student-account-badge"
            />
          </Card>

          <section className="student-stat-grid" aria-label="Credential summary">
            <Card as="article" className="student-stat-card">
              <span>Total Credentials</span>
              <strong>{wallet ? credentials.length : '—'}</strong>
              <small>Credentials issued to you</small>
            </Card>
            <Card as="article" className="student-stat-card">
              <span>Active Credentials</span>
              <strong>{wallet ? activeCount : '—'}</strong>
              <small>Currently valid credentials</small>
            </Card>
            <Card as="article" className="student-stat-card">
              <span>Revoked Credentials</span>
              <strong>{wallet ? revokedCount : '—'}</strong>
              <small>Credentials no longer valid</small>
            </Card>
          </section>

          {walletError && (
            <Alert variant="info" className="student-inline-notice">
              {walletError}
            </Alert>
          )}

          <Card className="student-details-panel">
            <div className="student-panel-heading">
              <div>
                <p className="student-eyebrow">STUDENT INFORMATION</p>
                <h2>My Academic Profile</h2>
              </div>
              <span className="student-role-chip">STUDENT</span>
            </div>

            <div className="student-profile-grid">
              <div className="student-profile-field">
                <span>Full Name</span>
                <strong>{wallet?.fullName || user?.fullName || 'Not available'}</strong>
              </div>
              <div className="student-profile-field">
                <span>Email Address</span>
                <strong>{wallet?.email || user?.email || 'Not available'}</strong>
              </div>
              <div className="student-profile-field">
                <span>Student Number</span>
                <strong>{wallet?.studentNumber || 'Not available'}</strong>
              </div>
              <div className="student-profile-field">
                <span>Course</span>
                <strong>{wallet?.course || 'Not available'}</strong>
              </div>
              <div className="student-profile-field">
                <span>Academic Year</span>
                <strong>{wallet?.academicYear || 'Not available'}</strong>
              </div>
              <div className="student-profile-field">
                <span>Institution</span>
                <strong>{wallet?.institutionName || 'Not available'}</strong>
              </div>
            </div>
          </Card>

          <Card className="student-quick-actions">
            <div className="student-panel-heading">
              <div>
                <p className="student-eyebrow">QUICK ACCESS</p>
                <h2>Your Credentials</h2>
              </div>
            </div>

            <Button
              variant="secondary"
              className="student-open-wallet-card"
              onClick={() => navigate('/student/wallet')}
            >
              <span className="student-action-icon">▣</span>
              <span className="student-action-copy">
                <strong>My Credential Wallet</strong>
                <small>View credential details and display your verification QR codes.</small>
              </span>
              <span className="student-action-arrow">→</span>
            </Button>
          </Card>
        </div>
      )}
    </RoleLayout>
  )
}

export default StudentDashboard
