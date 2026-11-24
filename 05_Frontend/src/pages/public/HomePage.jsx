import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'
import './HomePage.css'

const CURRENT_YEAR = new Date().getFullYear()

function HomePage() {
  return (
    <div className="home-page">

      {/* Navigation */}
      <header className="home-navbar">
        <Link to="/" className="home-logo">
          <span className="logo-icon">C</span>
          <span>CrediVault</span>
        </Link>

        <nav className="home-nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <div className="home-nav-actions">
          <Link to="/login" className="nav-login">
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="home-hero" id="home">

        <div className="hero-content">
          <span className="hero-badge">
            DIGITAL ACADEMIC CREDENTIAL PLATFORM
          </span>

          <h1>
            Your Academic Achievements,
            <span> Digitally Verified.</span>
          </h1>

          <p>
            CrediVault provides a secure and reliable platform
            for issuing, storing and verifying academic credentials.
            Experience transparent and trustworthy digital
            credential management.
          </p>

          <div className="hero-buttons">
            <Link to="/verify" className="hero-primary-btn">
              Verify Credential →
            </Link>

            <Link to="/login" className="hero-secondary-btn">
              Login to CrediVault
            </Link>
          </div>

          <div className="hero-trust-note">
            Secure · Transparent · Verifiable
          </div>
        </div>

        <div className="hero-visual">
          <div className="certificate-preview">

            <div className="certificate-top">
              <span className="certificate-brand">CrediVault</span>
              <span className="certificate-seal">✦</span>
            </div>

            <div className="certificate-content">
              <span className="certificate-label">
                CERTIFICATE OF ACHIEVEMENT
              </span>

              <h2>Academic Certificate</h2>

              <p>This certificate is proudly presented to</p>

              <h3>Student Name</h3>

              <p>
                For successfully completing the academic
                qualification.
              </p>

              <div className="certificate-details">
                <span>Credential ID</span>
                <strong>CV-XXXX-XXXX</strong>
              </div>

              <div className="certificate-bottom">
                <span>Authorized Institution</span>
                <span className="certificate-qr">▦</span>
              </div>
            </div>

            <div className="certificate-verified">
              ✓ Digitally Verifiable
            </div>

          </div>
        </div>

      </section>

      {/* About Section */}
      <section className="home-about" id="about">

        <div className="section-heading">
          <span>ABOUT CREDIVAULT</span>
          <h2>Trust in Every Credential</h2>
          <p>
            A centralized digital platform designed to improve
            the authenticity, accessibility and security of
            academic credentials.
          </p>
        </div>

      </section>

      {/* Features Section */}
      <section className="home-features" id="features">

        <div className="section-heading">
          <span>OUR FEATURES</span>
          <h2>Everything Your Credentials Need</h2>
          <p>
            Simplifying academic credential management
            through secure digital technology.
          </p>
        </div>

        <div className="feature-grid">

          <Card as="article" className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure Credential Issuance</h3>
            <p>
              Institutions can issue academic credentials
              through a secure and controlled system.
            </p>
          </Card>

          <Card as="article" className="feature-card">
            <div className="feature-icon">🎓</div>
            <h3>Digital Student Wallet</h3>
            <p>
              Students can access and manage their
              academic credentials digitally.
            </p>
          </Card>

          <Card as="article" className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>QR Code Verification</h3>
            <p>
              Verify credential authenticity using a
              unique QR code without requiring an account.
            </p>
          </Card>

          <Card as="article" className="feature-card">
            <div className="feature-icon">📜</div>
            <h3>Digital Certificates</h3>
            <p>
              Generate professional digital certificates
              with unique credential identifiers.
            </p>
          </Card>

          <Card as="article" className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Credential Authenticity</h3>
            <p>
              Maintain trust through cryptographic
              credential verification.
            </p>
          </Card>

          <Card as="article" className="feature-card">
            <div className="feature-icon">📧</div>
            <h3>Email Notifications</h3>
            <p>
              Keep students informed about their
              newly issued academic credentials.
            </p>
          </Card>

        </div>

      </section>

      {/* How It Works */}
      <section className="home-workflow" id="how-it-works">

        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>Three Simple Steps</h2>
        </div>

        <div className="workflow-grid">

          <Card as="article" className="workflow-card">
            <div className="workflow-number">01</div>
            <h3>Issue</h3>
            <p>
              Authorized institutions issue digital
              academic credentials.
            </p>
          </Card>

          <Card as="article" className="workflow-card">
            <div className="workflow-number">02</div>
            <h3>Store</h3>
            <p>
              Students access their credentials
              through their digital wallet.
            </p>
          </Card>

          <Card as="article" className="workflow-card">
            <div className="workflow-number">03</div>
            <h3>Verify</h3>
            <p>
              Anyone can verify credential authenticity
              through its unique QR code or credential ID.
            </p>
          </Card>

        </div>

      </section>

      {/* Call to Action */}
      <section className="home-cta">

        <h2>Make Academic Credentials Trustworthy.</h2>

        <p>
          Experience a smarter way to issue,
          manage and verify academic achievements.
        </p>

        <Link to="/verify" className="hero-primary-btn">
          Verify a Credential →
        </Link>

      </section>

      {/* Footer */}
      <footer className="home-footer">

        <div>
          <h2>CrediVault</h2>
          <p>Digital Academic Credential Platform</p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/verify">Verify Credential</Link>
        </div>

        <p className="footer-copyright">
          © {CURRENT_YEAR} CrediVault. All rights reserved.
        </p>

      </footer>

    </div>
  )
}

export default HomePage