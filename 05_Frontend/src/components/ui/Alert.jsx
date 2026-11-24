import Button from './Button'

// Announces feedback with a semantic live region.
export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  dismissible = false,
  onDismiss,
}) {
  const role = variant === 'danger' ? 'alert' : 'status'

  return (
    <div
      className={`cv-alert cv-alert--${variant} ${className}`.trim()}
      role={role}
      aria-live={variant === 'danger' ? 'assertive' : 'polite'}
    >
      <div className="cv-alert__content">
        {title && <strong className="cv-alert__title">{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          Dismiss
        </Button>
      )}
    </div>
  )
}

// Dismissible feedback surface for transient notifications.
export function Toast(props) {
  return <Alert {...props} dismissible className={`cv-toast ${props.className || ''}`} />
}
