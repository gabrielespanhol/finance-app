import React from "react";

export default function ConfirmModal({
  show,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirm",
}) {
  if (!show) return null;
  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          className="absolute top-4 right-4 text-muted transition-colors"
          onClick={onCancel}
        >
          ✕
        </button>
        <h2 className="text-lg font-semibold mb-3">{title}</h2>
        <p className="mb-4 text-sm text-muted">{message}</p>
        <div className="flex justify-end gap-3 mt-4">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
