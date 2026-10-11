import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './VerifierDashboard.css'

function VerifierDashboard() {
  const navigate = useNavigate()

  const [credentialCode, setCredentialCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Require an authenticated Verifier session.
  useEffect(() => {
    const token = localStorage.getItem('credivaultToken')
    const role = localStorage.getItem('credivaultRole')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (role !== 'VERIFIER') {
      const roleRoutes = {
        STUDENT: '/student',
        ISSUER: '/issuer',
        ADMIN: '/admin',
      }

      navigate(roleRoutes[role] || '/login', { replace: true })
    }
  }, [navigate])

  // Submit a real credential verification request.
  const handleVerify = async (event) => {
    event.preventDefault()

    setError('')
    setResult(null)

    const token = localStorage.getItem('credivaultToken')
    const role = localStorage.getItem('credivaultRole')
    const code = credentialCode.trim()

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (role !== 'VERIFIER') {
      setError(
        'Only a Verifier account can verify credentials. ' +
        'Please sign in with your Verifier account.'
      )
      return
    }

    if (!code) {
      setError('Please enter a credential code.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/verification', {
        credentialCode: code,
      })

      setResult(response.data)
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
        return
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Verification failed. Check the credential code and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Clear the current session.
  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  // Format dates returned by the backend.
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

  // Explain the actual verification result.
  const getResultDescription = (verificationResult) => {
    switch (verificationResult) {
      case 'VERIFIED':
        return 'All verification checks passed. The credential is active.'

      case 'TAMPERED':
        return 'The credential data does not match its original hash.'

      case 'INVALID':
        return 'The digital signature or credential status is invalid.'

      case 'REVOKED':
        return 'This credential has been revoked and is no longer valid.'

      default:
        return 'Review the verification details below.'
    }
  }

  const getCheckStatus = (passed) => {
    return passed ? 'passed' : 'failed'
  }

  const isRevoked = result
    ? result.revoked ||
      result.credentialStatus === 'REVOKED'
    : false

  return (
    <main className="verifier-page">
      <div className="verifier-container">

        {/* Header */}
        <header className="verifier-header">
          <div>
            <p className="verifier-brand">CrediVault</p>

            <h1>Credential Verification</h1>

            <p className="verifier-subtitle">
              Verify academic credentials using digital signatures,
              data integrity checks, and revocation status.
            </p>
          </div>

          {/* Header actions */}
          <div className="verifier-header-actions">
            <button
              type="button"
              className="verifier-history-button"
              onClick={() => navigate('/verifier/history')}
            >
              Verification History
            </button>

            <button
              type="button"
              className="verifier-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Verification form */}
        <section className="verification-form-card">
          <div className="verification-form-heading">
            <div
              className="verification-form-icon"
              aria-hidden="true"
            >
              ✓
            </div>

            <div>
              <h2>Verify a Credential</h2>

              <p>
                Enter the credential code to check its authenticity.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify}>
            <label htmlFor="credentialCode">
              Credential Code
            </label>

            <input
              id="credentialCode"
              name="credentialCode"
              type="text"
              value={credentialCode}
              onChange={(event) => setCredentialCode(event.target.value)}
              placeholder="Enter the academic credential code"
              autoComplete="off"
              required
            />

            {error && (
              <div className="verification-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="verify-button"
              disabled={loading}
            >
              {loading
                ? 'Verifying Credential...'
                : 'Verify Credential'}
            </button>
          </form>

          <p className="verification-hint">
            Verification results are generated by the CrediVault backend.
          </p>
        </section>

        {/* Display the actual verification response */}
        {result && (
          <section
            className="verification-result-section"
            aria-live="polite"
          >
            <div className="verification-result-card">

              {/* Overall result */}
              <div className="result-header">
                <div
                  className={`result-symbol ${
                    result.result?.toLowerCase() || 'unknown'
                  }`}
                  aria-hidden="true"
                >
                  {result.result === 'VERIFIED' ? '✓' : '!'}
                </div>

                <div className="result-heading">
                  <p className="verifier-section-label">
                    VERIFICATION RESULT
                  </p>

                  <h2>{result.result || 'UNKNOWN'}</h2>

                  <p>
                    {getResultDescription(result.result)}
                  </p>
                </div>

                <span
                  className={`result-badge ${
                    result.result?.toLowerCase() || 'unknown'
                  }`}
                >
                  {result.result || 'UNKNOWN'}
                </span>
              </div>

              {/* Security checks */}
              <div className="security-checks">
                <h3>Security Checks</h3>

                {/* Data integrity */}
                <div className="security-check-row">
                  <div>
                    <strong>Data Integrity</strong>

                    <p>
                      The stored hash is compared with the recalculated hash.
                    </p>
                  </div>

                  <span
                    className={`check-badge ${getCheckStatus(
                      result.integrityValid
                    )}`}
                  >
                    {result.integrityValid ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* Digital signature */}
                <div className="security-check-row">
                  <div>
                    <strong>Digital Signature</strong>

                    <p>
                      The signature is checked using the institution's
                      public key.
                    </p>
                  </div>

                  <span
                    className={`check-badge ${getCheckStatus(
                      result.signatureValid
                    )}`}
                  >
                    {result.signatureValid ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* Revocation status */}
                <div className="security-check-row">
                  <div>
                    <strong>Revocation Status</strong>

                    <p>
                      The backend checks the revocation record and
                      credential status.
                    </p>
                  </div>

                  <span
                    className={`check-badge ${
                      isRevoked ? 'failed' : 'passed'
                    }`}
                  >
                    {isRevoked ? 'REVOKED' : 'NOT REVOKED'}
                  </span>
                </div>
              </div>

              {/* Credential information */}
              <div className="verified-credential-details">
                <h3>Credential Information</h3>

                <div className="verified-details-grid">
                  <div className="verified-detail">
                    <span>Student Number</span>
                    <strong>{result.studentNumber || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Credential Type</span>
                    <strong>{result.credentialType || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Course</span>
                    <strong>{result.course || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Academic Year</span>
                    <strong>{result.academicYear || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Institution</span>
                    <strong>{result.institutionName || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Institution Code</span>
                    <strong>{result.institutionCode || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Credential Status</span>
                    <strong>{result.credentialStatus || '—'}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Issued At</span>
                    <strong>{formatDate(result.issuedAt)}</strong>
                  </div>

                  <div className="verified-detail">
                    <span>Verified At</span>
                    <strong>{formatDate(result.verificationTime)}</strong>
                  </div>
                </div>
              </div>

              {/* Academic record */}
              {result.credentialData &&
                Object.keys(result.credentialData).length > 0 && (
                  <div className="verified-credential-data">
                    <h3>Academic Record</h3>

                    <div className="verified-details-grid">
                      {Object.entries(result.credentialData).map(
                        ([key, value]) => (
                          <div
                            className="verified-detail"
                            key={key}
                          >
                            <span>{key}</span>

                            <strong>
                              {typeof value === 'object' && value !== null
                                ? JSON.stringify(value)
                                : String(value)}
                            </strong>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="verification-result-footer">
                Verification performed by CrediVault.
                The displayed result reflects the backend response.
              </div>

            </div>
          </section>
        )}

        <footer className="verifier-footer">
          CrediVault · Digital Academic Credential Verification
        </footer>

      </div>
    </main>
  )
}

export default VerifierDashboard