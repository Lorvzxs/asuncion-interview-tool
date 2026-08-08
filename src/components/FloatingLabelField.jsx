import { useState } from 'react';

export default function FloatingLabelField({
  id,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  type = 'text',
  required = false,
  className = '',
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || (value !== '' && value != null);

  return (
    <div className={`floating-field ${className}`}>
      <label htmlFor={id} className={`floating-label ${isActive ? 'is-active' : ''}`}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className="floating-input"
        required={required}
      />
    </div>
  );
}
