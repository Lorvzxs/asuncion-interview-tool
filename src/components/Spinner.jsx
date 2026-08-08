export default function Spinner({ variant = 'light', className = '' }) {
  return <span className={`spinner ${variant === 'dark' ? 'spinner-dark' : ''} ${className}`} aria-hidden="true" />;
}
