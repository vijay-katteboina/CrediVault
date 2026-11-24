import { useEffect, useId, useRef } from 'react'
import Button from './Button'

// Native modal dialog provides Escape handling, focus containment, and focus restoration.
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
  closeOnBackdrop = false,
  className = '',
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleCancel = (event) => {
    event.preventDefault()
    if (dismissible) onClose()
  }

  const handleBackdropClick = (event) => {
    if (
      closeOnBackdrop &&
      dismissible &&
      event.target === dialogRef.current
    ) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`cv-dialog ${className}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <header className="cv-dialog__header">
        <div>
          <h2 id={titleId} className="cv-dialog__title">{title}</h2>
          {description && (
            <p id={descriptionId} className="cv-dialog__description">
              {description}
            </p>
          )}
        </div>
        {dismissible && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </header>
      <div className="cv-dialog__body">{children}</div>
      {footer && <footer className="cv-dialog__footer">{footer}</footer>}
    </dialog>
  )
}

// Confirmation dialog that disables dismissal while an action is pending.
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      dismissible={!loading}
      className="cv-confirm-dialog"
      footer={(
        <div className="cv-dialog__actions">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            onClick={onConfirm}
            loading={loading}
            loadingLabel="Working..."
          >
            {confirmLabel}
          </Button>
        </div>
      )}
    />
  )
}
