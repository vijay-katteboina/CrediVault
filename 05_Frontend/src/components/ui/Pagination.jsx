import Button from './Button'

// Zero-based pagination controls for paged results.
function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  label = 'Pagination',
  summary,
  className = '',
}) {
  if (!Number.isInteger(totalPages) || totalPages < 2) return null

  const currentPage = Math.min(Math.max(page, 0), totalPages - 1)

  return (
    <nav className={`cv-pagination ${className}`.trim()} aria-label={label}>
      <span className="cv-pagination__summary">
        {summary || `Page ${currentPage + 1} of ${totalPages}`}
      </span>
      <div className="cv-pagination__actions">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || currentPage === 0}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || currentPage >= totalPages - 1}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}

export default Pagination
