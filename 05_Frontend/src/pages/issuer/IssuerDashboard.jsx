import RoleLayout from '../../components/layout/RoleLayout'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import StudentManagement from './StudentManagement'
import './IssuerDashboard.css'

const INITIAL_FORM_DATA = {
  studentId: '',
  credentialType: 'MCA Degree',
  cgpa: '',
  completionYear: '',
}

const INITIAL_REVOCATION_FORM = {
  credentialCode: '',
  reason: '',
}

const ISSUER_NAV_ITEMS = [
  {
    key: 'new-student',
    label: 'New Student',
    pageTitle: 'Register Student',
    description: 'Create a student login account and academic profile.',
    icon: '＋',
  },
  {
    key: 'institution-records',
    label: 'Institution Records',
    pageTitle: 'Registered Students',
    description: 'View and manage students belonging to your institution.',
    icon: '▤',
  },
  {
    key: 'new-credential',
    label: 'New Credential',
    pageTitle: 'Issue Academic Credential',
    description: 'Create digitally signed academic credentials.',
    icon: '◆',
  },
  {
    key: 'credential-management',
    label: 'Credential Management',
    pageTitle: 'Revoke Academic Credential',
    description: 'Manage credential revocation operations.',
    icon: '▣',
  },
]

function IssuerDashboard() {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState('new-student')

  const [issuerProfile, setIssuerProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })

  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState('')
  const [studentsRefreshKey, setStudentsRefreshKey] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [issuedCredential, setIssuedCredential] = useState(null)

  // Credential revocation states
const [revocationForm, setRevocationForm] = useState({
  ...INITIAL_REVOCATION_FORM,
})

