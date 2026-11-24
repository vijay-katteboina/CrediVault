import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import RoleLayout from '../../components/layout/RoleLayout'
import {
  Button,
  DataTable,
  EmptyState,
  ErrorState,
  Spinner,
  StatusBadge,
} from '../../components/ui'
import './VerifierHistory.css'

const VERIFIER_NAV_ITEMS = [
  {
    key: 'verify',
    label: 'Verify Credential',
    pageTitle: 'Credential Verification',
    description: 'Verify academic credentials using digital signatures, data integrity checks and revocation status.',
    icon: '✓',
  },
  {
    key: 'history',
    label: 'Verification History',
    pageTitle: 'Verification History',
    description: 'Review recorded academic credential verification activity.',
    icon: '↻',
  },
]

function VerifierHistory() {
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifierProfile, setVerifierProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem('credivaultToken')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const response = await api.get('/verifier/history')

      setHistory(Array.isArray(response.data) ? response.data : [])
      setError('')
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('credivaultToken')
        localStorage.removeItem('credivaultRole')
        navigate('/login', { replace: true })
        return
      }

      if (err.response?.status === 403) {
        setError(
          'Access denied. Please sign in with an authorized Verifier account.'
        )
      } else {
        setError(
          err.response?.data?.message ||
          'Unable to load verification history. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      const token = localStorage.getItem('credivaultToken')

      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      try {
        const response = await api.get('/auth/me')

        if (!cancelled) {
          setVerifierProfile(response.data)
          setProfileError('')
        }
      } catch (err) {
        if (cancelled) return

        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')
          navigate('/login', { replace: true })
          return
        }

        setProfileError(
          err.response?.data?.message ||
          'Unable to load verifier profile.'
        )
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleRefresh = () => {
    setLoading(true)
    setError('')
    void loadHistory()
  }

  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')
    navigate('/login', { replace: true })
  }

  const formatDate = (value) => {
    if (!value) return 'Not available'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    return date.toLocaleString()
  }

  const formatResult = (result) =>
    String(result || 'UNKNOWN').toUpperCase()

  const getResultClass = (result) =>
    String(result || 'unknown').toLowerCase()

  const getCredentialStatusClass = (status) =>
    String(status || 'unknown').toLowerCase()

  return (
    <RoleLayout
      role="VERIFIER"
      navItems={VERIFIER_NAV_ITEMS}
      activeKey="history"
      onNavigate={(key) =>
        navigate(key === 'history' ? '/verifier/history' : '/verifier')
      }
      onLogout={handleLogout}
      profile={verifierProfile}
      profileLoading={profileLoading}
      profileError={profileError}
    >
      <div className="history-workspace">
        <section className="history-summary">
          <div className="history-summary-icon">↻</div>

          <div className="history-summary-content">
            <p className="history-summary-label">
              TOTAL VERIFICATION RECORDS
            </p>

            <h2>{history.length}</h2>

            <p>
              Records returned by the CrediVault verification service.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={loading}
            loadingLabel="Refreshing..."
          >
            Refresh
          </Button>
        </section>

        <section className="history-records-section">
          <div className="history-section-heading">
            <div>
              <p className="history-section-label">ACTIVITY</p>
              <h2>Verification Records</h2>
              <p className="history-section-description">
                Review credential checks submitted through the Verifier Portal.
              </p>
            </div>

            <span className="history-record-count">
              {history.length} {history.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {loading ? (
            <Spinner
              label="Loading verification history..."
              className="history-message"
            />
          ) : error ? (
            <ErrorState
              title="Unable to Load History"
              description={error}
              action={(
                <Button variant="secondary" onClick={handleRefresh}>
                  Try Again
                </Button>
              )}
              className="history-message history-error"
            />
          ) : history.length === 0 ? (
            <EmptyState
              title="No Verification Records"
              description="No verification activity was returned for this account."
              action={(
                <Button onClick={() => navigate('/verifier')}>
                  Verify a Credential
                </Button>
              )}
              className="history-message"
            />
          ) : (
            <DataTable
              wrapperClassName="history-table-wrapper"
              className="history-table"
              caption="Credential verification history"
            >
                <thead>
                  <tr>
                    <th>Record</th>
                    <th>Credential</th>
                    <th>Student Number</th>
                    <th>Credential Type</th>
                    <th>Verification Result</th>
                    <th>Current Status</th>
                    <th>Verified At</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((record) => (
                    <tr key={record.verificationId}>
                      <td>
                        <span className="history-id">
                          #{record.verificationId}
                        </span>
                      </td>

                      <td>
                        <span className="history-credential-code">
                          {record.credentialCode}
                        </span>
                      </td>

                      <td>{record.studentNumber || '—'}</td>
                      <td>{record.credentialType || '—'}</td>

                      <td>
                        <StatusBadge
                          status={formatResult(record.result)}
                          className={`history-result-badge ${getResultClass(record.result)}`}
                        />
                      </td>

                      <td>
                        <StatusBadge
                          status={record.credentialStatus || 'UNKNOWN'}
                          className={`history-status-badge ${getCredentialStatusClass(record.credentialStatus)}`}
                        />
                      </td>

                      <td>
                        <span className="history-date">
                          {formatDate(record.verificationTime)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          )}

          {!loading && !error && history.length > 0 && (
            <p className="history-table-note">
              The verification result represents the outcome recorded at that
              time. Current credential status is displayed separately.
            </p>
          )}
        </section>
      </div>
    </RoleLayout>
  )
}

export default VerifierHistory
