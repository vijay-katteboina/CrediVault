import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../services/api'
import RoleLayout from '../../components/layout/RoleLayout'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Spinner,
  StatusBadge,
} from '../../components/ui'
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
  const [downloadingCredentialId, setDownloadingCredentialId] = useState(null)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadWallet = async () => {
      const token = localStorage.getItem('credivaultToken')

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const response = await api.get('/student/wallet')
        if (isMounted) setWallet(response.data)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')
          navigate('/login', { replace: true })
          return
        }

        if (isMounted) {
          setError(
            err.response?.data?.message ||
            'Unable to load your wallet. Please try again.'
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadWallet()
    return () => {
      isMounted = false
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')
    navigate('/login', { replace: true })
  }

  const handleNavigate = (key) => {
    navigate(key === 'dashboard' ? '/student' : '/student/wallet')
  }

  const formatDate = (value) => {
    if (!value) return 'Not available'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString()
  }

  const toggleQrCode = (credentialId) => {
    setVisibleQrCredentialId((current) =>
      current === credentialId ? null : credentialId
    )
  }

  const handleDownloadCertificate = async (credential) => {
    if (!credential?.credentialId || credential.status !== 'ACTIVE') return

    setDownloadError('')
    setDownloadingCredentialId(credential.credentialId)

    try {
      const response = await api.get(
        `/student/credentials/${credential.credentialId}/certificate`,
        { responseType: 'blob' }
      )

      const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
      const objectUrl = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `CrediVault-Certificate-${credential.credentialId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('credivaultToken')
        localStorage.removeItem('credivaultRole')
        navigate('/login', { replace: true })
        return
      }

      let message = 'Unable to download the certificate. Please try again.'

      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text()
          const errorBody = JSON.parse(errorText)
          message = errorBody.message || message
        } catch {
          // Keep the fallback message when the server response is not JSON.
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message
      }

      setDownloadError(message)
    } finally {
      setDownloadingCredentialId(null)
    }
  }

  const credentials = wallet?.credentials ?? []
  const activeCount = credentials.filter(
    (credential) => credential.status === 'ACTIVE'
  ).length
  const revokedCount = credentials.filter(
    (credential) => credential.status === 'REVOKED'
  ).length
  const displayName = wallet?.fullName || 'Student'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'S'

  return (
    <RoleLayout
      role="STUDENT"
      navItems={STUDENT_NAV_ITEMS}
      activeKey="wallet"
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      profile={{
        fullName: wallet?.fullName,
        email: wallet?.email,
        role: 'STUDENT',
        institutionName: wallet?.institutionName,
      }}
      profileLoading={loading}
    >
      {loading ? (
        <Spinner label="Loading your academic credentials..." className="wallet-state-card" />
      ) : error ? (
        <ErrorState
          title="Unable to Load Wallet"
          description={error}
          action={(
            <div className="wallet-state-actions">
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="ghost" onClick={() => navigate('/student')}>
                Back to Dashboard
              </Button>
            </div>
          )}
          className="wallet-state-card wallet-message"
        />
      ) : (
      <div className="wallet-page">
        <div className="wallet-container">
        <div className="wallet-workspace">
          <Card className="wallet-profile-panel">
            <div className="wallet-avatar" aria-hidden="true">{initial}</div>

            <div className="wallet-profile-info">
              <p className="wallet-section-label">CREDENTIAL HOLDER</p>
              <h2>{displayName}</h2>
              <p>{wallet?.email}</p>
              <p>{wallet?.studentNumber} · {wallet?.course}</p>
              <p>{wallet?.institutionName}</p>
            </div>

            <div className="wallet-academic-year">
              <span>Academic Year</span>
              <strong>{wallet?.academicYear || 'Not available'}</strong>
            </div>
          </Card>

          <section className="wallet-stats-grid" aria-label="Credential summary">
            <Card as="article" className="wallet-stat-card wallet-stat-total">
              <div className="wallet-stat-heading">
                <span className="wallet-stat-icon" aria-hidden="true">▤</span>
                <span>Total Credentials</span>
              </div>
              <strong>{credentials.length}</strong>
              <small>Credentials issued to you</small>
            </Card>

            <Card as="article" className="wallet-stat-card wallet-stat-active">
              <div className="wallet-stat-heading">
                <span className="wallet-stat-icon" aria-hidden="true">✓</span>
                <span>Active Credentials</span>
              </div>
              <strong>{activeCount}</strong>
              <small>Currently valid credentials</small>
            </Card>

            <Card as="article" className="wallet-stat-card wallet-stat-revoked">
              <div className="wallet-stat-heading">
                <span className="wallet-stat-icon" aria-hidden="true">!</span>
                <span>Revoked Credentials</span>
              </div>
              <strong>{revokedCount}</strong>
              <small>No longer valid</small>
            </Card>
          </section>

          <section className="wallet-credentials-section">
            <div className="wallet-section-heading">
              <div>
                <p className="wallet-section-label">YOUR RECORDS</p>
                <h2>Academic Credentials</h2>
                <p className="wallet-section-description">
                  View, verify and download credentials issued by your institution.
                </p>
              </div>
              <span className="wallet-count">
                {credentials.length} {credentials.length === 1 ? 'credential' : 'credentials'}
              </span>
            </div>

            {downloadError && (
              <Alert variant="danger" className="wallet-download-error">
                {downloadError}
              </Alert>
            )}

            {credentials.length === 0 ? (
              <EmptyState
                title="No Credentials Yet"
                description="Your issued academic credentials will appear here."
                className="wallet-empty-state"
              />
            ) : (
              <div className="wallet-credential-grid">
                {credentials.map((credential) => {
                  const isActive = credential.status === 'ACTIVE'
                  const isQrVisible =
                    visibleQrCredentialId === credential.credentialId
                  const isDownloading =
                    downloadingCredentialId === credential.credentialId

                  return (
                    <Card
                      as="article"
                      className="wallet-credential-card"
                      key={credential.credentialId}
                    >
                      <div className="credential-card-top">
                        <div className="credential-icon" aria-hidden="true">🎓</div>
                        <StatusBadge
                          status={credential.status || 'UNKNOWN'}
                          className="credential-status"
                        />
                      </div>

                      <div className="credential-card-body">
                        <p className="wallet-section-label">ACADEMIC CREDENTIAL</p>
                        <h3>{credential.credentialType || 'Academic Credential'}</h3>
                        <p className="credential-description">
                          Issued by {wallet?.institutionName || 'Your institution'}
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
                            {credential.credentialCode}
                          </strong>
                        </div>
                        <div>
                          <span>Issued At</span>
                          <strong>{formatDate(credential.issuedAt)}</strong>
                        </div>
                      </div>

                      <div className="credential-qr-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="credential-qr-toggle"
                          disabled={!credential.credentialCode}
                          aria-expanded={isQrVisible}
                          aria-controls={`credential-qr-${credential.credentialId}`}
                          onClick={() => toggleQrCode(credential.credentialId)}
                        >
                          {isQrVisible ? 'Hide QR Code' : 'Show QR Code'}
                        </Button>

                        <Button
                          size="sm"
                          className="credential-download-button"
                          disabled={!isActive}
                          loading={isDownloading}
                          loadingLabel="Preparing PDF..."
                          onClick={() => handleDownloadCertificate(credential)}
                          title={
                            isActive
                              ? 'Download your certificate PDF'
                              : 'Certificates for revoked credentials cannot be downloaded'
                          }
                        >
                          Download Certificate
                        </Button>
                      </div>

                      {!isActive && (
                        <p className="credential-revoked-note">
                          This credential has been revoked. Its certificate download is disabled.
                        </p>
                      )}

                      {isQrVisible && (
                        <div
                          className="credential-qr-panel"
                          id={`credential-qr-${credential.credentialId}`}
                        >
                          <p className="wallet-section-label">
                            CREDENTIAL VERIFICATION QR
                          </p>
                          <QRCodeSVG
                            value={credential.credentialCode}
                            size={184}
                            level="M"
                            includeMargin
                            title={`QR code for ${credential.credentialCode}`}
                          />
                          <p className="credential-qr-instruction">
                            Present this QR code to a verifier to check the credential.
                          </p>
                          <p className="credential-qr-reference">
                            {credential.credentialCode}
                          </p>
                          <p className="credential-qr-note">
                            This QR code contains your credential reference. Academic
                            information is retrieved and verified securely by CrediVault.
                          </p>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        </div>
      </div>
      )}
    </RoleLayout>
  )
}

export default StudentWallet
