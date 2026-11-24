// Scroll container that keeps semantic tables usable on narrow screens.
function DataTable({
  caption,
  className = '',
  wrapperClassName = '',
  children,
  ...props
}) {
  return (
    <div className={`cv-table-scroll ${wrapperClassName}`.trim()}>
      <table {...props} className={`cv-table ${className}`.trim()}>
        {caption && <caption className="cv-sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

export default DataTable
