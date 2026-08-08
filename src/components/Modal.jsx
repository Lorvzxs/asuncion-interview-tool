import { useState, useEffect, useRef } from 'react';

export default function Modal({ open, onClose, children, className = '', maxWidth = 'max-w-xl' }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      contentRef.current = children;
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
        contentRef.current = null;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, visible, children]);

  if (!visible) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm ${
        closing ? 'modal-backdrop-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`glass-card rounded-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto p-6 ${
          closing ? 'modal-content-exit' : 'modal-content-enter'
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {open ? children : contentRef.current}
      </div>
    </div>
  );
}
