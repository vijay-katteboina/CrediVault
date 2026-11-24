// Text-first status badge; color reinforces rather than replaces its label.
function StatusBadge({ status, className = '' }) {
  const label = String(status || 'Unknown')
  const statusClass = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <span className={`cv-badge cv-badge--${statusClass} ${className}`.trim()}>
      {label}
    </span>
  )
}

export default StatusBadge
