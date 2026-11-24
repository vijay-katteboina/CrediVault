// Surface wrapper for related page content.
function Card({ as: Element = 'section', className = '', children, ...props }) {
  return (
    <Element {...props} className={`cv-card ${className}`.trim()}>
      {children}
    </Element>
  )
}

export default Card
