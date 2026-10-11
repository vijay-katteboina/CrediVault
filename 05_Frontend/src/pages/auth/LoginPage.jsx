import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const ROLE_OPTIONS = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Access your academic credentials',
  },
  {
    value: 'ISSUER',
    label: 'Issuer',
    description: 'Issue academic credentials',
  },
  {
    value: 'VERIFIER',
    label: 'Verifier',
    description: 'Verify credential authenticity',
  },
  {
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Manage the CrediVault platform',
  },
]

const ROLE_ROUTES = {
  STUDENT: '/student',
  ISSUER: '/issuer',
  VERIFIER: '/verifier',
  ADMIN: '/admin',
}

function LoginPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')

    // Require the user to select an account type.
    if (!selectedRole) {
      setError('Please select your account type before signing in.')
      return
    }

    setLoading(true)

    try {
      // Authenticate using the existing backend login API.
      const response = await api.post('/auth/login', formData)

      const { token, role: returnedRole } = response.data

      const actualRole = String(returnedRole || '').toUpperCase()

      // Confirm that the server returned a valid token and role.
      if (!token || !ROLE_ROUTES[actualRole]) {
        setError('The server returned an invalid login response.')
        return
      }

      // The role selected on the form must match the authenticated account.
      if (actualRole !== selectedRole) {
        localStorage.removeItem('credivaultToken')
        localStorage.removeItem('credivaultRole')

        const actualRoleLabel =
          ROLE_OPTIONS.find((item) => item.value === actualRole)?.label ||
          actualRole

        const selectedRoleLabel =
          ROLE_OPTIONS.find((item) => item.value === selectedRole)?.label ||
          selectedRole

        setError(
          `These credentials belong to a ${actualRoleLabel} account, ` +
          `but you selected ${selectedRoleLabel}. ` +
          `Please select ${actualRoleLabel} and try again.`
        )

        return
      }

      // Store the authenticated session only after the role matches.
      localStorage.setItem('credivaultToken', token)
      localStorage.setItem('credivaultRole', actualRole)

      // Navigate to the dashboard associated with the returned role.
      navigate(ROLE_ROUTES[actualRole], { replace: true })
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Login failed. Please check your email and password.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">

        {/* CrediVault branding */}
        <div className="login-header">
          <h1>CrediVault</h1>
          <p>Digital Academic Credential Platform</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">

          {/* Account type selection */}
          <div className="form-group">
            <label htmlFor="role">Sign in as</label>

            <select
              id="role"
              name="role"
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value)
                setError('')
              }}
              disabled={loading}
              required
              className="login-role-select"
            >
              <option value="" disabled>
                Select your account type
              </option>

              {ROLE_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {selectedRole && (
              <small className="role-description">
                {
                  ROLE_OPTIONS.find(
                    (option) => option.value === selectedRole
                  )?.description
                }
              </small>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <p className="login-security-note">
          Secure access for students, issuers, verifiers and administrators.
        </p>

      </section>
    </main>
  )
}

export default LoginPage