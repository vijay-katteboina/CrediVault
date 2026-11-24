import { useId } from 'react'

// Announces an in-progress operation to assistive technology.
export function Spinner({ label = 'Loading', className = '' }) {
  return (
    <div className={`cv-loading ${className}`.trim()} role="status" aria-live="polite">
      <span className="cv-spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

// Non-interactive placeholder for content that is still loading.
export function Skeleton({ variant = 'text', count = 1, className = '' }) {
  return (
    <div
      className={`cv-skeleton-group ${className}`.trim()}
      aria-hidden="true"
    >
      {Array.from({ length: Math.max(1, count) }, (_, index) => (
        <span
          key={index}
          className={`cv-skeleton cv-skeleton--${variant}`}
        />
      ))}
    </div>
  )
}

// Consistent empty-state message with an optional page-provided action.
export function EmptyState({ title, description, action, className = '' }) {
  const titleId = useId()

  return (
    <section
      className={`cv-state cv-empty-state ${className}`.trim()}
      role="status"
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="cv-state__action">{action}</div>}
    </section>
  )
}

// Consistent error state with an optional recovery action.
export function ErrorState({ title, description, action, className = '' }) {
  const titleId = useId()

  return (
    <section
      className={`cv-state cv-error-state ${className}`.trim()}
      role="alert"
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="cv-state__action">{action}</div>}
    </section>
  )
}
