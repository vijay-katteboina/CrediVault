import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../services/api'
import RoleLayout from '../../components/layout/RoleLayout'
import './StudentWallet.css'

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

function StudentWallet() {
  const navigate = useNavigate()

  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleQrCredentialId, setVisibleQrCredentialId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadWallet = async () => {
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
        const response = await api.get('/student/wallet')
        if (!cancelled) setWallet(response.data)
      } catch (err) {
        if (cancelled) return

        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')
          navigate('/login', { replace: true })
          return
        }

        setError(
          err.response?.data?.message ||
            'Unable to load your wallet. Please try again.',
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadWallet()

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
    if (key === 'dashboard') navigate('/student')
    else navigate('/student/wallet')
  }

  const formatDate = (value) => {
    if (!value) return 'Not available'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-IN')
  }

  const toggleQrCode = (credentialId) => {
    setVisibleQrCredentialId((current) =>
      current === credentialId ? null : credentialId,
    )
  }

  const credentials = wallet?.credentials ?? []
  const activeCount = credentials.filter(
    (credential) => String(credential.status || '').toUpperCase() === 'ACTIVE',
  ).length
  const revokedCount = credentials.filter(
    (credential) => String(credential.status || '').toUpperCase() === 'REVOKED',
  ).length

  const studentProfile = {
    fullName: wallet?.fullName,
    email: wallet?.email,
    role: 'STUDENT',
    institutionName: wallet?.institutionName,
  }

  return (
    <RoleLayout
      role="STUDENT"
      navItems={STUDENT_NAV_ITEMS}
      activeKey="wallet"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      profile={studentProfile}
      profileLoading={loading}
    >
      {loading ? (
        <div className="wallet-state-card" role="status">
          <div className="wallet-spinner" />
          <p>Loading your academic credentials...</p>
        </div>
      ) : error ? (
        <section className="wallet-state-card wallet-error-card" role="alert">
          <h2>Unable to Load Wallet</h2>
          <p>{error}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </section>
      ) : (
        <div className="wallet-workspace">
          <section className="wallet-profile-panel">
            <div className="wallet-avatar">
              {wallet?.fullName?.charAt(0)?.toUpperCase() || 'S'}
            </div>

            <div className="wallet-profile-info">
              <p className="wallet-section-label">CREDENTIAL HOLDER</p>
              <h2>{wallet?.fullName || 'Student'}</h2>
              <p>{wallet?.email || 'Email not available'}</p>
              <p>{wallet?.studentNumber || 'Student number unavailable'} · {wallet?.course || 'Course unavailable'}</p>
              <p>{wallet?.institutionName || 'Institution not available'}</p>
            </div>

            <div className="wallet-academic-year">
              <span>Academic Year</span>
              <strong>{wallet?.academicYear || 'Not available'}</strong>
            </div>
          </section>

          <section className="wallet-stats-grid" aria-label="Credential summary">
            <article className="wallet-stat-card">
              <span>Total Credentials</span>
              <strong>{credentials.length}</strong>
              <small>Issued to you</small>
            </article>
            <article className="wallet-stat-card">
              <span>Active Credentials</span>
              <strong>{activeCount}</strong>
              <small>Currently active</small>
            </article>
            <article className="wallet-stat-card">
              <span>Revoked Credentials</span>
              <strong>{revokedCount}</strong>
              <small>No longer valid</small>
            </article>
          </section>

          <section className="wallet-credentials-section">
            <div className="wallet-section-heading">
              <div>
                <p className="wallet-section-label">YOUR RECORDS</p>
                <h2>Academic Credentials</h2>
                <p className="wallet-section-description">
                  View your issued credentials and present their verification QR codes.
                </p>
              </div>
              <span className="wallet-count">
                {credentials.length} {credentials.length === 1 ? 'credential' : 'credentials'}
              </span>
            </div>

            {credentials.length === 0 ? (
              <div className="wallet-empty-state">
                <div className="wallet-empty-icon" aria-hidden="true">🎓</div>
                <h3>No Credentials Yet</h3>
                <p>Your issued academic credentials will appear here.</p>
              </div>
            ) : (
              <div className="wallet-credential-grid">
                {credentials.map((credential) => {
                  const status = String(credential.status || 'UNKNOWN').toUpperCase()
                  const qrVisible = visibleQrCredentialId === credential.credentialId

                  return (
                    <article className="wallet-credential-card" key={credential.credentialId}>
                      <div className="credential-card-top">
                        <div className="credential-icon" aria-hidden="true">🎓</div>
                        <span className={`credential-status ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </div>

                      <div className="credential-card-body">
                        <p className="wallet-section-label">ACADEMIC CREDENTIAL</p>
                        <h3>{credential.credentialType || 'Academic Credential'}</h3>
                        <p className="credential-description">
                          Issued by {wallet?.institutionName || 'your institution'}
                        </p>
                      </div>

                      <div className="credential-details">
                        <div>
                          <span>Credential ID</span>
                          <strong>{credential.credentialId}</strong>
                        </div>
                        <div>
                          <span>Credential Code</span>
                          <strong className="credential-code">
                            {credential.credentialCode || 'Not available'}
                          </strong>
                        </div>
                        <div>
                          <span>Issued At</span>
                          <strong>{formatDate(credential.issuedAt)}</strong>
                        </div>
                      </div>

                      <div className="credential-qr-actions">
                        <button
                          type="button"
                          className="credential-qr-toggle"
                          disabled={!credential.credentialCode}
                          aria-expanded={qrVisible}
                          aria-controls={`credential-qr-${credential.credentialId}`}
                          onClick={() => toggleQrCode(credential.credentialId)}
                        >
                          {qrVisible ? 'Hide QR Code' : 'Show QR Code'}
                        </button>
                      </div>

                      {qrVisible && (
                        <div
                          className="credential-qr-panel"
                          id={`credential-qr-${credential.credentialId}`}
                        >
                          <p className="wallet-section-label">CREDENTIAL VERIFICATION QR</p>
                          <QRCodeSVG
                            value={credential.credentialCode}
                            size={184}
                            level="M"
                            includeMargin
                            title={`QR code for ${credential.credentialCode}`}
                          />
                          <p className="credential-qr-instruction">
                            Present this QR code to an authorized CrediVault verifier.
                          </p>
                          <p className="credential-qr-reference">
                            {credential.credentialCode}
                          </p>
                          <p className="credential-qr-note">
                            This QR code contains only your credential reference. Your academic
                            information is retrieved and verified securely by the CrediVault backend.
                          </p>
                        </div>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </RoleLayout>
  )
}

export default StudentWallet
