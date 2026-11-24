import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
} from '../../components/ui'
import './ResetPasswordPage.css'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://localhost:8080/api/v1/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      )

      const result = await response.text()

      if (!response.ok) {
        throw new Error(result || 'Unable to process your request.')
      }

      setSuccess(result)
      setEmail('')

    } catch (err) {
      setError(err.message || 'Something went wrong.')
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
          <h1 id="password-title">Forgot Password?</h1>
          <p>
            Enter your registered email address.
            We'll send you a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <FormField id="email" label="Email Address" required>
            <Input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </FormField>

          {error && (
            <Alert variant="danger" className="reset-feedback">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="reset-feedback">
              {success}
            </Alert>
          )}

          <Button type="submit" loading={loading} loadingLabel="Sending..." className="reset-submit">
            Send Reset Link
          </Button>
        </form>

        <div className="reset-password-footer">
          <Link to="/login">Back to Login</Link>
        </div>

      </Card>
    </main>
  )
}

export default ForgotPasswordPage