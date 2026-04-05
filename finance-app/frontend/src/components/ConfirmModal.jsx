import React, { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  show,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
}) {
  useEffect(() => {
    if (show) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [show]);

  if (!show) return null;

  const modalElement = (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          aria-label="Close"
          className="modal-close"
          onClick={onCancel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-8 text-sm text-muted leading-relaxed">{message}</p>
        
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn btn-secondary border border-border px-6" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-danger px-8" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
