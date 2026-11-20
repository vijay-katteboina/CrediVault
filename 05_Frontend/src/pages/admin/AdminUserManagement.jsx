import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import api from '../../services/api'
import './AdminUserManagement.css'

function AdminUserManagement() {
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [currentAdminId, setCurrentAdminId] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')

  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const [loading, setLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [selectedUser, setSelectedUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  const handleApiError = useCallback((err) => {
    const statusCode = err.response?.status

    if (statusCode === 401) {
      localStorage.removeItem('credivaultToken')
      localStorage.removeItem('credivaultRole')

      navigate('/login', { replace: true })
      return
    }

    if (statusCode === 403) {
      setError('Administrator permission is required.')
      return
    }

    setError(
      err.response?.data?.detail ||
      err.response?.data?.message ||
      'The requested operation could not be completed.'
    )
  }, [navigate])

  // ==========================================
  // LOAD CURRENT ADMINISTRATOR
  // ==========================================

  useEffect(() => {
    let active = true

    api.get('/auth/me')
      .then((response) => {
        if (active) {
          setCurrentAdminId(response.data.userId)
        }
      })
      .catch((err) => {
        if (active) {
          handleApiError(err)
        }
      })

    return () => {
      active = false
    }
  }, [handleApiError])

  // ==========================================
  // LOAD USERS
  // ==========================================

  useEffect(() => {
    let active = true

    const params = {
      page,
      size: 10,
    }

    if (search) params.search = search
    if (role) params.role = role
    if (status) params.status = status

    api.get('/admin/users', { params })
      .then((response) => {
        if (!active) return

        const data = response.data

        setUsers(data.content || [])
        setTotalUsers(data.totalElements || 0)
        setTotalPages(Math.max(data.totalPages || 1, 1))
      })
      .catch((err) => {
        if (active) {
          handleApiError(err)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [page, search, role, status, reloadKey, handleApiError])

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const handleSearch = (event) => {
    event.preventDefault()

    setLoading(true)
    setPage(0)
    setSearch(searchInput.trim())
    setError('')
  }

  const handleRoleChange = (event) => {
    setLoading(true)
    setPage(0)
    setRole(event.target.value)
    setError('')
  }

  const handleStatusChange = (event) => {
    setLoading(true)
    setPage(0)
    setStatus(event.target.value)
    setError('')
  }

  const clearFilters = () => {
    setLoading(true)

    setSearchInput('')
    setSearch('')
    setRole('')
    setStatus('')
    setPage(0)
    setError('')
  }

  // ==========================================
  // REFRESH
  // ==========================================

  const refreshUsers = () => {
    setLoading(true)
    setError('')
    setNotice('')
    setReloadKey((current) => current + 1)
  }

  // ==========================================
  // VIEW USER DETAILS
  // ==========================================

  const viewUser = async (userId) => {
    setDetailLoading(true)
    setSelectedUser(null)
    setError('')

    try {
      const response = await api.get(`/admin/users/${userId}`)

      setSelectedUser(response.data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setDetailLoading(false)
    }
  }

  // ==========================================
  // ACTIVATE / DEACTIVATE USER
  // ==========================================

  const changeUserStatus = async (user) => {
    const isActive = user.accountStatus === 'ACTIVE'

    const nextStatus = isActive ? 'INACTIVE' : 'ACTIVE'

    const action = isActive ? 'deactivate' : 'activate'

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.fullName}'s account?`
      )
    ) {
      return
    }

    setBusyUserId(user.userId)
    setError('')
    setNotice('')

    try {
      const response = await api.put(
        `/admin/users/${user.userId}/status`,
        {
          accountStatus: nextStatus,
        }
      )

      const updatedUser = response.data

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.userId === updatedUser.userId
            ? updatedUser
            : item
        )
      )

      setNotice(
        `${updatedUser.fullName}'s account is now ${updatedUser.accountStatus}.`
      )

      if (selectedUser?.userId === updatedUser.userId) {
        setSelectedUser(updatedUser)
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setBusyUserId(null)
    }
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('credivaultToken')
    localStorage.removeItem('credivaultRole')

    navigate('/login', { replace: true })
  }

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (value) => {
    if (!value) return 'Not available'

    return new Date(value).toLocaleString('en-IN')
  }

  return (
    <main className="admin-users-page">

      <div className="admin-users-container">

        {/* HEADER */}

        <header className="admin-users-header">

          <div>
            <p className="admin-users-brand">
              CrediVault
            </p>

            <span className="admin-users-role">
              ADMINISTRATOR
            </span>
          </div>

          <div className="admin-users-header-actions">

            <button
              type="button"
              className="users-back-button"
              onClick={() => navigate('/admin')}
            >
              Dashboard
            </button>

            <button
              type="button"
              className="users-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </header>

        {/* PAGE TITLE */}

        <section className="admin-users-heading">

          <div>
            <p className="users-kicker">
              SYSTEM ADMINISTRATION
            </p>

            <h1>User Management</h1>

            <p>
              Review, search and manage all registered CrediVault
              user accounts.
            </p>
          </div>

          <button
            type="button"
            className="users-refresh-button"
            onClick={refreshUsers}
            disabled={loading}
          >
            ↻ Refresh Users
          </button>

        </section>

        {/* STATISTICS */}

        <section className="users-summary-grid">

          <article className="users-summary-card">
            <span>Total Users</span>
            <strong>{totalUsers}</strong>
          </article>

          <article className="users-summary-card">
            <span>Displayed Users</span>
            <strong>{users.length}</strong>
          </article>

          <article className="users-summary-card">
            <span>Current Page</span>
            <strong>{page + 1}</strong>
          </article>

        </section>

        {/* NOTIFICATIONS */}

        {notice && (
          <div className="users-success-message" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="users-error-message" role="alert">
            {error}
          </div>
        )}

        {/* FILTERS */}

        <section className="users-filter-card">

          <div className="users-section-title">
            <div>
              <p className="users-kicker">
                ACCOUNT DIRECTORY
              </p>

              <h2>Registered Users</h2>

              <p>
                Search and filter accounts using available fields.
              </p>
            </div>
          </div>

          <form
            className="users-filter-form"
            onSubmit={handleSearch}
          >

            <div className="users-filter-group users-search-group">

              <label htmlFor="userSearch">
                Search Users
              </label>

              <input
                id="userSearch"
                type="text"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
                placeholder="Search by full name or email..."
                maxLength={100}
              />

            </div>

            <div className="users-filter-group">

              <label htmlFor="roleFilter">
                Filter by Role
              </label>

              <select
                id="roleFilter"
                value={role}
                onChange={handleRoleChange}
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="STUDENT">Student</option>
                <option value="ISSUER">Issuer</option>
                <option value="VERIFIER">Verifier</option>
              </select>

            </div>

            <div className="users-filter-group">

              <label htmlFor="statusFilter">
                Account Status
              </label>

              <select
                id="statusFilter"
                value={status}
                onChange={handleStatusChange}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

            </div>

            <div className="users-filter-actions">

              <button
                type="submit"
                className="users-search-button"
              >
                Search
              </button>

              <button
                type="button"
                className="users-clear-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>

            </div>

          </form>

        </section>

        {/* USER TABLE */}

        <section className="users-table-card">

          <div className="users-table-heading">

            <div>
              <p className="users-kicker">
                CREDIVAULT DATABASE
              </p>

              <h2>User Records</h2>
            </div>

            <span className="users-record-count">
              {totalUsers} users found
            </span>

          </div>

          <div className="users-table-wrapper">

            <table className="admin-users-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>User ID</th>
                  <th>Role</th>
                  <th>Institution</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td colSpan="6" className="users-empty-state">
                      Loading user records...
                    </td>
                  </tr>

                ) : users.length === 0 ? (

                  <tr>
                    <td colSpan="6" className="users-empty-state">
                      No users match your search criteria.
                    </td>
                  </tr>

                ) : (

                  users.map((user) => {

                    const isActive =
                      user.accountStatus === 'ACTIVE'

                    const isCurrentAdmin =
                      user.userId === currentAdminId

                    const isBusy =
                      busyUserId === user.userId

                    return (
                      <tr key={user.userId}>

                        <td>
                          <div className="users-name-cell">

                            <strong>{user.fullName}</strong>

                            <span>{user.email}</span>

                          </div>
                        </td>

                        <td>#{user.userId}</td>

                        <td>
                          <span className={`users-role-badge ${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>

                        <td>
                          {user.institutionName || 'Not assigned'}
                        </td>

                        <td>
                          <span className={`users-status-badge ${isActive ? 'active' : 'inactive'}`}>
                            {user.accountStatus}
                          </span>
                        </td>

                        <td>

                          <div className="users-action-buttons">

                            <button
                              type="button"
                              className="users-view-button"
                              onClick={() => viewUser(user.userId)}
                            >
                              View
                            </button>

                            <button
                              type="button"
                              className={`users-status-button ${isActive ? 'deactivate' : 'activate'}`}
                              onClick={() => changeUserStatus(user)}
                              disabled={
                                isBusy ||
                                (isCurrentAdmin && isActive)
                              }
                              title={
                                isCurrentAdmin && isActive
                                  ? 'You cannot deactivate your own account.'
                                  : ''
                              }
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

          {/* PAGINATION */}

          <div className="users-pagination">

            <span>
              Page {page + 1} of {totalPages}
            </span>

            <div>

              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  setPage((current) => current - 1)
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

        {/* USER DETAILS MODAL */}

        {(detailLoading || selectedUser) && (

          <div className="users-modal-overlay">

            <section
              className="users-details-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="userDetailsTitle"
            >

              <header>

                <div>
                  <p className="users-kicker">
                    ACCOUNT INFORMATION
                  </p>

                  <h2 id="userDetailsTitle">
                    User Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null)
                    setDetailLoading(false)
                  }}
                >
                  Close
                </button>

              </header>

              {detailLoading ? (

                <p>Loading user details...</p>

              ) : (

                selectedUser && (

                  <div className="users-details-grid">

                    <div>
                      <span>User ID</span>
                      <strong>{selectedUser.userId}</strong>
                    </div>

                    <div>
                      <span>Full Name</span>
                      <strong>{selectedUser.fullName}</strong>
                    </div>

                    <div>
                      <span>Email Address</span>
                      <strong>{selectedUser.email}</strong>
                    </div>

                    <div>
                      <span>User Role</span>
                      <strong>{selectedUser.role}</strong>
                    </div>

                    <div>
                      <span>Account Status</span>
                      <strong>{selectedUser.accountStatus}</strong>
                    </div>

                    <div>
                      <span>Institution</span>
                      <strong>
                        {selectedUser.institutionName || 'Not assigned'}
                      </strong>
                    </div>

                    <div>
                      <span>Institution Code</span>
                      <strong>
                        {selectedUser.institutionCode || 'Not available'}
                      </strong>
                    </div>

                    <div>
                      <span>Created At</span>
                      <strong>
                        {formatDate(selectedUser.createdAt)}
                      </strong>
                    </div>

                  </div>
                )
              )}

            </section>

          </div>
        )}

        <footer className="admin-users-footer">
          CrediVault · Administrator User Management
        </footer>

      </div>

    </main>
  )
}

export default AdminUserManagement