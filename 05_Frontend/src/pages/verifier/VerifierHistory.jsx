import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './VerifierHistory.css'

function VerifierHistory() {
  const navigate = useNavigate()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem('credivaultToken')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await api.get('/verifier/history')

      setHistory(
        Array.isArray(response.data) ? response.data : []
      )
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
    loadHistory()
  }, [loadHistory])

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

  const formatResult = (result) => {
    return String(result || 'UNKNOWN').toUpperCase()
  }

  const getResultClass = (result) => {
    return String(result || 'unknown').toLowerCase()
  }

  const getCredentialStatusClass = (status) => {
    return String(status || 'unknown').toLowerCase()
  }

  return (
    <main className="history-page">
      <div className="history-container">

        {/* Page header */}
        <header className="history-header">
          <div>
            <p className="history-brand">CrediVault</p>

            <h1>Verification History</h1>

            <p className="history-subtitle">
              Review recorded academic credential verification activity.
            </p>
          </div>

          <div className="history-header-actions">
            <button
              type="button"
              className="history-dashboard-button"
              onClick={() => navigate('/verifier')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="history-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Summary */}
        <section className="history-summary">
          <div className="history-summary-icon">
            ↻
          </div>

          <div>
            <p className="history-summary-label">
              TOTAL VERIFICATION RECORDS
            </p>

            <h2>{history.length}</h2>

            <p>
              Records returned by the CrediVault verification service.
            </p>
          </div>

          <button
            type="button"
            className="history-refresh-button"
            onClick={loadHistory}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        {/* History records */}
        <section className="history-records-section">
          <div className="history-section-heading">
            <div>
              <p className="history-section-label">ACTIVITY</p>
              <h2>Verification Records</h2>
            </div>

            <span className="history-record-count">
              {history.length}{' '}
              {history.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {loading ? (
            <div className="history-message">
              <div className="history-spinner" />
              <p>Loading verification history...</p>
            </div>
          ) : error ? (
            <div className="history-message history-error">
              <h3>Unable to Load History</h3>
              <p>{error}</p>

              <button
                type="button"
                onClick={loadHistory}
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="history-message">
              <div className="history-empty-icon">↻</div>

              <h3>No Verification Records</h3>

              <p>
                No verification activity was returned for this account.
              </p>

              <button
                type="button"
                onClick={() => navigate('/verifier')}
              >
                Verify a Credential
              </button>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
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

                      <td>
                        {record.studentNumber || '—'}
                      </td>

                      <td>
                        {record.credentialType || '—'}
                      </td>

                      <td>
                        <span
                          className={`history-result-badge ${
                            getResultClass(record.result)
                          }`}
                        >
                          {formatResult(record.result)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`history-status-badge ${
                            getCredentialStatusClass(
                              record.credentialStatus
                            )
                          }`}
                        >
                          {record.credentialStatus || 'UNKNOWN'}
                        </span>
                      </td>

                      <td>
                        <span className="history-date">
                          {formatDate(record.verificationTime)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <p className="history-table-note">
              The verification result represents the outcome recorded
              at that time. Current credential status is displayed
              separately.
            </p>
          )}
        </section>

        <footer className="history-footer">
          CrediVault · Digital Academic Credential Verification
        </footer>

      </div>
    </main>
  )
}

export default VerifierHistory