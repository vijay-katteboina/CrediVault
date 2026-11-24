import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import AdminLayout from '../../components/layout/AdminLayout'
import { Alert, Button, DataTable, Modal, Pagination, StatusBadge } from '../../components/ui'
import './IssuerManagement.css'

function IssuerManagement() {
  const navigate = useNavigate()

  const [issuers, setIssuers] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('')

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
  const [institutions, setInstitutions] = useState([])
  const [assignmentInstitutionId, setAssignmentInstitutionId] = useState('')
  const [assignmentSaving, setAssignmentSaving] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [registrationSaving, setRegistrationSaving] = useState(false)
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    email: '',
    institutionId: '',
    initialPassword: '',
  })
  const [temporaryPassword, setTemporaryPassword] = useState('')

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
        page,
        size: 10,
      }

      if (search) params.search = search
      if (status) params.status = status
      if (institutionFilter) {
        params.institutionId = institutionFilter
      }

      try {
        const response = await api.get('/admin/issuers', { params })

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
  }, [page, search, status, institutionFilter, reloadKey, handleApiError])

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const response = await api.get('/admin/institutions', {
          params: { page: 0, size: 100, status: 'ACTIVE' },
        })
        setInstitutions(response.data.content || [])
      } catch (err) {
        handleApiError(err)
      }
    }

    void loadInstitutions()
  }, [handleApiError])

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

  const handleInstitutionFilterChange = (event) => {
    setNotice('')
    setError('')
    setLoading(true)
    setPage(0)
    setInstitutionFilter(event.target.value)
  }

  const clearFilters = () => {
    setNotice('')
    setError('')
    setSearchInput('')
    setSearch('')
    setStatus('')
    setInstitutionFilter('')
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

  const handleRegistrationChange = (event) => {
    const { name, value } = event.target
    setRegistrationForm((current) => ({ ...current, [name]: value }))
  }

  const registerIssuer = async (event) => {
    event.preventDefault()
    setRegistrationSaving(true)
    setError('')
    setNotice('')
    setTemporaryPassword('')

    try {
      const payload = {
        fullName: registrationForm.fullName,
        email: registrationForm.email,
        institutionId: Number(registrationForm.institutionId),
      }
      if (registrationForm.initialPassword) {
        payload.initialPassword = registrationForm.initialPassword
      }

      const response = await api.post('/admin/issuers', payload)
      setTemporaryPassword(
        response.data.temporaryPassword || ''
      )
      setRegistrationOpen(false)
      setRegistrationForm({
        fullName: '',
        email: '',
        institutionId: '',
        initialPassword: '',
      })
      setNotice('Issuer registered successfully.')
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setRegistrationSaving(false)
    }
  }

  const resetIssuerPassword = async () => {
    if (!selectedIssuer) return
    setTemporaryPassword('')
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/admin/issuers/${selectedIssuer.userId}/reset-password`
      )
      setTemporaryPassword(
        response.data.temporaryPassword || ''
      )
      setNotice('Issuer password reset successfully.')
    } catch (err) {
      handleApiError(err)
    }
  }

  const viewIssuer = async (issuerId) => {
    setDetailLoading(true)
    setSelectedIssuer(null)
    setError('')

    try {
      const response = await api.get(`/admin/issuers/${issuerId}`)
      setSelectedIssuer(response.data)
      setAssignmentInstitutionId(
        response.data.institutionId
          ? String(response.data.institutionId)
          : ''
      )
    } catch (err) {
      handleApiError(err)
    } finally {
      setDetailLoading(false)
    }
  }

  const assignIssuerInstitution = async () => {
    if (!selectedIssuer || !assignmentInstitutionId) {
      setError('Choose an active institution before assigning the issuer.')
      return
    }

    setAssignmentSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/admin/users/${selectedIssuer.userId}/institution`,
        { institutionId: Number(assignmentInstitutionId) }
      )
      setSelectedIssuer(response.data)
      setAssignmentInstitutionId('')
      setNotice('Issuer institution assignment updated successfully.')
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setAssignmentSaving(false)
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
        `/admin/issuers/${issuer.userId}/status`,
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
    <AdminLayout
      activeKey="issuers"
      onLogout={handleLogout}
      headerActions={(
        <>
          <Button onClick={() => setRegistrationOpen(true)}>
            Register Issuer
          </Button>
          <Button
            variant="secondary"
            onClick={refreshIssuers}
            disabled={loading}
            loading={refreshing}
            loadingLabel="Refreshing..."
          >
            Refresh Issuers
          </Button>
        </>
      )}
    >
      <div className="admin-issuers-page">
      <div className="admin-issuers-container">

        {notice && (
          <Alert variant="success" className="issuers-success-message">
            {notice}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="issuers-error-message">
            {error}
          </Alert>
        )}

        {temporaryPassword && (
          <Alert variant="warning" className="issuers-password-banner">
            <div>
              <strong>Temporary password (shown once)</strong>
              <code>{temporaryPassword}</code>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigator.clipboard?.writeText(temporaryPassword)
              }
            >
              Copy
            </Button>
          </Alert>
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
              <label htmlFor="issuerInstitutionFilter">University</label>
              <select
                id="issuerInstitutionFilter"
                value={institutionFilter}
                onChange={handleInstitutionFilterChange}
              >
                <option value="">All Universities</option>
                {institutions.map((institution) => (
                  <option
                    key={institution.institutionId}
                    value={institution.institutionId}
                  >
                    {institution.institutionName}
                  </option>
                ))}
              </select>
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

          <DataTable
            wrapperClassName="issuers-table-wrapper"
            className="admin-issuers-table"
            caption="All registered issuer accounts"
          >
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
                          <StatusBadge status={issuer.accountStatus} />
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
          </DataTable>

          <Pagination
            page={page}
            totalPages={totalPages}
            disabled={loading}
            label="Issuer records pages"
            className="issuers-pagination"
            onPageChange={(nextPage) => {
              setLoading(true)
              setPage(nextPage)
            }}
          />
        </section>

        <div className="issuers-info-note">
          <strong>Issuer institutions can be assigned from issuer details.</strong>
          <span>
            Assign issuers only to active institutions. This changes the institution
            used for credential issuance and institution-level authorization.
          </span>
        </div>

        {registrationOpen && (
          <Modal
            open
            onClose={() => setRegistrationOpen(false)}
            title="Register Issuer"
            description="Create an issuer account and associate it with an active university."
            closeOnBackdrop
            className="issuers-details-modal"
          >
              <form className="issuers-registration-form" onSubmit={registerIssuer}>
                <label>
                  Full Name
                  <input
                    name="fullName"
                    value={registrationForm.fullName}
                    onChange={handleRegistrationChange}
                    required
                    maxLength={100}
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={registrationForm.email}
                    onChange={handleRegistrationChange}
                    required
                    maxLength={150}
                  />
                </label>
                <label>
                  University
                  <select
                    name="institutionId"
                    value={registrationForm.institutionId}
                    onChange={handleRegistrationChange}
                    required
                  >
                    <option value="">Select active university</option>
                    {institutions.map((institution) => (
                      <option
                        key={institution.institutionId}
                        value={institution.institutionId}
                      >
                        {institution.institutionName} ({institution.institutionCode})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Initial Password (required)
                  <input
                    name="initialPassword"
                    type="password"
                    value={registrationForm.initialPassword}
                    onChange={handleRegistrationChange}
                    required
                    minLength={12}
                    maxLength={255}
                  />
                </label>
                <Button
                  type="submit"
                  loading={registrationSaving}
                  loadingLabel="Registering..."
                >
                  Register Issuer
                </Button>
              </form>
          </Modal>
        )}

        {(detailLoading || selectedIssuer) && (
          <Modal
            open
            onClose={() => {
              setSelectedIssuer(null)
              setDetailLoading(false)
            }}
            title="Issuer Details"
            description="Review issuer account, university association, and account actions."
            closeOnBackdrop
            className="issuers-details-modal"
          >

              {detailLoading ? (
                <p className="issuers-modal-loading">Loading issuer details...</p>
              ) : (
                selectedIssuer && (
                  <>
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

                  <div className="issuers-assignment-form">
                    <label htmlFor="issuerInstitutionAssignment">
                      Assign to Institution
                    </label>
                    <select
                      id="issuerInstitutionAssignment"
                      value={assignmentInstitutionId}
                      onChange={(event) =>
                        setAssignmentInstitutionId(event.target.value)
                      }
                    >
                      <option value="">Select an active institution</option>
                      {institutions.map((institution) => (
                        <option
                          key={institution.institutionId}
                          value={institution.institutionId}
                        >
                          {institution.institutionName} ({institution.institutionCode})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="issuers-primary-button"
                      onClick={assignIssuerInstitution}
                      disabled={assignmentSaving}
                    >
                      {assignmentSaving ? 'Saving...' : 'Save Assignment'}
                    </button>
                    <button
                      type="button"
                      className="issuers-secondary-button"
                      onClick={resetIssuerPassword}
                    >
                      Reset Password
                    </button>
                  </div>
                  </>
                )
              )}
          </Modal>
        )}

      </div>
      </div>
    </AdminLayout>
  )
}

export default IssuerManagement
