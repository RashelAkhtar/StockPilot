import React from 'react';
import '../styles/Modal.css';

export default function Modal({
  open,
  title,
  children,
  onClose,
  variant = "success",
  primaryLabel = "OK",
  onPrimary,
  secondaryLabel = "",
  onSecondary,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={`modal-panel modal-${variant}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          {secondaryLabel ? (
            <button className="btn secondary" onClick={onSecondary || onClose}>
              {secondaryLabel}
            </button>
          ) : null}
          <button className="btn primary" onClick={onPrimary || onClose}>
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
