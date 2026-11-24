import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Select,
} from '../../components/ui'
import './LoginPage.css'

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
    value: 'ADMIN',
    label: 'Administrator',
    description: 'Manage the CrediVault platform',
  },
]

const ROLE_ROUTES = {
  STUDENT: '/student',
  ISSUER: '/issuer',
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

      // Validate the authentication response.
      if (!token || !ROLE_ROUTES[actualRole]) {
        setError('The server returned an invalid login response.')
        return
      }

      // Verify that the selected role matches the authenticated account.
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
          'These credentials belong to a ' +
          actualRoleLabel +
          ' account, but you selected ' +
          selectedRoleLabel +
          '. Please select ' +
          actualRoleLabel +
          ' and try again.'
        )

        return
      }

      // Store the authenticated session.
      localStorage.setItem('credivaultToken', token)
      localStorage.setItem('credivaultRole', actualRole)

      // Navigate to the corresponding dashboard.
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
      <Card as="section" className="login-card" aria-labelledby="login-title">

        {/* CrediVault branding */}
        <div className="login-header">
          <div className="login-brand-mark" aria-hidden="true">CV</div>
          <h1 id="login-title">CrediVault</h1>
          <p>Digital Academic Credential Platform</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="login-form">

          {/* Account type selection */}
          <FormField
            id="role"
            label="Sign in as"
            required
            hint={selectedRole
              ? ROLE_OPTIONS.find(
                (option) => option.value === selectedRole
              )?.description
              : undefined}
          >
            <Select
              name="role"
              value={selectedRole}
              onChange={(event) => {
                setSelectedRole(event.target.value)
                setError('')
              }}
              disabled={loading}
              required
            >
              <option value="" disabled>
                Select your account type
              </option>

              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          {/* Email */}
          <FormField id="email" label="Email" required>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="username"
              required
              disabled={loading}
            />
          </FormField>

          {/* Password */}
          <FormField id="password" label="Password" required>
            <Input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </FormField>

          {/* Forgot password */}
          <div className="login-forgot-password">
            <Link to="/forgot-password">
              Forgot Password?
            </Link>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant="danger" className="login-alert">
              {error}
            </Alert>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="login-submit"
            loading={loading}
            loadingLabel="Signing in..."
          >
            Sign In
          </Button>

        </form>

        <p className="login-security-note">
          Secure access for students, issuers and administrators.
          Public credential verification requires no login.
        </p>

        {/* Home navigation */}
        <div className="login-footer">
          <Link to="/">Back to Home</Link>
        </div>

      </Card>
    </main>
  )
}

export default LoginPage