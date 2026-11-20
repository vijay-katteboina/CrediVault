import { useState } from 'react'
import './RoleLayout.css'

function RoleLayout({
  role,
  navItems,
  activeKey,
  onNavigate,
  onLogout,
  children,
  profile,
  profileLoading = false,
  profileError = '',
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeItem = navItems.find(
    (item) => item.key === activeKey
  )

  const roleName = {
    ADMIN: 'Administrator',
    ISSUER: 'Authorized Issuer',
    STUDENT: 'Student',
    VERIFIER: 'Credential Verifier',
  }

  const displayName =
    profile?.fullName || roleName[role] || role

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  const handleNavigation = (key) => {
    onNavigate(key)
    setMobileOpen(false)
  }

  return (
    <div className={`role-layout ${mobileOpen ? 'sidebar-open' : ''}`}>

      {/* Sidebar */}
      <aside className="role-sidebar">

        {/* Branding */}
        <div className="role-brand">
          <div className="role-brand-icon">CV</div>

          <div>
            <h2>CrediVault</h2>
            <span>ACADEMIC CREDENTIAL SYSTEM</span>
          </div>
        </div>

        {/* Dynamic user profile */}
        <div className="role-profile">

          <div className="role-profile-avatar">
            {initials || 'CV'}
          </div>

          <div className="role-profile-info">

            <strong title={displayName}>
              {profileLoading ? 'Loading profile...' : displayName}
            </strong>

            <span>{profile?.role || role} PORTAL</span>

            {profileError ? (
              <small className="role-profile-error">
                {profileError}
              </small>
            ) : (
              <>
                {profile?.email && (
                  <small title={profile.email}>
                    {profile.email}
                  </small>
                )}

                {profile?.institutionName && (
                  <small
                    className="role-profile-institution"
                    title={profile.institutionName}
                  >
                    {profile.institutionName}
                  </small>
                )}

                {profile?.institutionCode && (
                  <small>
                    {profile.institutionCode}
                  </small>
                )}

                {profile?.accountStatus && (
                  <span className="role-profile-status">
                    {profile.accountStatus}
                  </span>
                )}
              </>
            )}

          </div>
        </div>

        {/* Navigation */}
        <nav className="role-navigation">

          <p className="role-navigation-label">
            WORKSPACE
          </p>

          {navItems.map((item) => {
            const isActive = activeKey === item.key

            return (
              <button
                key={item.key}
                type="button"
                className={`role-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigation(item.key)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="role-nav-icon">
                  {item.icon}
                </span>

                <span className="role-nav-label">
                  {item.label}
                </span>

                {isActive && (
                  <span className="role-nav-indicator">›</span>
                )}
              </button>
            )
          })}

        </nav>

        {/* Footer */}
        <div className="role-sidebar-footer">

          <div className="role-security-indicator">
            <span className="role-security-dot" />

            <div>
              <strong>Secure Workspace</strong>
              <small>Protected Access</small>
            </div>
          </div>

          <p>CrediVault · Version 1.0</p>

        </div>

      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="role-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Main workspace */}
      <div className="role-main">

        {/* Topbar */}
        <header className="role-topbar">

          <div className="role-topbar-left">

            <button
              type="button"
              className="role-menu-toggle"
              onClick={() =>
                setMobileOpen((current) => !current)
              }
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
            >
              ☰
            </button>

            <div className="role-breadcrumb">
              <span>CrediVault</span>
              <span className="role-breadcrumb-divider">/</span>
              <strong>
                {activeItem?.label || roleName[role]}
              </strong>
            </div>

          </div>

          <div className="role-topbar-right">

            <span className="role-topbar-badge">
              {role}
            </span>

            <button
              type="button"
              className="role-logout-button"
              onClick={onLogout}
            >
              Logout
            </button>

          </div>

        </header>

        {/* Page content */}
        <main className="role-content">

          <section className="role-page-heading">

            <div>
              <p className="role-page-kicker">
                {role} WORKSPACE
              </p>

              <h1>
                {activeItem?.pageTitle ||
                  activeItem?.label ||
                  'Dashboard'}
              </h1>

              <p>
                {activeItem?.description ||
                  'Manage your CrediVault workspace.'}
              </p>
            </div>

          </section>

          <section className="role-content-area">
            {children}
          </section>

          <footer className="role-footer">
            CrediVault · Digital Academic Credential Issuance and Verification System
          </footer>

        </main>

      </div>

    </div>
  )
}

export default RoleLayout