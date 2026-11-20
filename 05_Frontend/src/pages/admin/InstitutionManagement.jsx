import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import './InstitutionManagement.css'

function InstitutionManagement() {
  const navigate = useNavigate()

  const [institutions, setInstitutions] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalInstitutions, setTotalInstitutions] = useState(0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busyInstitutionId, setBusyInstitutionId] = useState(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [selectedInstitution, setSelectedInstitution] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
      setError(
        'Administrator permission is required to manage institutions.'
      )
      return
    }

    setError(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'The requested institution operation could not be completed.'
    )
  }, [navigate])

  // Load institutions from the administrator API.
  useEffect(() => {
    let active = true

    const loadInstitutions = async () => {
      const params = {
        page,
        size: 10,
      }

      if (search) params.search = search
      if (status) params.status = status

      try {
        const response = await api.get('/admin/institutions', { params })

        if (!active) return

        const data = response.data

        setInstitutions(data.content || [])
        setTotalInstitutions(data.totalElements || 0)
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

    void loadInstitutions()

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

  const refreshInstitutions = () => {
    setNotice('')
    setError('')
    setLoading(true)
    setRefreshing(true)
    setReloadKey((current) => current + 1)
  }

  const viewInstitution = async (institutionId) => {
    setDetailLoading(true)
    setSelectedInstitution(null)
    setError('')

    try {
      const response = await api.get(
        `/admin/institutions/${institutionId}`
      )

      setSelectedInstitution(response.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const changeInstitutionStatus = async (institution) => {
    const isActive = institution.status === 'ACTIVE'
    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE'
    const action = isActive ? 'deactivate' : 'activate'

    const confirmed = window.confirm(
      `Are you sure you want to ${action} institution "${institution.institutionName}"?`
    )

    if (!confirmed) return

    setBusyInstitutionId(institution.institutionId)
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/admin/institutions/${institution.institutionId}/status`,
        { status: nextStatus }
      )

      const updatedInstitution = response.data

      if (
        selectedInstitution?.institutionId ===
        updatedInstitution.institutionId
      ) {
        setSelectedInstitution(updatedInstitution)
      }

      setNotice(
        `${updatedInstitution.institutionName} is now ${updatedInstitution.status}.`
      )

      setLoading(true)
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setBusyInstitutionId(null)
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
    <main className="admin-institutions-page">
      <div className="admin-institutions-container">

        {/* Header */}
        <header className="admin-institutions-header">
          <div>
            <p className="admin-institutions-brand">CrediVault</p>
            <span className="admin-institutions-role">
              ADMINISTRATOR
            </span>
          </div>

          <div className="institutions-header-actions">
            <button
              type="button"
              className="institutions-secondary-button"
              onClick={() => navigate('/admin')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="institutions-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Heading */}
        <section className="admin-institutions-heading">
          <div>
            <p className="institutions-kicker">
              SYSTEM ADMINISTRATION
            </p>

            <h1>Institution Management</h1>

            <p>
              Monitor registered institutions and their academic
              credential activity.
            </p>
          </div>

          <button
            type="button"
            className="institutions-secondary-button institutions-refresh-button"
            onClick={refreshInstitutions}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh Institutions'}
          </button>
        </section>

        {/* Messages */}
        {notice && (
          <div className="institutions-success-message" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="institutions-error-message" role="alert">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <section className="institutions-summary-grid">

          <article className="institutions-summary-card">
            <span>Matching Institutions</span>
            <strong>
              {loading ? '...' : totalInstitutions}
            </strong>
          </article>

          <article className="institutions-summary-card">
            <span>Displayed Institutions</span>
            <strong>
              {loading ? '...' : institutions.length}
            </strong>
          </article>

          <article className="institutions-summary-card">
            <span>Current Page</span>
            <strong>{page + 1}</strong>
          </article>

        </section>

        {/* Filters */}
        <section className="institutions-filter-card">

          <div className="institutions-section-title">
            <p className="institutions-kicker">
              INSTITUTION DIRECTORY
            </p>

            <h2>Registered Institutions</h2>

            <p>
              Search institutions using their name or institution code
              and filter by status.
            </p>
          </div>

          <form
            className="institutions-filter-form"
            onSubmit={handleSearch}
          >

            <div className="institutions-filter-group institutions-search-group">
              <label htmlFor="institutionSearch">
                Search Institutions
              </label>

              <input
                id="institutionSearch"
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by institution name or code..."
                maxLength={100}
              />
            </div>

            <div className="institutions-filter-group">
              <label htmlFor="institutionStatusFilter">
                Institution Status
              </label>

              <select
                id="institutionStatusFilter"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="institutions-filter-actions">
              <button
                type="submit"
                className="institutions-search-button"
              >
                Search
              </button>

              <button
                type="button"
                className="institutions-clear-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>

          </form>
        </section>

        {/* Institution Table */}
        <section className="institutions-table-card">

          <div className="institutions-table-heading">
            <div>
              <p className="institutions-kicker">
                CREDIVAULT DATABASE
              </p>

              <h2>Institution Records</h2>
            </div>

            <span className="institutions-record-count">
              {totalInstitutions} institutions found
            </span>
          </div>

          <div className="institutions-table-wrapper">

            <table className="admin-institutions-table">

              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Institution ID</th>
                  <th>Institution Code</th>
                  <th>Issuers</th>
                  <th>Students</th>
                  <th>Credentials</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="8" className="institutions-empty-state">
                      Loading institution records...
                    </td>
                  </tr>
                ) : institutions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="institutions-empty-state">
                      No institutions match your search criteria.
                    </td>
                  </tr>
                ) : (
                  institutions.map((institution) => {
                    const isActive = institution.status === 'ACTIVE'

                    const isBusy =
                      busyInstitutionId === institution.institutionId

                    return (
                      <tr key={institution.institutionId}>

                        <td>
                          <div className="institutions-name-cell">
                            <strong>
                              {institution.institutionName}
                            </strong>

                            <span>
                              Registered Institution
                            </span>
                          </div>
                        </td>

                        <td>
                          #{institution.institutionId}
                        </td>

                        <td>
                          <strong className="institution-code">
                            {institution.institutionCode}
                          </strong>
                        </td>

                        <td>{institution.totalIssuers ?? 0}</td>

                        <td>{institution.totalStudents ?? 0}</td>

                        <td>{institution.totalCredentials ?? 0}</td>

                        <td>
                          <span
                            className={`institutions-status-badge ${
                              isActive ? 'active' : 'inactive'
                            }`}
                          >
                            {institution.status}
                          </span>
                        </td>

                        <td>
                          <div className="institutions-action-buttons">

                            <button
                              type="button"
                              className="institutions-view-button"
                              onClick={() =>
                                viewInstitution(institution.institutionId)
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className={`institutions-status-button ${
                                isActive ? 'deactivate' : 'activate'
                              }`}
                              onClick={() =>
                                changeInstitutionStatus(institution)
                              }
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

          {/* Pagination */}
          <div className="institutions-pagination">

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

        {/* Information Note */}
        <div className="institutions-info-note">
          <strong>Institution status affects credential operations.</strong>

          <span>
            Deactivating an institution can prevent its associated issuers
            from performing new credential issuance and revocation operations.
            Review the institution carefully before changing its status.
          </span>
        </div>

        {/* Institution Details Modal */}
        {(detailLoading || selectedInstitution) && (

          <div
            className="institutions-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedInstitution(null)
                setDetailLoading(false)
              }
            }}
          >

            <section
              className="institutions-details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="institutionDetailsTitle"
            >

              <header>
                <div>
                  <p className="institutions-kicker">
                    INSTITUTION INFORMATION
                  </p>

                  <h2 id="institutionDetailsTitle">
                    Institution Details
                  </h2>
                </div>

                <button
                  type="button"
                  className="institutions-secondary-button"
                  onClick={() => {
                    setSelectedInstitution(null)
                    setDetailLoading(false)
                  }}
                >
                  Close
                </button>
              </header>

              {detailLoading ? (
                <p className="institutions-modal-loading">
                  Loading institution details...
                </p>
              ) : (
                selectedInstitution && (

                  <div className="institutions-details-grid">

                    <div>
                      <span>Institution ID</span>
                      <strong>
                        {selectedInstitution.institutionId}
                      </strong>
                    </div>

                    <div>
                      <span>Institution Name</span>
                      <strong>
                        {selectedInstitution.institutionName}
                      </strong>
                    </div>

                    <div>
                      <span>Institution Code</span>
                      <strong>
                        {selectedInstitution.institutionCode}
                      </strong>
                    </div>

                    <div>
                      <span>Institution Status</span>
                      <strong>
                        {selectedInstitution.status}
                      </strong>
                    </div>

                    <div>
                      <span>Total Issuers</span>
                      <strong>
                        {selectedInstitution.totalIssuers ?? 0}
                      </strong>
                    </div>

                    <div>
                      <span>Total Students</span>
                      <strong>
                        {selectedInstitution.totalStudents ?? 0}
                      </strong>
                    </div>

                    <div>
                      <span>Total Credentials</span>
                      <strong>
                        {selectedInstitution.totalCredentials ?? 0}
                      </strong>
                    </div>

                    <div>
                      <span>Created At</span>
                      <strong>
                        {formatDate(selectedInstitution.createdAt)}
                      </strong>
                    </div>

                  </div>
                )
              )}

            </section>

          </div>
        )}

        {/* Footer */}
        <footer className="admin-institutions-footer">
          CrediVault · Administrator Institution Management
        </footer>

      </div>
    </main>
  )
}

export default InstitutionManagement