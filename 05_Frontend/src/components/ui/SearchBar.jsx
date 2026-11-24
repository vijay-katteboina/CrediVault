import Button from './Button'
import { FormField, Input } from './FormControls'

// Labelled search form; callers retain control of filtering behavior.
function SearchBar({
  id,
  label = 'Search',
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  buttonLabel = 'Search',
  disabled = false,
}) {
  return (
    <form className="cv-search-bar" role="search" onSubmit={onSubmit}>
      <FormField id={id} label={label}>
        <Input
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </FormField>
      <Button type="submit" disabled={disabled}>{buttonLabel}</Button>
    </form>
  )
}

export default SearchBar
