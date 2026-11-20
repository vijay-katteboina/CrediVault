import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import './StudentManagement.css'

const INITIAL_FORM = {
  fullName: '',
  email: '',
  password: '',
  studentNumber: '',
  course: '',
  academicYear: '2026-2027',
}

function StudentManagement({
  onStudentsChanged,
  view = 'all',
}) {
  const navigate = useNavigate()

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Registration
  const [formData, setFormData] = useState({ ...INITIAL_FORM })
  const [registering, setRegistering] = useState(false)

  // Profile update
  const [editingStudent, setEditingStudent] = useState(null)
  const [editForm, setEditForm] = useState({
    fullName: '',
    course: '',
    academicYear: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  // Student details
  const [viewingStudent, setViewingStudent] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // Account status
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)

  // Handle expired or unauthorized sessions.
  const handleUnauthorized = useCallback((err) => {
  if (err.response?.status === 401) {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
    return true
  }

  return false
}, [navigate])

  // Load students belonging to the authenticated issuer.
  const loadStudents = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const response = await api.get('/issuer/students')

      setStudents(
        Array.isArray(response.data) ? response.data : []
      )
    } catch (err) {
      if (handleUnauthorized(err)) {
        return
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Unable to load registered students.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
}, [handleUnauthorized])

  // Check the issuer session and load students.
// Check the issuer session and load students.
useEffect(() => {
  const token = localStorage.getItem('credivaultToken')
  const role = localStorage.getItem('credivaultRole')

  if (!token) {
    navigate('/login', { replace: true })
    return
  }

  if (role !== 'ISSUER') {
    const routes = {
      STUDENT: '/student',
      VERIFIER: '/verifier',
      ADMIN: '/admin',
    }

    navigate(routes[role] || '/login', {
      replace: true,
    })

    return
  }

  const loadTimer = window.setTimeout(() => {
    void loadStudents()
  }, 0)

  return () => {
    window.clearTimeout(loadTimer)
  }
}, [navigate, loadStudents])

  // Search students.
  const filteredStudents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return students
    }

    return students.filter((student) => (
      [
        student.fullName,
        student.email,
        student.studentNumber,
        student.course,
        student.academicYear,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      )
    ))
  }, [students, searchTerm])

  const activeCount = students.filter(
    (student) => student.accountStatus === 'ACTIVE'
  ).length

  const inactiveCount = students.filter(
    (student) => student.accountStatus !== 'ACTIVE'
  ).length

  // Update registration form.
  const handleFormChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    setError('')
  }

  // Register a student.
  const handleRegister = async (event) => {
    event.preventDefault()

    setError('')
    setNotice('')

    if (localStorage.getItem('credivaultRole') !== 'ISSUER') {
      setError('Only authorized issuers can register students.')
      return
    }

    setRegistering(true)

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        studentNumber: formData.studentNumber.trim().toUpperCase(),
        course: formData.course.trim(),
        academicYear: formData.academicYear.trim(),
      }

      const response = await api.post(
        '/issuer/students',
        payload
      )

      setNotice(
        `Student ${response.data.fullName} registered successfully.`
      )

      setFormData({ ...INITIAL_FORM })

      await loadStudents(true)

      onStudentsChanged?.()
    } catch (err) {
      if (handleUnauthorized(err)) {
        return
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Student registration failed. Please check the information.'
      )
    } finally {
      setRegistering(false)
    }
  }

  // Retrieve one student using GET /{studentId}.
  const handleViewStudent = async (studentId) => {
    setDetailsLoading(true)
    setViewingStudent(null)
    setError('')
    setNotice('')

    try {
      const response = await api.get(
        `/issuer/students/${studentId}`
      )

      setViewingStudent(response.data)
    } catch (err) {
      if (handleUnauthorized(err)) {
        return
      }

      setError(
        err.response?.data?.message ||
        'Unable to retrieve student details.'
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  // Open the student editing form.
  const handleStartEdit = (student) => {
    setEditingStudent(student)

    setEditForm({
      fullName: student.fullName || '',
      course: student.course || '',
      academicYear: student.academicYear || '',
    })

    setError('')
    setNotice('')
  }

  const handleEditChange = (event) => {
    const { name, value } = event.target

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  // Update student profile.
  const handleUpdateStudent = async (event) => {
    event.preventDefault()

    if (!editingStudent) {
      return
    }

    setSavingEdit(true)
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/issuer/students/${editingStudent.studentId}`,
        {
          fullName: editForm.fullName.trim(),
          course: editForm.course.trim(),
          academicYear: editForm.academicYear.trim(),
        }
      )

      setNotice('Student profile updated successfully.')
      setEditingStudent(null)

      if (viewingStudent?.studentId === response.data.studentId) {
        setViewingStudent(response.data)
      }

      await loadStudents(true)

      onStudentsChanged?.()
    } catch (err) {
      if (handleUnauthorized(err)) {
        return
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Unable to update student profile.'
      )
    } finally {
      setSavingEdit(false)
    }
  }

  // Activate or deactivate a student.
  const handleStatusChange = async (student) => {
    const newStatus =
      student.accountStatus === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE'

    const confirmed = window.confirm(
      `Are you sure you want to change ${student.fullName}'s account status to ${newStatus}?`
    )

    if (!confirmed) {
      return
    }

    setStatusUpdatingId(student.studentId)
    setError('')
    setNotice('')

    try {
      const response = await api.patch(
        `/issuer/students/${student.studentId}/status`,
        {
          accountStatus: newStatus,
        }
      )

      setNotice(
        `${student.fullName}'s account is now ${response.data.accountStatus}.`
      )

      if (viewingStudent?.studentId === student.studentId) {
        setViewingStudent(response.data)
      }

      await loadStudents(true)

      onStudentsChanged?.()
    } catch (err) {
      if (handleUnauthorized(err)) {
        return
      }

      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Unable to change student account status.'
      )
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <section
      className={`student-management-section student-management-${view}`}
    >

      {/* Heading */}
      <div className="sm-header">
        <div>
          <p className="issuer-section-label">
            STUDENT ADMINISTRATION
          </p>

          <h2>Student Management</h2>

          <p>
            Register, view, update and manage student accounts
            belonging to your institution.
          </p>
        </div>

        <button
          type="button"
          className="sm-refresh-button"
          onClick={() => loadStudents(true)}
          disabled={refreshing || loading}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Students'}
        </button>
      </div>

      {/* Statistics */}
      <div className="sm-stats">

        <article className="sm-stat-card">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </article>

        <article className="sm-stat-card">
          <span>Active Accounts</span>
          <strong>{activeCount}</strong>
        </article>

        <article className="sm-stat-card">
          <span>Inactive Accounts</span>
          <strong>{inactiveCount}</strong>
        </article>

      </div>

      {/* Global messages */}
      {error && (
        <div className="sm-error" role="alert">
          {error}
        </div>
      )}

      {notice && (
        <div className="sm-success" role="status">
          {notice}
        </div>
      )}

      {/* Student registration */}
      <div className="sm-panel">

        <div className="sm-panel-heading">
          <div>
            <p className="issuer-section-label">
              NEW STUDENT
            </p>

            <h3>Register Student</h3>

            <p>
              Create a student login account and academic profile.
            </p>
          </div>
        </div>

        <form
          className="sm-form-grid"
          onSubmit={handleRegister}
        >

          <div className="sm-field">
            <label htmlFor="sm-fullName">Full Name</label>

            <input
              id="sm-fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              maxLength={100}
              placeholder="Enter student's full name"
              required
            />
          </div>

          <div className="sm-field">
            <label htmlFor="sm-email">Email Address</label>

            <input
              id="sm-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleFormChange}
              maxLength={150}
              placeholder="student@example.com"
              required
            />
          </div>

          <div className="sm-field">
            <label htmlFor="sm-password">
              Temporary Password
            </label>

            <input
              id="sm-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleFormChange}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div className="sm-field">
            <label htmlFor="sm-studentNumber">
              Student Number
            </label>

            <input
              id="sm-studentNumber"
              name="studentNumber"
              value={formData.studentNumber}
              onChange={handleFormChange}
              maxLength={50}
              placeholder="Example: CV-STU-001"
              required
            />
          </div>

          <div className="sm-field">
            <label htmlFor="sm-course">Course</label>

            <input
              id="sm-course"
              name="course"
              value={formData.course}
              onChange={handleFormChange}
              maxLength={100}
              placeholder="Example: MCA"
              required
            />
          </div>

          <div className="sm-field">
            <label htmlFor="sm-academicYear">
              Academic Year
            </label>

            <input
              id="sm-academicYear"
              name="academicYear"
              value={formData.academicYear}
              onChange={handleFormChange}
              maxLength={20}
              placeholder="Example: 2026-2027"
              required
            />
          </div>

          <div className="sm-form-actions">
            <button
              type="button"
              className="sm-secondary-button"
              onClick={() => {
                setFormData({ ...INITIAL_FORM })
                setError('')
              }}
              disabled={registering}
            >
              Clear Form
            </button>

            <button
              type="submit"
              className="sm-primary-button"
              disabled={registering}
            >
              {registering
                ? 'Registering Student...'
                : 'Register Student'}
            </button>
          </div>

        </form>

        <p className="sm-security-note">
          The student account will be associated automatically
          with your institution. Passwords are securely hashed
          before storage.
        </p>

      </div>

      {/* Student list */}
      <div className="sm-panel sm-list-panel">

        <div className="sm-panel-heading sm-list-heading">
          <div>
            <p className="issuer-section-label">
              INSTITUTION RECORDS
            </p>

            <h3>Registered Students</h3>

            <p>
              Manage student profiles and account status.
            </p>
          </div>

          <span className="sm-count">
            {students.length} students
          </span>
        </div>

        {/* Search */}
        <div className="sm-search">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by name, email or student number..."
            aria-label="Search registered students"
          />
        </div>

        {loading ? (
          <div className="sm-empty-state">
            Loading registered students...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="sm-empty-state">
            {students.length === 0
              ? 'No students are registered yet.'
              : 'No students match your search.'}
          </div>
        ) : (
          <div className="sm-table-wrapper">

            <table className="sm-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student Number</th>
                  <th>Course</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.studentId}>

                    <td>
                      <strong>{student.fullName}</strong>
                      <span className="sm-email">
                        {student.email}
                      </span>
                    </td>

                    <td className="sm-student-number">
                      {student.studentNumber}
                    </td>

                    <td>
                      <strong>{student.course}</strong>
                      <span className="sm-email">
                        {student.academicYear}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`sm-status ${
                          student.accountStatus?.toLowerCase() ||
                          'unknown'
                        }`}
                      >
                        {student.accountStatus || 'UNKNOWN'}
                      </span>
                    </td>

                    <td>
                      <div className="sm-actions">

                        <button
                          type="button"
                          className="sm-view-button"
                          onClick={() =>
                            handleViewStudent(student.studentId)
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="sm-edit-button"
                          onClick={() => handleStartEdit(student)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={
                            student.accountStatus === 'ACTIVE'
                              ? 'sm-deactivate-button'
                              : 'sm-activate-button'
                          }
                          disabled={
                            statusUpdatingId === student.studentId
                          }
                          onClick={() =>
                            handleStatusChange(student)
                          }
                        >
                          {statusUpdatingId === student.studentId
                            ? 'Updating...'
                            : student.accountStatus === 'ACTIVE'
                              ? 'Deactivate'
                              : 'Activate'}
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}
      </div>

      {/* Student details */}
      {viewingStudent && (
        <div className="sm-panel sm-details-panel">

          <div className="sm-panel-heading">
            <div>
              <p className="issuer-section-label">
                STUDENT PROFILE
              </p>

              <h3>Student Details</h3>
            </div>

            <button
              type="button"
              className="sm-close-button"
              onClick={() => setViewingStudent(null)}
            >
              Close
            </button>
          </div>

          <div className="sm-details-grid">

            <div>
              <span>Student ID</span>
              <strong>{viewingStudent.studentId}</strong>
            </div>

            <div>
              <span>Student Number</span>
              <strong>{viewingStudent.studentNumber}</strong>
            </div>

            <div>
              <span>Full Name</span>
              <strong>{viewingStudent.fullName}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{viewingStudent.email}</strong>
            </div>

            <div>
              <span>Course</span>
              <strong>{viewingStudent.course}</strong>
            </div>

            <div>
              <span>Academic Year</span>
              <strong>{viewingStudent.academicYear}</strong>
            </div>

            <div>
              <span>Account Status</span>
              <strong>{viewingStudent.accountStatus}</strong>
            </div>

          </div>

        </div>
      )}

      {detailsLoading && (
        <div className="sm-empty-state">
          Loading student details...
        </div>
      )}

      {/* Student edit form */}
      {editingStudent && (
        <div className="sm-panel sm-edit-panel">

          <div className="sm-panel-heading">
            <div>
              <p className="issuer-section-label">
                UPDATE STUDENT
              </p>

              <h3>Edit Student Profile</h3>

              <p>
                Student Number and Email cannot be changed here.
              </p>
            </div>
          </div>

          <form
            className="sm-form-grid"
            onSubmit={handleUpdateStudent}
          >

            <div className="sm-field">
              <label htmlFor="sm-edit-name">Full Name</label>

              <input
                id="sm-edit-name"
                name="fullName"
                value={editForm.fullName}
                onChange={handleEditChange}
                maxLength={100}
                required
              />
            </div>

            <div className="sm-field">
              <label htmlFor="sm-edit-course">Course</label>

              <input
                id="sm-edit-course"
                name="course"
                value={editForm.course}
                onChange={handleEditChange}
                maxLength={100}
                required
              />
            </div>

            <div className="sm-field">
              <label htmlFor="sm-edit-year">Academic Year</label>

              <input
                id="sm-edit-year"
                name="academicYear"
                value={editForm.academicYear}
                onChange={handleEditChange}
                maxLength={20}
                required
              />
            </div>

            <div className="sm-form-actions">

              <button
                type="button"
                className="sm-secondary-button"
                onClick={() => setEditingStudent(null)}
                disabled={savingEdit}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="sm-primary-button"
                disabled={savingEdit}
              >
                {savingEdit
                  ? 'Saving Changes...'
                  : 'Save Changes'}
              </button>

            </div>

          </form>
        </div>
      )}

    </section>
  )
}

export default StudentManagement