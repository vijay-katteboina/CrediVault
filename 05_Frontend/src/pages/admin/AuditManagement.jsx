import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'

import 'react-datepicker/dist/react-datepicker.css'
import api from '../../services/api'
import './AuditManagement.css'

const PAGE_SIZE = 20

const ACTIONS = [
  'ACTIVATE_USER',
  'DEACTIVATE_USER',
  'ACTIVATE_INSTITUTION',
  'DEACTIVATE_INSTITUTION',
  'CREATE_STUDENT',
  'UPDATE_STUDENT',
  'ACTIVATE_STUDENT',
  'DEACTIVATE_STUDENT',
  'ISSUE_CREDENTIAL',
  'REVOKE_CREDENTIAL',
]

const ENTITY_TYPES = [
  'USER',
  'INSTITUTION',
  'STUDENT',
  'CREDENTIAL',
]

// Convert YYYY-MM-DD into a local Date object.
function parseDateInput(value) {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  return new Date(year, month - 1, day)
}

// Convert a local Date object into YYYY-MM-DD.
function formatDateInput(date) {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function AuditManagement() {
  const navigate = useNavigate()

  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [error, setError] = useState('')

  const [searchInput, setSearchInput] = useState('')
  const [actionInput, setActionInput] = useState('')
  const [entityInput, setEntityInput] = useState('')
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')

  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    fromDate: '',
    toDate: '',
  })

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const [selectedLog, setSelectedLog] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)

  // Load audit records.
  useEffect(() => {
    let active = true

    const loadAuditLogs = async () => {
      setLoading(true)
      setError('')

      try {
        const params = {
          page,
          size: PAGE_SIZE,
        }

        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params[key] = value
          }
        })

        const response = await api.get(
          '/admin/audit-logs',
          { params }
        )

        if (!active) return

        const data = response.data

        setAuditLogs(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(Math.max(data.totalPages || 1, 1))
      } catch (err) {
        if (!active) return

        if (err.response?.status === 401) {
          localStorage.removeItem('credivaultToken')
          localStorage.removeItem('credivaultRole')

          navigate('/login', { replace: true })
          return
        }

        setError(
          err.response?.data?.message ||
          'Unable to load audit records.'
        )
      } finally {
        if (active) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }

    void loadAuditLogs()

    return () => {
      active = false
    }
  }, [filters, page, refreshKey, navigate])

  // Apply search and filters.
  const handleSearch = (event) => {
    event.preventDefault()

    if (
      fromDateInput &&
      toDateInput &&
      fromDateInput > toDateInput
    ) {
      setError('From date cannot be after the to date.')
      return
    }

    setError('')
    setPage(0)

    setFilters({
      search: searchInput.trim(),
      action: actionInput,
      entityType: entityInput,
      fromDate: fromDateInput,
      toDate: toDateInput,
    })
  }

  // Clear filters.
  const clearFilters = () => {
    setSearchInput('')
    setActionInput('')
    setEntityInput('')
    setFromDateInput('')
    setToDateInput('')

    setFilters({
      search: '',
      action: '',
      entityType: '',
      fromDate: '',
      toDate: '',
    })

    setPage(0)
    setError('')
  }

  // Refresh audit records.
  const refreshAuditLogs = () => {
    setRefreshing(true)
    setRefreshKey((current) => current + 1)
  }

  // View audit details.
  const viewAuditDetails = async (auditId) => {
    setDetailsLoading(true)
    setSelectedLog(null)
    setError('')

    try {
      const response = await api.get(
        `/admin/audit-logs/${auditId}`
      )

      setSelectedLog(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('credivaultToken')
        localStorage.removeItem('credivaultRole')

        navigate('/login', { replace: true })
        return
      }

      setError(
        err.response?.data?.message ||
        'Unable to load audit details.'
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  // Logout.
  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  // Format timestamps.
  const formatDate = (value) => {
    if (!value) return 'Not available'

    const date = new Date(value)

    return Number.isNaN(date.getTime())
      ? 'Not available'
      : date.toLocaleString('en-IN')
  }

  return (
    <main className="audit-page">
      <div className="audit-container">

        {/* Top navigation */}
        <header className="audit-topbar">
          <div>
            <p className="audit-brand">CrediVault</p>

            <span className="audit-role-badge">
              ADMINISTRATOR
            </span>
          </div>

          <div className="audit-topbar-actions">
            <button
              type="button"
              className="audit-dashboard-btn"
              onClick={() => navigate('/admin')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="audit-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page heading */}
        <section className="audit-header">
          <div>
            <p className="audit-kicker">
              SYSTEM ADMINISTRATION
            </p>

            <h1>Audit Management</h1>

            <p>
              Monitor administrative operations and maintain
              a transparent record of CrediVault activities.
            </p>
          </div>

          <button
            type="button"
            className="audit-refresh-btn"
            onClick={refreshAuditLogs}
            disabled={loading || refreshing}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh Audit Logs'}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="audit-error" role="alert">
            {error}
          </div>
        )}

        {/* Summary */}
        <section className="audit-summary">

          <article className="audit-summary-card">
            <span>Total Matching Events</span>
            <strong>{loading ? '...' : totalElements}</strong>
            <small>Records matching current filters</small>
          </article>

          <article className="audit-summary-card">
            <span>Displayed Records</span>
            <strong>{loading ? '...' : auditLogs.length}</strong>
            <small>Records on the current page</small>
          </article>

          <article className="audit-summary-card">
            <span>Current Page</span>
            <strong>{page + 1}</strong>
            <small>Paginated audit history</small>
          </article>

        </section>

        {/* Audit directory */}
        <section className="audit-directory">

          <div className="audit-section-heading">
            <div>
              <p className="audit-kicker">
                CREDIVAULT DATABASE
              </p>

              <h2>Audit Records</h2>

              <p>
                Review recorded user activities, administrative
                operations and credential events.
              </p>
            </div>

            <span className="audit-record-count">
              {totalElements} events found
            </span>
          </div>

          {/* Search and filters */}
          <form
            className="audit-filter-form"
            onSubmit={handleSearch}
          >

            <div className="audit-filter-search">
              <label htmlFor="auditSearch">
                Search Audit Records
              </label>

              <input
                id="auditSearch"
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search user, email, action or entity ID..."
                maxLength={100}
              />
            </div>

            <div className="audit-filter-group">
              <label htmlFor="auditAction">
                Action
              </label>

              <select
                id="auditAction"
                value={actionInput}
                onChange={(event) =>
                  setActionInput(event.target.value)
                }
              >
                <option value="">All Actions</option>

                {ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="audit-filter-group">
              <label htmlFor="auditEntity">
                Entity Type
              </label>

              <select
                id="auditEntity"
                value={entityInput}
                onChange={(event) =>
                  setEntityInput(event.target.value)
                }
              >
                <option value="">All Entities</option>

                {ENTITY_TYPES.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom From Date calendar */}
            <div className="audit-filter-group audit-date-group">
              <label htmlFor="auditFromDate">
                From Date
              </label>

              <DatePicker
                id="auditFromDate"
                selected={parseDateInput(fromDateInput)}
                onChange={(date) =>
                  setFromDateInput(formatDateInput(date))
                }
                dateFormat="dd-MM-yyyy"
                placeholderText="dd-mm-yyyy"
                className="audit-date-picker-input"
                wrapperClassName="audit-datepicker-wrapper"
                calendarClassName="audit-large-calendar"
                popperClassName="audit-large-calendar-popper"
                popperPlacement="bottom-start"
                showPopperArrow={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
                autoComplete="off"
              />
            </div>

            {/* Custom To Date calendar */}
            <div className="audit-filter-group audit-date-group">
              <label htmlFor="auditToDate">
                To Date
              </label>

              <DatePicker
                id="auditToDate"
                selected={parseDateInput(toDateInput)}
                onChange={(date) =>
                  setToDateInput(formatDateInput(date))
                }
                dateFormat="dd-MM-yyyy"
                placeholderText="dd-mm-yyyy"
                className="audit-date-picker-input"
                wrapperClassName="audit-datepicker-wrapper"
                calendarClassName="audit-large-calendar"
                popperClassName="audit-large-calendar-popper"
                popperPlacement="bottom-start"
                showPopperArrow={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
                autoComplete="off"
              />
            </div>

            {/* Filter actions */}
            <div className="audit-filter-actions">
              <button
                type="submit"
                className="audit-search-btn"
              >
                Apply Filters
              </button>

              <button
                type="button"
                className="audit-clear-btn"
                onClick={clearFilters}
              >
                Clear
              </button>
            </div>

          </form>

          {/* Audit table */}
          <div className="audit-table-wrapper">
            <table className="audit-table">

              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Date & Time</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="audit-empty-state">
                      Loading audit records...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="audit-empty-state">
                      No audit records match your filters.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.auditId}>
                      <td>
                        <strong>#{log.auditId}</strong>
                      </td>

                      <td className="audit-date-cell">
                        {formatDate(log.createdAt)}
                      </td>

                      <td>
                        <div className="audit-user-cell">
                          <strong>
                            {log.userFullName || 'Unknown user'}
                          </strong>

                          <span>
                            {log.userEmail || 'Not available'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="audit-role-tag">
                          {log.userRole}
                        </span>
                      </td>

                      <td>
                        <span className="audit-action-tag">
                          {log.action?.replaceAll('_', ' ')}
                        </span>
                      </td>

                      <td>{log.entityType}</td>

                      <td>{log.entityId || '—'}</td>

                      <td>
                        <button
                          type="button"
                          className="audit-view-btn"
                          onClick={() =>
                            viewAuditDetails(log.auditId)
                          }
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

          {/* Pagination */}
          <div className="audit-pagination">

            <span>
              Showing {auditLogs.length} of {totalElements} events
            </span>

            <div>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.max(0, current - 1))
                }
                disabled={page === 0 || loading}
              >
                Previous
              </button>

              <span>
                Page {page + 1} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages - 1, current + 1)
                  )
                }
                disabled={page + 1 >= totalPages || loading}
              >
                Next
              </button>
            </div>

          </div>

        </section>

        {/* Audit details modal */}
        {(detailsLoading || selectedLog) && (
          <div
            className="audit-modal-overlay"
            onClick={() => {
              if (!detailsLoading) setSelectedLog(null)
            }}
          >
            <div
              className="audit-modal"
              onClick={(event) => event.stopPropagation()}
            >
              {detailsLoading ? (
                <p className="audit-modal-loading">
                  Loading audit details...
                </p>
              ) : (
                <>
                  <div className="audit-modal-header">
                    <div>
                      <p className="audit-kicker">
                        SYSTEM ACTIVITY RECORD
                      </p>

                      <h2>Audit Event Details</h2>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedLog(null)}
                      aria-label="Close audit details"
                    >
                      ×
                    </button>
                  </div>

                  <div className="audit-detail-grid">

                    <div>
                      <span>Audit ID</span>
                      <strong>#{selectedLog.auditId}</strong>
                    </div>

                    <div>
                      <span>Date and Time</span>
                      <strong>
                        {formatDate(selectedLog.createdAt)}
                      </strong>
                    </div>

                    <div>
                      <span>Performed By</span>
                      <strong>{selectedLog.userFullName}</strong>
                    </div>

                    <div>
                      <span>Email</span>
                      <strong>{selectedLog.userEmail}</strong>
                    </div>

                    <div>
                      <span>User ID</span>
                      <strong>{selectedLog.userId}</strong>
                    </div>

                    <div>
                      <span>User Role</span>
                      <strong>{selectedLog.userRole}</strong>
                    </div>

                    <div>
                      <span>Action</span>
                      <strong>
                        {selectedLog.action?.replaceAll('_', ' ')}
                      </strong>
                    </div>

                    <div>
                      <span>Entity Type</span>
                      <strong>{selectedLog.entityType}</strong>
                    </div>

                    <div>
                      <span>Entity ID</span>
                      <strong>
                        {selectedLog.entityId || 'Not available'}
                      </strong>
                    </div>

                    <div className="audit-detail-full">
                      <span>Event Description</span>
                      <strong>
                        {selectedLog.details ||
                          'No additional details recorded.'}
                      </strong>
                    </div>

                  </div>

                  <div className="audit-readonly-note">
                    This is a permanent audit history record.
                    Audit records cannot be modified or deleted.
                  </div>

                  <div className="audit-modal-footer">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(null)}
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <footer className="audit-footer">
          CrediVault · Digital Academic Credential Issuance and Verification System
        </footer>

      </div>
    </main>
  )
}

export default AuditManagement