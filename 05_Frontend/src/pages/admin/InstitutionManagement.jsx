import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import AdminLayout from '../../components/layout/AdminLayout'
import { Alert, Button, DataTable, Modal, Pagination, StatusBadge } from '../../components/ui'
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

  const [brandingForm, setBrandingForm] = useState({
    institutionAddress: '',
    signatoryName: '',
    signatoryDesignation: '',
    loginEmail: '',
    loginPassword: '',
  })
  const [brandingSaving, setBrandingSaving] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)

  const [registrationOpen, setRegistrationOpen] = useState(false)
  const [registrationSaving, setRegistrationSaving] = useState(false)
  const [registrationForm, setRegistrationForm] = useState({
    institutionName: '',
    institutionCode: '',
    institutionAddress: '',
    signatoryName: '',
    signatoryDesignation: '',
    loginEmail: '',
    loginPassword: '',
  })

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

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

    if (statusCode === 503) {
      setError(
        'University registration is unavailable. Configure CREDIVAULT_KEY_MASTER_KEY and restart the backend.'
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

      const institution = response.data
      setSelectedInstitution(institution)
      setBrandingForm({
        institutionAddress: institution.institutionAddress || '',
        signatoryName: institution.signatoryName || '',
        signatoryDesignation: institution.signatoryDesignation || '',
      })
      setLogoFile(null)
      setLogoPreview('')
    } catch (err) {
      handleApiError(err)
    } finally {
      setDetailLoading(false)
    }
  }


  const handleBrandingChange = (event) => {
    const { name, value } = event.target
    setBrandingForm((current) => ({ ...current, [name]: value }))
  }

  const saveInstitutionBranding = async (event) => {
    event.preventDefault()
    if (!selectedInstitution) return

    setBrandingSaving(true)
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/admin/institutions/${selectedInstitution.institutionId}/branding`,
        brandingForm
      )

      setSelectedInstitution(response.data)
      setBrandingForm({
        institutionAddress: response.data.institutionAddress || '',
        signatoryName: response.data.signatoryName || '',
        signatoryDesignation: response.data.signatoryDesignation || '',
      })
      setNotice('Institution certificate branding details saved successfully.')
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setBrandingSaving(false)
    }
  }

  const handleLogoSelection = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setError('Please select a PNG or JPEG image.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('The institution logo must be 2 MB or smaller.')
      event.target.value = ''
      return
    }

    setError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const uploadInstitutionLogo = async () => {
    if (!selectedInstitution || !logoFile) {
      setError('Choose a PNG or JPEG logo before uploading.')
      return
    }

    const formData = new FormData()
    formData.append('file', logoFile)

    setLogoUploading(true)
    setError('')
    setNotice('')

    try {
      const response = await api.post(
        `/admin/institutions/${selectedInstitution.institutionId}/logo`,
        formData,
        { headers: { 'Content-Type': undefined } }
      )

      setSelectedInstitution(response.data)
      setLogoFile(null)
      setLogoPreview('')
      setNotice('Institution logo uploaded successfully.')
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLogoUploading(false)
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

  const handleRegistrationChange = (event) => {
    const { name, value } = event.target
    setRegistrationForm((current) => ({ ...current, [name]: value }))
  }

  const registerInstitution = async (event) => {
    event.preventDefault()
    setRegistrationSaving(true)
    setError('')
    setNotice('')

    try {
      await api.post('/admin/institutions', registrationForm)
      setRegistrationOpen(false)
      setRegistrationForm({
        institutionName: '',
        institutionCode: '',
        institutionAddress: '',
        signatoryName: '',
        signatoryDesignation: '',
        loginEmail: '',
        loginPassword: '',
      })
      setNotice('Institution registered successfully.')
      setLoading(true)
      setReloadKey((current) => current + 1)
    } catch (err) {
      handleApiError(err)
    } finally {
      setRegistrationSaving(false)
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
      activeKey="institutions"
      onLogout={handleLogout}
      headerActions={(
        <>
          <Button onClick={() => setRegistrationOpen(true)}>
            Register University
          </Button>
          <Button
            variant="secondary"
            onClick={refreshInstitutions}
            disabled={loading}
            loading={refreshing}
            loadingLabel="Refreshing..."
          >
            Refresh Institutions
          </Button>
        </>
      )}
    >
      <div className="admin-institutions-page">
      <div className="admin-institutions-container">

        {/* Messages */}
        {notice && (
          <Alert variant="success" className="institutions-success-message">
            {notice}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="institutions-error-message">
            {error}
          </Alert>
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

          <DataTable
            wrapperClassName="institutions-table-wrapper"
            className="admin-institutions-table"
            caption="All registered institutions"
          >

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
                          <StatusBadge status={institution.status} />
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

          </DataTable>

          {/* Pagination */}
          <Pagination
            page={page}
            totalPages={totalPages}
            disabled={loading}
            label="Institution records pages"
            className="institutions-pagination"
            onPageChange={(nextPage) => {
              setLoading(true)
              setPage(nextPage)
            }}
          />

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

        {registrationOpen && (
          <Modal
            open
            onClose={() => setRegistrationOpen(false)}
            title="Register University"
            description="Add a university to CrediVault."
            closeOnBackdrop
            className="institutions-details-modal"
          >
              <form className="institutions-registration-form" onSubmit={registerInstitution}>
                <label>
                  University Name
                  <input name="institutionName" value={registrationForm.institutionName}
                    onChange={handleRegistrationChange} required maxLength={200} />
                </label>
                <label>
                  Institution Code
                  <input name="institutionCode" value={registrationForm.institutionCode}
                    onChange={handleRegistrationChange} required maxLength={30}
                    pattern="[A-Za-z0-9-]{3,30}" />
                </label>
                <label>
                  Institution Address
                  <input name="institutionAddress" value={registrationForm.institutionAddress}
                    onChange={handleRegistrationChange} required maxLength={500} />
                </label>
                <label>
                  Signatory Name
                  <input name="signatoryName" value={registrationForm.signatoryName}
                    onChange={handleRegistrationChange} required maxLength={150} />
                </label>
                <label>
                  Signatory Designation
                  <input name="signatoryDesignation" value={registrationForm.signatoryDesignation}
                    onChange={handleRegistrationChange} required maxLength={150} />
                </label>
                <label>
                  Login Email
                  <input
                    name="loginEmail"
                    type="email"
                    value={registrationForm.loginEmail}
                    onChange={handleRegistrationChange}
                    required
                    maxLength={150}
                  />
                </label>
                <label>
                  Login Password
                  <input
                    name="loginPassword"
                    type="password"
                    value={registrationForm.loginPassword}
                    onChange={handleRegistrationChange}
                    required
                    minLength={12}
                    maxLength={255}
                  />
                </label>

                  <Button type="submit" loading={registrationSaving} loadingLabel="Registering...">
                    Register University
                  </Button>
              </form>
          </Modal>
        )}

        {/* Institution Details Modal */}
        {(detailLoading || selectedInstitution) && (
          <Modal
              open
              onClose={() => {
                setSelectedInstitution(null)
                setDetailLoading(false)
              }}
              title="Institution Details"
              description="Review institution information, branding, and status."
              closeOnBackdrop
              className="institutions-details-modal"
          >
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

              {selectedInstitution && !detailLoading && (
                <section className="institution-branding-editor">
                  <div className="institution-branding-heading">
                    <div>
                      <p className="institutions-kicker">CERTIFICATE CONFIGURATION</p>
                      <h3>Institution Branding</h3>
                      <p>These details will appear on certificates generated for this institution.</p>
                    </div>
                  </div>

                  <form className="institution-branding-form" onSubmit={saveInstitutionBranding}>
                    <div className="institution-branding-field institution-branding-field-full">
                      <label htmlFor="institutionAddress">Institution Address</label>
                      <textarea
                        id="institutionAddress"
                        name="institutionAddress"
                        value={brandingForm.institutionAddress}
                        onChange={handleBrandingChange}
                        maxLength={500}
                        rows={3}
                        required
                        placeholder="Enter the official institution address"
                      />
                    </div>

                    <div className="institution-branding-field">
                      <label htmlFor="signatoryName">Authorized Signatory Name</label>
                      <input
                        id="signatoryName"
                        name="signatoryName"
                        type="text"
                        value={brandingForm.signatoryName}
                        onChange={handleBrandingChange}
                        maxLength={150}
                        required
                        placeholder="e.g. Dr. Principal Name"
                      />
                    </div>

                    <div className="institution-branding-field">
                      <label htmlFor="signatoryDesignation">Signatory Designation</label>
                      <input
                        id="signatoryDesignation"
                        name="signatoryDesignation"
                        type="text"
                        value={brandingForm.signatoryDesignation}
                        onChange={handleBrandingChange}
                        maxLength={150}
                        required
                        placeholder="e.g. Principal / Registrar"
                      />
                    </div>

                    <div className="institution-branding-actions institution-branding-field-full">
                      <button type="submit" className="institution-branding-save" disabled={brandingSaving}>
                        {brandingSaving ? 'Saving...' : 'Save Branding Details'}
                      </button>
                    </div>
                  </form>

                  <div className="institution-logo-section">
                    <div className="institution-logo-copy">
                      <strong>Official Institution Logo</strong>
                      <span>PNG or JPEG · Maximum file size: 2 MB</span>
                      {selectedInstitution.logoPath && (
                        <small>Logo is currently configured for this institution.</small>
                      )}
                    </div>

                    <div className="institution-logo-controls">
                      <label className="institution-logo-file-label" htmlFor="institutionLogoFile">
                        Choose Logo
                      </label>
                      <input
                        id="institutionLogoFile"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={handleLogoSelection}
                      />
                      <button
                        type="button"
                        className="institution-branding-upload"
                        onClick={uploadInstitutionLogo}
                        disabled={!logoFile || logoUploading}
                      >
                        {logoUploading ? 'Uploading...' : 'Upload Logo'}
                      </button>
                    </div>

                    {logoPreview && (
                      <div className="institution-logo-preview">
                        <span>Selected logo preview</span>
                        <img src={logoPreview} alt="Selected institution logo preview" />
                      </div>
                    )}
                  </div>
                </section>
              )}

          </Modal>
        )}

      </div>
      </div>
    </AdminLayout>
  )
}

export default InstitutionManagement