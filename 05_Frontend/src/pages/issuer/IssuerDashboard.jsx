import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './IssuerDashboard.css'

const INITIAL_FORM_DATA = {
  studentId: '',
  credentialType: 'MCA Degree',
  cgpa: '',
  completionYear: '',
}

function IssuerDashboard() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({ ...INITIAL_FORM_DATA })

  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [studentsError, setStudentsError] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [issuedCredential, setIssuedCredential] = useState(null)

  const selectedStudent = students.find(
    (student) => String(student.studentId) === String(formData.studentId),
  )

  // Validate the session and load students belonging to the issuer's institution.
  useEffect(() => {
    const token = localStorage.getItem('credivaultToken')
    const role = localStorage.getItem('credivaultRole')

    if (!token) {
      navigate('/login', { replace: true })
      setStudentsLoading(false)
      return
    }

    if (role !== 'ISSUER') {
      const roleRoutes = {
        STUDENT: '/student',
        VERIFIER: '/verifier',
        ADMIN: '/admin',
      }

      navigate(roleRoutes[role] || '/login', { replace: true })
      setStudentsLoading(false)
      return
    }

    let cancelled = false

    const loadStudents = async () => {
      setStudentsLoading(true)
      setStudentsError('')

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
    <main className="issuer-page">
      <div className="issuer-container">
        {/* Dashboard header */}
        <header className="issuer-header">
          <div>
            <p className="issuer-brand">CrediVault</p>

            <h1>Issuer Dashboard</h1>

            <p className="issuer-subtitle">
              Issue and manage digitally signed academic credentials.
            </p>
          </div>

          <button
            type="button"
            className="issuer-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* Dashboard introduction */}
        <section className="issuer-welcome-card">
          <div className="issuer-welcome-icon" aria-hidden="true">
            ✓
          </div>

          <div>
            <p className="issuer-section-label">
              INSTITUTIONAL ACCESS
            </p>

            <h2>Academic Credential Issuance</h2>

            <p>
              Create academic credentials through the CrediVault
              credential issuance service.
            </p>
          </div>
        </section>

        {/* Credential issuance form */}
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
            {/* Registered student information */}
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
                  <div
                    className="issuer-student-status"
                    role="status"
                  >
                    {studentsError}
                  </div>
                )}

                <div className="issuer-form-group issuer-readonly-group">
                  <label htmlFor="studentNumber">
                    Student Number
                  </label>

                  <input
                    id="studentNumber"
                    type="text"
                    value={selectedStudent?.studentNumber || ''}
                    placeholder="Selected student's number"
                    readOnly
                  />
                </div>

                <div className="issuer-form-group issuer-readonly-group">
                  <label htmlFor="studentName">
                    Student Name
                  </label>

                  <input
                    id="studentName"
                    type="text"
                    value={selectedStudent?.fullName || ''}
                    placeholder="Selected student's name"
                    readOnly
                  />
                </div>

                <div className="issuer-form-group issuer-readonly-group">
                  <label htmlFor="course">
                    Course
                  </label>

                  <input
                    id="course"
                    type="text"
                    value={selectedStudent?.course || ''}
                    placeholder="Selected student's course"
                    readOnly
                  />
                </div>

                <div className="issuer-form-group issuer-readonly-group">
                  <label htmlFor="academicYear">
                    Academic Year
                  </label>

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

            {/* Academic information */}
            <div className="issuer-form-section">
              <h3>Academic Information</h3>

              <div className="issuer-form-grid">
                <div className="issuer-form-group">
                  <label htmlFor="credentialType">
                    Credential Type
                  </label>

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
                  <label htmlFor="completionYear">
                    Completion Year
                  </label>

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

            {/* Issuance error */}
            {error && (
              <div className="issuer-error" role="alert">
                {error}
              </div>
            )}

            {/* Form actions */}
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
                  loading ||
                  studentsLoading ||
                  students.length === 0
                }
              >
                {loading
                  ? 'Issuing Credential...'
                  : 'Issue Credential'}
              </button>
            </div>

            <p className="issuer-security-note">
              Issuance submits a real request to the CrediVault backend.
              Confirm the selected student and academic details before
              submitting.
            </p>
          </form>
        </section>

        {/* Successful issuance */}
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
                <strong>
                  {formatDate(issuedCredential.issuedAt)}
                </strong>
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
              Save the credential code for testing verification.
              The credential can be verified through the CrediVault
              verification service.
            </p>
          </section>
        )}

        <footer className="issuer-footer">
          CrediVault · Digital Academic Credential Issuance
        </footer>
      </div>
    </main>
  )
}

export default IssuerDashboard