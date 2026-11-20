import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import './IssuerManagement.css'

function IssuerManagement() {
  const navigate = useNavigate()

  const [issuers, setIssuers] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalIssuers, setTotalIssuers] = useState(0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyIssuerId, setBusyIssuerId] = useState(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [selectedIssuer, setSelectedIssuer] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // A changed reload key deliberately triggers a fresh API request.
  const [reloadKey, setReloadKey] = useState(0)

  const handleApiError = useCallback((err) => {
    const statusCode = err.response?.status

    if (statusCode === 401) {
      localStorage.removeItem('credivaultToken')
      localStorage.removeItem('credivaultRole')
      navigate('/login', { replace: true })
      return
    }

    if (statusCode === 403) {
      setError('Administrator permission is required to manage issuer accounts.')
      return
    }

    setError(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'The requested issuer operation could not be completed.'
    )
  }, [navigate])

  // Load only ISSUER accounts through the existing administrator API.
  useEffect(() => {
    let active = true

    const loadIssuers = async () => {
      const params = {
        role: 'ISSUER',
        page,
        size: 10,
      }

      if (search) params.search = search
      if (status) params.status = status

      try {
        const response = await api.get('/admin/users', { params })

        if (!active) return

        const data = response.data
        setIssuers(data.content || [])
        setTotalIssuers(data.totalElements || 0)
        setTotalPages(Math.max(data.totalPages || 1, 1))
      } catch (err) {
        if (active) handleApiError(err)
      } finally {
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadIssuers()

    return () => {
      active = false
    }
  }, [page, search, status, reloadKey, handleApiError])

  const handleSearch = (event) => {
    event.preventDefault()
    setNotice('')
    setError('')
    setLoading(true)
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleStatusChange = (event) => {
    setNotice('')
    setError('')
    setLoading(true)
    setPage(0)
    setStatus(event.target.value)
  }

  const clearFilters = () => {
    setNotice('')
    setError('')
    setSearchInput('')
    setSearch('')
    setStatus('')
    setPage(0)
    setLoading(true)
  }

  const refreshIssuers = () => {
    setNotice('')
    setError('')
    setLoading(true)
    setRefreshing(true)
    setReloadKey((current) => current + 1)
  }

  const viewIssuer = async (issuerId) => {
    setDetailLoading(true)
    setSelectedIssuer(null)
    setError('')

    try {
      const response = await api.get(`/admin/users/${issuerId}`)
      setSelectedIssuer(response.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const changeIssuerStatus = async (issuer) => {
    const isActive = issuer.accountStatus === 'ACTIVE'
    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE'
    const action = isActive ? 'deactivate' : 'activate'

    const confirmed = window.confirm(
      `Are you sure you want to ${action} issuer account "${issuer.fullName}"?`
    )

    if (!confirmed) return

    setBusyIssuerId(issuer.userId)
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/admin/users/${issuer.userId}/status`,
        { accountStatus: nextStatus }
      )

      const updatedIssuer = response.data

      if (selectedIssuer?.userId === updatedIssuer.userId) {
        setSelectedIssuer(updatedIssuer)
      }

      setNotice(
        `${updatedIssuer.fullName}'s issuer account is now ${updatedIssuer.accountStatus}.`
      )

      // Re-fetch so status-filtered lists stay accurate.
      setLoading(true)
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setBusyIssuerId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')
    navigate('/login', { replace: true })
  }

  const formatDate = (value) => {
    if (!value) return 'Not available'
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? 'Not available'
      : date.toLocaleString('en-IN')
  }

  return (
    <main className="admin-issuers-page">
      <div className="admin-issuers-container">

        <header className="admin-issuers-header">
          <div>
            <p className="admin-issuers-brand">CrediVault</p>
            <span className="admin-issuers-role">ADMINISTRATOR</span>
          </div>

          <div className="admin-issuers-header-actions">
            <button
              type="button"
              className="issuers-secondary-button"
              onClick={() => navigate('/admin')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="issuers-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <section className="admin-issuers-heading">
          <div>
            <p className="issuers-kicker">SYSTEM ADMINISTRATION</p>
            <h1>Issuer Management</h1>
            <p>
              Review authorized issuer accounts and their institution associations.
            </p>
          </div>

          <button
            type="button"
            className="issuers-secondary-button issuers-refresh-button"
            onClick={refreshIssuers}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh Issuers'}
          </button>
        </section>

        {notice && (
          <div className="issuers-success-message" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="issuers-error-message" role="alert">
            {error}
          </div>
        )}

        <section className="issuers-summary-grid">
          <article className="issuers-summary-card">
            <span>Matching Issuers</span>
            <strong>{loading ? '...' : totalIssuers}</strong>
          </article>

          <article className="issuers-summary-card">
            <span>Displayed Issuers</span>
            <strong>{loading ? '...' : issuers.length}</strong>
          </article>

          <article className="issuers-summary-card">
            <span>Current Page</span>
            <strong>{page + 1}</strong>
          </article>
        </section>

        <section className="issuers-filter-card">
          <div className="issuers-section-title">
            <p className="issuers-kicker">ISSUER DIRECTORY</p>
            <h2>Registered Issuers</h2>
            <p>Search issuer names or email addresses and filter by account status.</p>
          </div>

          <form className="issuers-filter-form" onSubmit={handleSearch}>
            <div className="issuers-filter-group issuers-search-group">
              <label htmlFor="issuerSearch">Search Issuers</label>
              <input
                id="issuerSearch"
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by issuer name or email..."
                maxLength={100}
              />
            </div>

            <div className="issuers-filter-group">
              <label htmlFor="issuerStatusFilter">Account Status</label>
              <select
                id="issuerStatusFilter"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="issuers-filter-actions">
              <button type="submit" className="issuers-search-button">
                Search
              </button>

              <button
                type="button"
                className="issuers-clear-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </form>
        </section>

        <section className="issuers-table-card">
          <div className="issuers-table-heading">
            <div>
              <p className="issuers-kicker">CREDIVAULT DATABASE</p>
              <h2>Issuer Records</h2>
            </div>

            <span className="issuers-record-count">
              {totalIssuers} issuers found
            </span>
          </div>

          <div className="issuers-table-wrapper">
            <table className="admin-issuers-table">
              <thead>
                <tr>
                  <th>Issuer</th>
                  <th>Issuer ID</th>
                  <th>Institution</th>
                  <th>Institution Code</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="issuers-empty-state">
                      Loading issuer records...
                    </td>
                  </tr>
                ) : issuers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="issuers-empty-state">
                      No issuer accounts match your search criteria.
                    </td>
                  </tr>
                ) : (
                  issuers.map((issuer) => {
                    const isActive = issuer.accountStatus === 'ACTIVE'
                    const isBusy = busyIssuerId === issuer.userId

                    return (
                      <tr key={issuer.userId}>
                        <td>
                          <div className="issuers-name-cell">
                            <strong>{issuer.fullName}</strong>
                            <span>{issuer.email}</span>
                          </div>
                        </td>

                        <td>#{issuer.userId}</td>

                        <td>{issuer.institutionName || 'Not assigned'}</td>

                        <td>{issuer.institutionCode || 'Not available'}</td>

                        <td>
                          <span
                            className={`issuers-status-badge ${isActive ? 'active' : 'inactive'}`}
                          >
                            {issuer.accountStatus}
                          </span>
                        </td>

                        <td>
                          <div className="issuers-action-buttons">
                            <button
                              type="button"
                              className="issuers-view-button"
                              onClick={() => viewIssuer(issuer.userId)}
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className={`issuers-status-button ${isActive ? 'deactivate' : 'activate'}`}
                              onClick={() => changeIssuerStatus(issuer)}
                              disabled={isBusy}
                            >
                              {isBusy
                                ? 'Saving...'
                                : isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="issuers-pagination">
            <span>
              Page {page + 1} of {totalPages}
            </span>

            <div>
              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  setPage((current) => Math.max(0, current - 1))
                }}
                disabled={page === 0 || loading}
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  setPage((current) => current + 1)
                }}
                disabled={page + 1 >= totalPages || loading}
              >
                Next →
              </button>
            </div>
          </div>
        </section>

        <div className="issuers-info-note">
          <strong>Institution association is read-only in this module.</strong>
          <span>
            Issuer-to-institution assignment and cryptographic key provisioning
            are not changed from this screen. Existing institution and signing-key
            records remain untouched.
          </span>
        </div>

        {(detailLoading || selectedIssuer) && (
          <div
            className="issuers-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedIssuer(null)
                setDetailLoading(false)
              }
            }}
          >
            <section
              className="issuers-details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="issuerDetailsTitle"
            >
              <header>
                <div>
                  <p className="issuers-kicker">ISSUER INFORMATION</p>
                  <h2 id="issuerDetailsTitle">Issuer Details</h2>
                </div>

                <button
                  type="button"
                  className="issuers-secondary-button"
                  onClick={() => {
                    setSelectedIssuer(null)
                    setDetailLoading(false)
                  }}
                >
                  Close
                </button>
              </header>

              {detailLoading ? (
                <p className="issuers-modal-loading">Loading issuer details...</p>
              ) : (
                selectedIssuer && (
                  <div className="issuers-details-grid">
                    <div>
                      <span>Issuer ID</span>
                      <strong>{selectedIssuer.userId}</strong>
                    </div>

                    <div>
                      <span>Full Name</span>
                      <strong>{selectedIssuer.fullName}</strong>
                    </div>

                    <div>
                      <span>Email Address</span>
                      <strong>{selectedIssuer.email}</strong>
                    </div>

                    <div>
                      <span>User Role</span>
                      <strong>{selectedIssuer.role}</strong>
                    </div>

                    <div>
                      <span>Account Status</span>
                      <strong>{selectedIssuer.accountStatus}</strong>
                    </div>

                    <div>
                      <span>Institution ID</span>
                      <strong>{selectedIssuer.institutionId ?? 'Not assigned'}</strong>
                    </div>

                    <div>
                      <span>Institution</span>
                      <strong>{selectedIssuer.institutionName || 'Not assigned'}</strong>
                    </div>

                    <div>
                      <span>Institution Code</span>
                      <strong>{selectedIssuer.institutionCode || 'Not available'}</strong>
                    </div>

                    <div>
                      <span>Created At</span>
                      <strong>{formatDate(selectedIssuer.createdAt)}</strong>
                    </div>
                  </div>
                )
              )}
            </section>
          </div>
        )}

        <footer className="admin-issuers-footer">
          CrediVault · Administrator Issuer Management
        </footer>
      </div>
    </main>
  )
}

export default IssuerManagement
