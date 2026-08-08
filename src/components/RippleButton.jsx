import { useRef } from 'react';

export default function RippleButton({
  children,
  className = '',
  variant = 'dark',
  type = 'button',
  onClick,
  ...props
}) {
  const ref = useRef(null);

  const handleClick = (e) => {
    const button = ref.current;
    if (button && !props.disabled) {
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      button.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }
    onClick?.(e);
  };

  const variantClass =
    variant === 'light' ? 'ripple-button-light' : variant === 'ghost' ? 'ripple-button-light' : 'ripple-button-dark';

  return (
    <button
      ref={ref}
      type={type}
      className={`ripple-button btn-hover ui-transition ${variantClass} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
