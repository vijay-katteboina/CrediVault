import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import RoleLayout from '../../components/layout/RoleLayout'
import './VerifierDashboard.css'

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

function VerifierDashboard() {
  const navigate = useNavigate()

  const [credentialCode, setCredentialCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [verifierProfile, setVerifierProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  // QR Scanner states
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const [scannerAttempt, setScannerAttempt] = useState(0)

  // QR Scanner references
  const videoRef = useRef(null)
  const scannerControlsRef = useRef(null)
  const processingScanRef = useRef(false)

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

      navigate(roleRoutes[role] || '/login', {
        replace: true
      })
    }
  }, [navigate])

  // Load the authenticated verifier profile for the shared sidebar.
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

  // Stop camera and release its resources.
  const stopCamera = useCallback(() => {
    if (scannerControlsRef.current) {
      scannerControlsRef.current.stop()
      scannerControlsRef.current = null
    }

    const video = videoRef.current
    const stream = video?.srcObject

    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => track.stop())
    }

    if (video) {
      video.srcObject = null
    }
  }, [])

  // Handle camera errors.
  const getCameraErrorMessage = (cameraError) => {
    switch (cameraError?.name) {
      case 'NotAllowedError':
        return 'Camera permission denied. Allow camera access in your browser settings.'

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera was found on this device.'

      case 'NotReadableError':
        return 'Your camera is already being used by another application.'

      case 'OverconstrainedError':
        return 'The requested camera configuration is not supported.'

      case 'SecurityError':
        return 'Camera access requires a secure connection. Use localhost or HTTPS.'

      default:
        return cameraError?.message ||
          'Unable to start the camera. Please check your camera permissions.'
    }
  }

  // Verify a credential using the existing backend API.
  // Used by both manual verification and QR scanning.
  const verifyCredential = useCallback(async (codeValue) => {
    setError('')
    setResult(null)

    const token = localStorage.getItem('credivaultToken')
    const role = localStorage.getItem('credivaultRole')
    const code = (codeValue || '').trim()

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

      if (err.response?.status === 404) {
        setError(
          'Credential not found. Please check the credential code and try again.'
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
  }, [navigate])

  // Manual credential verification.
  const handleVerify = async (event) => {
    event.preventDefault()
    await verifyCredential(credentialCode)
  }

  // Start or restart the QR scanner.
  const handleStartScanner = () => {
    processingScanRef.current = false
    setScannerError('')
    setScannerReady(false)
    setScannerOpen(true)
    setScannerAttempt((current) => current + 1)
  }

  // Close scanner.
  const handleStopScanner = () => {
    setScannerOpen(false)
    setScannerReady(false)
    setScannerError('')
    stopCamera()
  }

  // Camera scanning lifecycle.
  useEffect(() => {
    if (!scannerOpen) {
      return undefined
    }

    let cancelled = false


    const startScanning = async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')

      if (cancelled) {
        return
      }
      const codeReader = new BrowserQRCodeReader()
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Camera access is unavailable. Open the application using localhost or HTTPS.'
          )
        }

        const videoElement = videoRef.current

        if (!videoElement) {
          throw new Error('Camera preview is unavailable.')
        }

        const controls = await codeReader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: {
                ideal: 'environment'
              }
            }
          },
          videoElement,
          (scanResult, scanError, callbackControls) => {
            // No QR code detected yet. Continue scanning.
            if (!scanResult || processingScanRef.current) {
              return
            }

            const scannedCode = scanResult.getText().trim()

            // Accept only CrediVault credential references.
            if (!/^CV-[A-Z0-9]+$/i.test(scannedCode)) {
              processingScanRef.current = true

              callbackControls?.stop()

              setScannerReady(false)

              setScannerError(
                'Invalid QR code. Please scan a valid CrediVault credential QR code.'
              )

              return
            }

            // Prevent repeated verification from the same QR code.
            processingScanRef.current = true

            callbackControls?.stop()

            setScannerReady(false)
            setScannerError('')

            // Populate the existing credential input.
            setCredentialCode(scannedCode)

            // Close camera after successful scanning.
            setScannerOpen(false)

            // Reuse the existing backend verification process.
            void verifyCredential(scannedCode)
          }
        )

        if (cancelled) {
          controls.stop()
        } else {
          scannerControlsRef.current = controls
          setScannerReady(true)
        }
      } catch (cameraError) {
        if (!cancelled) {
          setScannerReady(false)
          setScannerError(
            getCameraErrorMessage(cameraError)
          )
        }
      }
    }

    startScanning()

    // Release camera when scanner closes or component unmounts.
    return () => {
      cancelled = true
      stopCamera()
      setScannerReady(false)
    }
  }, [
    scannerOpen,
    scannerAttempt,
    verifyCredential,
    stopCamera
  ])

  // Clear the current session.
  const handleLogout = () => {
    handleStopScanner()

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
    <RoleLayout
      role="VERIFIER"
      navItems={VERIFIER_NAV_ITEMS}
      activeKey="verify"
      onNavigate={(key) =>
        navigate(key === 'history' ? '/verifier/history' : '/verifier')
      }
      onLogout={handleLogout}
      profile={verifierProfile}
      profileLoading={profileLoading}
      profileError={profileError}
    >
      <div className="verifier-workspace">
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
                Enter the credential code or scan its QR code
                to check its authenticity.
              </p>
            </div>
          </div>

          {/* Manual verification */}
          <form onSubmit={handleVerify}>
            <label htmlFor="credentialCode">
              Credential Code
            </label>

            <input
              id="credentialCode"
              name="credentialCode"
              type="text"
              value={credentialCode}
              onChange={(event) =>
                setCredentialCode(event.target.value)
              }
              placeholder="Enter the academic credential code"
              autoComplete="off"
              required
            />

            {error && (
              <div
                className="verification-error"
                role="alert"
              >
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

          {/* QR Scanner Button */}
          <div className="qr-scanner-divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="qr-scanner-toggle"
            onClick={
              scannerOpen
                ? handleStopScanner
                : handleStartScanner
            }
            disabled={loading}
          >
            {scannerOpen
              ? 'Close QR Scanner'
              : 'Scan QR Code with Camera'}
          </button>

          {/* QR Scanner Panel */}
          {scannerOpen && (
            <section
              className="qr-scanner-panel"
              aria-label="QR Code Scanner"
            >
              <div className="qr-scanner-heading">
                <h3>Scan Student Credential QR</h3>

                <p>
                  Position the student's QR code in front of
                  your camera.
                </p>
              </div>

              <div className="qr-scanner-video-container">
                <video
                  ref={videoRef}
                  className="qr-scanner-video"
                  autoPlay
                  muted
                  playsInline
                />
              </div>

              {scannerError ? (
                <div
                  className="qr-scanner-error"
                  role="alert"
                >
                  {scannerError}
                </div>
              ) : (
                <p
                  className="qr-scanner-status"
                  role="status"
                >
                  {scannerReady
                    ? 'Camera active. Point it towards the credential QR code.'
                    : 'Starting camera...'}
                </p>
              )}

              {scannerError && (
                <button
                  type="button"
                  className="qr-scanner-retry"
                  onClick={handleStartScanner}
                >
                  Retry Camera
                </button>
              )}

              <p className="qr-scanner-note">
                Scanned credential references are submitted to
                the CrediVault backend for verification.
              </p>
            </section>
          )}
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
                      The stored hash is compared with the
                      recalculated hash.
                    </p>
                  </div>

                  <span
                    className={`check-badge ${
                      getCheckStatus(result.integrityValid)
                    }`}
                  >
                    {result.integrityValid ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* Digital signature */}
                <div className="security-check-row">
                  <div>
                    <strong>Digital Signature</strong>

                    <p>
                      The signature is checked using the
                      institution's public key.
                    </p>
                  </div>

                  <span
                    className={`check-badge ${
                      getCheckStatus(result.signatureValid)
                    }`}
                  >
                    {result.signatureValid ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* Revocation status */}
                <div className="security-check-row">
                  <div>
                    <strong>Revocation Status</strong>

                    <p>
                      The backend checks the revocation record
                      and credential status.
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
                    <strong>
                      {result.studentNumber || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Credential Type</span>
                    <strong>
                      {result.credentialType || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Course</span>
                    <strong>
                      {result.course || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Academic Year</span>
                    <strong>
                      {result.academicYear || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Institution</span>
                    <strong>
                      {result.institutionName || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Institution Code</span>
                    <strong>
                      {result.institutionCode || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Credential Status</span>
                    <strong>
                      {result.credentialStatus || '—'}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Issued At</span>
                    <strong>
                      {formatDate(result.issuedAt)}
                    </strong>
                  </div>

                  <div className="verified-detail">
                    <span>Verified At</span>
                    <strong>
                      {formatDate(result.verificationTime)}
                    </strong>
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
                              {typeof value === 'object' &&
                              value !== null
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

      </div>
    </RoleLayout>
  )
}

export default VerifierDashboard
