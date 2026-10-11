import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './StudentWallet.css'

function StudentWallet() {
  const navigate = useNavigate()

  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadWallet = async () => {
      const token = localStorage.getItem('credivaultToken')

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const response = await api.get('/student/wallet')

        setWallet(response.data)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')

          navigate('/login', { replace: true })
          return
        }

        setError(
          err.response?.data?.message ||
          'Unable to load your wallet. Please try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadWallet()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  const formatDate = (value) => {
    if (!value) {
      return 'Not available'
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString()
  }

  if (loading) {
    return (
      <main className="wallet-page">
        <div className="wallet-loading">
          <div className="wallet-spinner" />
          <p>Loading your academic credentials...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="wallet-page">
        <section className="wallet-message">
          <h1>Unable to Load Wallet</h1>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/student')}
          >
            Back to Dashboard
          </button>
        </section>
      </main>
    )
  }

  const credentials = wallet?.credentials ?? []

  const activeCount = credentials.filter(
    (credential) => credential.status === 'ACTIVE'
  ).length

  const revokedCount = credentials.filter(
    (credential) => credential.status === 'REVOKED'
  ).length

  return (
    <main className="wallet-page">
      <div className="wallet-container">

        {/* Header */}
        <header className="wallet-header">
          <div>
            <p className="wallet-brand">CrediVault</p>
            <h1>My Credential Wallet</h1>

            <p className="wallet-subtitle">
              Your academic credentials in one secure place.
            </p>
          </div>

          <div className="wallet-header-actions">
            <button
              type="button"
              className="wallet-back-button"
              onClick={() => navigate('/student')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="wallet-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Student information */}
        <section className="wallet-profile">
          <div className="wallet-avatar">
            {wallet?.fullName?.charAt(0)?.toUpperCase() || 'S'}
          </div>

          <div className="wallet-profile-info">
            <p className="wallet-section-label">CREDENTIAL HOLDER</p>

            <h2>{wallet?.fullName}</h2>

            <p>{wallet?.email}</p>

            <p>
              {wallet?.studentNumber} · {wallet?.course}
            </p>

            <p>
              {wallet?.institutionName}
            </p>
          </div>

          <div className="wallet-academic-year">
            <span>Academic Year</span>
            <strong>{wallet?.academicYear}</strong>
          </div>
        </section>

        {/* Statistics */}
        <section className="wallet-stats">
          <article className="wallet-stat-card">
            <span>Total Credentials</span>

            <strong>{credentials.length}</strong>

            <p>Issued to you</p>
          </article>

          <article className="wallet-stat-card">
            <span>Active Credentials</span>

            <strong>{activeCount}</strong>

            <p>Currently active</p>
          </article>

          <article className="wallet-stat-card">
            <span>Revoked Credentials</span>

            <strong>{revokedCount}</strong>

            <p>No longer valid</p>
          </article>
        </section>

        {/* Credential list */}
        <section className="wallet-credentials-section">
          <div className="wallet-section-heading">
            <div>
              <p className="wallet-section-label">YOUR RECORDS</p>
              <h2>Academic Credentials</h2>
            </div>

            <span className="wallet-count">
              {credentials.length}{' '}
              {credentials.length === 1 ? 'credential' : 'credentials'}
            </span>
          </div>

          {credentials.length === 0 ? (
            <div className="wallet-empty-state">
              <div className="wallet-empty-icon">🎓</div>

              <h3>No Credentials Yet</h3>

              <p>
                Your issued academic credentials will appear here.
              </p>
            </div>
          ) : (
            <div className="wallet-credential-list">
              {credentials.map((credential) => (
                <article
                  className="wallet-credential-card"
                  key={credential.credentialId}
                >
                  <div className="credential-card-top">
                    <div className="credential-icon">
                      🎓
                    </div>

                    <span
                      className={`credential-status ${
                        credential.status?.toLowerCase() || 'unknown'
                      }`}
                    >
                      {credential.status || 'UNKNOWN'}
                    </span>
                  </div>

                  <div className="credential-card-body">
                    <p className="wallet-section-label">
                      ACADEMIC CREDENTIAL
                    </p>

                    <h3>{credential.credentialType}</h3>

                    <p className="credential-description">
                      Issued by {wallet?.institutionName}
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
                      <strong>
                        {formatDate(credential.issuedAt)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="wallet-footer">
          <p>CrediVault · Digital Academic Credential Platform</p>
        </footer>

      </div>
    </main>
  )
}

export default StudentWallet