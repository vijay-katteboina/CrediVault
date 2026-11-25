import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE_URL } from '../../services/api'
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
} from '../../components/ui'
import './ResetPasswordPage.css'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid or missing password reset token.')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            newPassword,
          }),
        }
      )

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(
          responseText || 'Password reset failed. The link may have expired.'
        )
      }

      setSuccess(
        responseText || 'Your password has been reset successfully.'
      )

      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2500)

    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="reset-password-page">
      <Card as="section" className="reset-password-card" aria-labelledby="password-title">

        <div className="reset-password-brand">
          <div className="reset-password-logo" aria-hidden="true">CV</div>
          <p className="reset-password-brand-name">CrediVault</p>
          <p>Digital Academic Credential Platform</p>
        </div>

        <div className="reset-password-heading">
          <h1 id="password-title">Reset Your Password</h1>
          <p>
            Create a new password for your CrediVault account.
          </p>
        </div>

        {!token ? (
          <Alert variant="danger" className="reset-feedback">
            Invalid or missing reset token.
            <p>Please request a new password reset link.</p>
            <Link to="/forgot-password">
              Request New Link
            </Link>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="reset-form">

            <FormField id="newPassword" label="New Password" required>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </FormField>

            <FormField id="confirmPassword" label="Confirm Password" required>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
              />
            </FormField>

            <p className="reset-password-hint">
              Password must contain at least 8 characters.
            </p>

            {error && (
              <Alert variant="danger" className="reset-feedback">
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" className="reset-feedback">
                {success}
                <p>Redirecting you to login...</p>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || Boolean(success)}
              loading={loading}
              loadingLabel="Resetting Password..."
              className="reset-submit"
            >
              Reset Password
            </Button>

          </form>
        )}

        <div className="reset-password-footer">
          <Link to="/login">
            Back to Login
          </Link>
        </div>

      </Card>
    </main>
  )
}

export default ResetPasswordPage