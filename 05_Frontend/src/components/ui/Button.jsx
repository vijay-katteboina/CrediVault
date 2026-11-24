// Shared action button with consistent variants and loading semantics.
function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'cv-button',
    `cv-button--${variant}`,
    `cv-button--${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && (
        <span className="cv-spinner cv-button__spinner" aria-hidden="true" />
      )}
      <span>{loading ? loadingLabel || children : children}</span>
    </button>
  )
}

export default Button
