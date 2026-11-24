import { Children, cloneElement } from 'react'

// Associates a visible label, helper text, and validation message with one control.
export function FormField({
  id,
  label,
  hint,
  error,
  required = false,
  className = '',
  children,
}) {
  const control = Children.only(children)
  const describedBy = [
    control.props['aria-describedby'],
    hint ? `${id}-hint` : '',
    error ? `${id}-error` : '',
  ].filter(Boolean).join(' ')

  const labelledControl = cloneElement(control, {
    id: control.props.id || id,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': error ? true : control.props['aria-invalid'],
  })

  return (
    <div className={`cv-form-field ${className}`.trim()}>
      <label className="cv-form-field__label" htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {labelledControl}
      {hint && <p className="cv-form-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && (
        <p className="cv-form-field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Shared text input for labelled forms.
export function Input({ className = '', ...props }) {
  return <input {...props} className={`cv-control ${className}`.trim()} />
}

// Shared select control for labelled forms.
export function Select({ className = '', ...props }) {
  return <select {...props} className={`cv-control ${className}`.trim()} />
}

// Shared multiline input for labelled forms.
export function Textarea({ className = '', ...props }) {
  return <textarea {...props} className={`cv-control cv-control--textarea ${className}`.trim()} />
}