const [revocationLoading, setRevocationLoading] = useState(false)
const [revocationError, setRevocationError] = useState('')
const [revocationResult, setRevocationResult] = useState(null)

  const selectedStudent = students.find(
    (student) => String(student.studentId) === String(formData.studentId),
  )

  // Validate the session and load students belonging to the issuer's institution.
  useEffect(() => {
    const token = localStorage.getItem('credivaultToken')
    const role = localStorage.getItem('credivaultRole')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (role !== 'ISSUER') {
      const roleRoutes = {
        STUDENT: '/student',
        VERIFIER: '/verifier',
        ADMIN: '/admin',
      }

      navigate(roleRoutes[role] || '/login', { replace: true })
      return
    }

    let cancelled = false

    const loadStudents = async () => {
      try {
        // The backend determines which institution this issuer belongs to.
        const response = await api.get('/issuer/students')

        if (cancelled) return

        const studentRecords = Array.isArray(response.data)
          ? response.data
          : []

        setStudents(studentRecords)

        if (studentRecords.length === 0) {
          setStudentsError(
            'No students are currently registered for your institution.',
          )
        }
      } catch (err) {
        if (cancelled) return

        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')
          navigate('/login', { replace: true })
          return
        }

        if (err.response?.status === 403) {
          setStudentsError(
            'Access denied. Sign in with an authorized Issuer account.',
          )
        } else {
          setStudentsError(
            err.response?.data?.message ||
              err.response?.data?.detail ||
              'Unable to load students. Please refresh the page and try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setStudentsLoading(false)
        }
      }
    }

    loadStudents()

    return () => {
      cancelled = true
    }
  }, [navigate, studentsRefreshKey])

  // Load the authenticated issuer's profile and institution details.
  useEffect(() => {
    let cancelled = false

    const loadIssuerProfile = async () => {
      setProfileLoading(true)
      setProfileError('')

      try {
        const response = await api.get('/issuer/profile')

        if (!cancelled) {
          setIssuerProfile(response.data)
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
            err.response?.data?.detail ||
            'Unable to load issuer profile.',
        )
      } finally {
        if (!cancelled) {
          setProfileLoading(false)
        }
      }
    }

    void loadIssuerProfile()

    return () => {
      cancelled = true
    }
  }, [navigate])

  // Handle form changes.
  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  // Issue a credential through the existing Spring Boot API.
  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setIssuedCredential(null)

    const token = localStorage.getItem('credivaultToken')
    const role = localStorage.getItem('credivaultRole')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    if (role !== 'ISSUER') {
      setError('Only an Issuer account can issue credentials.')
      return
    }

    // Only allow a student selected from the API response.
    const student = students.find(
      (item) => String(item.studentId) === String(formData.studentId),
    )

    if (!student) {
      setError('Please select a registered student from the dropdown.')
      return
    }

    const studentId = Number(student.studentId)

    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      setError('The selected student has an invalid ID.')
      return
    }

    if (
      !student.fullName?.trim() ||
      !student.course?.trim() ||
      !student.academicYear?.trim()
    ) {
      setError(
        'The selected student record is missing required academic information.',
      )
      return
    }

    if (!formData.cgpa.trim() || !formData.completionYear.trim()) {
      setError('Please complete the CGPA and completion year fields.')
      return
    }

    const cgpa = Number(formData.cgpa)

    if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
      setError('Enter a valid CGPA between 0 and 10.')
      return
    }

    const completionYear = Number(formData.completionYear)

    if (
      !Number.isInteger(completionYear) ||
      completionYear < 1900 ||
      completionYear > 2200
    ) {
      setError('Enter a valid completion year.')
      return
    }

    // Student identity and academic details come from the registered record.
    const payload = {
      studentId,
      credentialType: formData.credentialType.trim(),
      credentialData: {
        studentName: student.fullName,
        course: student.course,
        academicYear: student.academicYear,
        cgpa: formData.cgpa.trim(),
        completionYear: formData.completionYear.trim(),
      },
    }

    setLoading(true)

    try {
      const response = await api.post('/issuer/credentials', payload)

      setIssuedCredential(response.data)

      // Clear the form after successful issuance.
      setFormData({ ...INITIAL_FORM_DATA })
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('credivaultToken')
        localStorage.removeItem('credivaultRole')

        navigate('/login', { replace: true })
        return
      }

      if (err.response?.status === 403) {
        setError(
          'Access denied. Your account may not be authorized to issue this credential.',
        )
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.detail ||
            err.response?.data?.error ||
            'Credential issuance failed. Check the details and try again.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle revocation form changes.
const handleRevocationChange = (event) => {
  const { name, value } = event.target

  setRevocationForm((current) => ({
    ...current,
    [name]: value,
  }))

  setRevocationError('')
  setRevocationResult(null)
}

// Submit a credential revocation request.
const handleRevokeCredential = async (event) => {
  event.preventDefault()

  setRevocationError('')
  setRevocationResult(null)

  const token = localStorage.getItem('credivaultToken')
  const role = localStorage.getItem('credivaultRole')

  if (!token) {
    navigate('/login', { replace: true })
    return
  }

  if (role !== 'ISSUER') {
    setRevocationError(
      'Only an authorized Issuer can revoke credentials.'
    )
    return
  }

  const credentialCode = revocationForm.credentialCode.trim()
  const reason = revocationForm.reason.trim()

  if (!credentialCode) {
    setRevocationError('Please enter a credential code.')
    return
  }

  if (!/^CV-[A-Z0-9]+$/i.test(credentialCode)) {
    setRevocationError(
      'Enter a valid CrediVault credential code.'
    )
    return
  }

  if (!reason) {
    setRevocationError(
      'Please provide a reason for revocation.'
    )
    return
  }

  if (reason.length > 500) {
    setRevocationError(
      'The revocation reason cannot exceed 500 characters.'
    )
    return
  }

  // Confirm before performing an irreversible operation.
  const confirmed = window.confirm(
    `Are you sure you want to revoke credential ${credentialCode}?\n\n` +
    'This action cannot be undone.'
  )

  if (!confirmed) {
    return
  }

  setRevocationLoading(true)

  try {
    const response = await api.post('/revocation', {
      credentialCode,
      reason,
    })

    setRevocationResult(response.data)

    setRevocationForm({
      ...INITIAL_REVOCATION_FORM,
    })
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('credivaultToken')
      localStorage.removeItem('credivaultRole')

      navigate('/login', { replace: true })
      return
    }

    if (err.response?.status === 403) {
      setRevocationError(
        'Access denied. You cannot revoke credentials belonging to another institution.'
      )
    } else if (err.response?.status === 404) {
      setRevocationError(
        'Credential not found. Please check the credential code.'
      )
    } else if (err.response?.status === 409) {
      setRevocationError(
        err.response?.data?.message ||
        'This credential is already revoked or is not eligible for revocation.'
      )
    } else {
      setRevocationError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Credential revocation failed. Please try again.'
      )
    }
  } finally {
    setRevocationLoading(false)
  }
}

  // Clear the session and return to login.
  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  // Format timestamps returned by Spring Boot.
  const formatDate = (value) => {
    if (!value) {
      return 'Not available'
    }

    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString()
  }

  // Copy the generated credential code.
  const handleCopyCode = async () => {
    if (!issuedCredential?.credentialCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        issuedCredential.credentialCode,
      )

      setError('')
    } catch {
      setError(
        'Unable to copy automatically. Select and copy the credential code.',
      )
    }
  }

  return (
    <RoleLayout
      role="ISSUER"
      navItems={ISSUER_NAV_ITEMS}
      activeKey={activeSection}
      onNavigate={setActiveSection}
      onLogout={handleLogout}
      profile={issuerProfile}
      profileLoading={profileLoading}
      profileError={profileError}
    >
      {/* SECTION 1: NEW STUDENT / SECTION 2: INSTITUTION RECORDS */}
      {(activeSection === 'new-student' ||
        activeSection === 'institution-records') && (
        <StudentManagement
          view={
            activeSection === 'institution-records'
              ? 'records'
              : 'register'
          }
          onStudentsChanged={() =>
            setStudentsRefreshKey((current) => current + 1)
          }
        />
      )}

      {/* SECTION 3: NEW CREDENTIAL */}
      {activeSection === 'new-credential' && (
        <div className="issuer-workspace-section">
          <section className="issuer-form-card">
            <div className="issuer-card-heading">
              <div>
                <p className="issuer-section-label">NEW CREDENTIAL</p>
                <h2>Issue Academic Credential</h2>
                <p>
                  Select a registered student and enter the academic record
                  details.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="issuer-form">
              <div className="issuer-form-section">
                <h3>Student Information</h3>

                <div className="issuer-form-grid">
                  <div className="issuer-form-group issuer-student-select-group">
                    <label htmlFor="studentId">
                      Select Registered Student
                    </label>

                    <select
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      disabled={studentsLoading || students.length === 0}
                      required
                    >
                      <option value="">
                        {studentsLoading
                          ? 'Loading students...'
                          : 'Select a student'}
                      </option>

                      {students.map((student) => (
                        <option
                          key={student.studentId}
                          value={student.studentId}
                        >
                          {student.fullName} — {student.studentNumber} (
                          {student.course})
                        </option>
                      ))}
                    </select>

                    <small>
                      Students are loaded from your institution's registered
                      records.
                    </small>
                  </div>

                  {studentsError && (
                    <div className="issuer-student-status" role="status">
                      {studentsError}
                    </div>
                  )}

                  <div className="issuer-form-group issuer-readonly-group">
                    <label htmlFor="studentNumber">Student Number</label>
                    <input
                      id="studentNumber"
                      type="text"
                      value={selectedStudent?.studentNumber || ''}
                      placeholder="Selected student's number"
                      readOnly
                    />
                  </div>

                  <div className="issuer-form-group issuer-readonly-group">
                    <label htmlFor="studentName">Student Name</label>
                    <input
                      id="studentName"
                      type="text"
                      value={selectedStudent?.fullName || ''}
                      placeholder="Selected student's name"
                      readOnly
                    />
                  </div>

                  <div className="issuer-form-group issuer-readonly-group">
                    <label htmlFor="course">Course</label>
                    <input
                      id="course"
                      type="text"
                      value={selectedStudent?.course || ''}
                      placeholder="Selected student's course"
                      readOnly
                    />
                  </div>

                  <div className="issuer-form-group issuer-readonly-group">
                    <label htmlFor="academicYear">Academic Year</label>
                    <input
                      id="academicYear"
                      type="text"
                      value={selectedStudent?.academicYear || ''}
                      placeholder="Selected student's academic year"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="issuer-form-section">
                <h3>Academic Information</h3>

                <div className="issuer-form-grid">
                  <div className="issuer-form-group">
                    <label htmlFor="credentialType">Credential Type</label>
                    <select
                      id="credentialType"
                      name="credentialType"
                      value={formData.credentialType}
                      onChange={handleChange}
                      required
                    >
                      <option value="MCA Degree">MCA Degree</option>
                      <option value="BSc Degree">BSc Degree</option>
                      <option value="BTech Degree">BTech Degree</option>
                      <option value="Academic Transcript">
                        Academic Transcript
                      </option>
                      <option value="Completion Certificate">
                        Completion Certificate
                      </option>
                    </select>
                  </div>

                  <div className="issuer-form-group">
                    <label htmlFor="cgpa">CGPA</label>
                    <input
                      id="cgpa"
                      name="cgpa"
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={formData.cgpa}
                      onChange={handleChange}
                      placeholder="Example: 8.5"
                      required
                    />
                  </div>

                  <div className="issuer-form-group">
                    <label htmlFor="completionYear">Completion Year</label>
                    <input
                      id="completionYear"
                      name="completionYear"
                      type="number"
                      min="1900"
                      max="2200"
                      step="1"
                      value={formData.completionYear}
                      onChange={handleChange}
                      placeholder="Example: 2027"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="issuer-error" role="alert">
                  {error}
                </div>
              )}

              <div className="issuer-form-actions">
                <button
                  type="button"
                  className="issuer-cancel-button"
                  onClick={() => {
                    setFormData({ ...INITIAL_FORM_DATA })
                    setError('')
                  }}
                  disabled={loading}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="issuer-submit-button"
                  disabled={
                    loading || studentsLoading || students.length === 0
                  }
                >
                  {loading ? 'Issuing Credential...' : 'Issue Credential'}
                </button>
              </div>

              <p className="issuer-security-note">
                Issuance submits a real request to the CrediVault backend.
                Confirm the selected student and academic details before
                submitting.
              </p>
            </form>
          </section>

          {/* Successful issuance result */}
          {issuedCredential && (
            <section className="issued-result-card" aria-live="polite">
              <div className="issued-result-header">
                <div className="issued-success-icon" aria-hidden="true">
                  ✓
                </div>

                <div>
                  <p className="issuer-section-label">
                    ISSUANCE SUCCESSFUL
                  </p>
                  <h2>Credential Created Successfully</h2>
                  <p>
                    The backend returned the newly issued credential.
                  </p>
                </div>

                <span className="issued-status">
                  {issuedCredential.status || 'ISSUED'}
                </span>
              </div>

              <div className="issued-details-grid">
                <div className="issued-detail">
                  <span>Credential ID</span>
                  <strong>
                    {issuedCredential.credentialId ?? 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Credential Code</span>
                  <strong className="issued-credential-code">
                    {issuedCredential.credentialCode || 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Student Number</span>
                  <strong>
                    {issuedCredential.studentNumber || 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Credential Type</span>
                  <strong>
                    {issuedCredential.credentialType || 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Institution</span>
                  <strong>
                    {issuedCredential.institutionName || 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Issued At</span>
                  <strong>{formatDate(issuedCredential.issuedAt)}</strong>
                </div>

                <div className="issued-detail issued-hash-detail">
                  <span>Data Hash (SHA-256)</span>
                  <strong>
                    {issuedCredential.dataHash || 'Not available'}
                  </strong>
                </div>
              </div>

              {issuedCredential.credentialCode && (
                <button
                  type="button"
                  className="issuer-copy-button"
                  onClick={handleCopyCode}
                >
                  Copy Credential Code
                </button>
              )}

              <p className="issuer-issued-note">
                Save the credential code for verification testing. The
                credential can be verified through the CrediVault verification
                service.
              </p>
            </section>
          )}
        </div>
      )}

      {/* SECTION 4: CREDENTIAL MANAGEMENT */}
      {activeSection === 'credential-management' && (
        <div className="issuer-workspace-section">
          <section className="issuer-form-card revocation-form-card">
            <div className="issuer-card-heading">
              <div>
                <p className="issuer-section-label">
                  CREDENTIAL MANAGEMENT
                </p>
                <h2>Revoke Academic Credential</h2>
                <p>
                  Revoke an active academic credential when it is no longer
                  valid or has been issued incorrectly.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleRevokeCredential}
              className="issuer-form"
            >
              <div className="issuer-form-section">
                <h3>Revocation Information</h3>

                <div className="issuer-form-grid">
                  <div className="issuer-form-group">
                    <label htmlFor="revocationCredentialCode">
                      Credential Code
                    </label>
                    <input
                      id="revocationCredentialCode"
                      name="credentialCode"
                      type="text"
                      value={revocationForm.credentialCode}
                      onChange={handleRevocationChange}
                      placeholder="Example: CV-XXXXXXXX"
                      autoComplete="off"
                      required
                    />
                    <small>
                      Enter the credential code that needs to be revoked.
                    </small>
                  </div>

                  <div className="issuer-form-group">
                    <label htmlFor="revocationReason">
                      Reason for Revocation
                    </label>
                    <textarea
                      id="revocationReason"
                      name="reason"
                      value={revocationForm.reason}
                      onChange={handleRevocationChange}
                      placeholder="Explain why this credential must be revoked."
                      maxLength={500}
                      rows={4}
                      required
                    />
                    <small>
                      Maximum 500 characters. {revocationForm.reason.length}/500
                    </small>
                  </div>
                </div>
              </div>

              {revocationError && (
                <div className="issuer-error" role="alert">
                  {revocationError}
                </div>
              )}

              <div className="issuer-form-actions">
                <button
                  type="button"
                  className="issuer-cancel-button"
                  disabled={revocationLoading}
                  onClick={() => {
                    setRevocationForm({ ...INITIAL_REVOCATION_FORM })
                    setRevocationError('')
                    setRevocationResult(null)
                  }}
                >
                  Clear Form
                </button>

                <button
                  type="submit"
                  className="issuer-revoke-button"
                  disabled={revocationLoading}
                >
                  {revocationLoading
                    ? 'Revoking Credential...'
                    : 'Revoke Credential'}
                </button>
              </div>

              <p className="issuer-security-note">
                Only active credentials belonging to your institution can be
                revoked. Revocation is permanent and recorded in the CrediVault
                audit trail.
              </p>
            </form>
          </section>

          {/* Successful revocation result */}
          {revocationResult && (
            <section className="revocation-result-card" aria-live="polite">
              <div className="revocation-result-header">
                <div className="revocation-success-icon">!</div>

                <div>
                  <p className="issuer-section-label">
                    REVOCATION SUCCESSFUL
                  </p>
                  <h2>Credential Revoked Successfully</h2>
                  <p>
                    The backend confirmed the credential revocation.
                  </p>
                </div>

                <span className="revocation-status">
                  {revocationResult.status || 'REVOKED'}
                </span>
              </div>

              <div className="issued-details-grid">
                <div className="issued-detail">
                  <span>Revocation ID</span>
                  <strong>
                    {revocationResult.revocationId ?? 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Credential ID</span>
                  <strong>
                    {revocationResult.credentialId ?? 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Credential Code</span>
                  <strong className="issued-credential-code">
                    {revocationResult.credentialCode || 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Revoked By (Issuer ID)</span>
                  <strong>
                    {revocationResult.revokedBy ?? 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Revocation Reason</span>
                  <strong>
                    {revocationResult.reason || 'Not available'}
                  </strong>
                </div>

                <div className="issued-detail">
                  <span>Revoked At</span>
                  <strong>{formatDate(revocationResult.revokedAt)}</strong>
                </div>
              </div>

              <p className="issuer-issued-note">
                This credential is no longer valid. Future verification
                requests should identify it as revoked.
              </p>
            </section>
          )}
        </div>
      )}
    </RoleLayout>
  )
}

export default IssuerDashboard
