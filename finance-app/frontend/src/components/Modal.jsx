import React, { useState, useEffect } from "react";

export default function Modal({
  show,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = "Confirmar",
  showCancel = true,
  type = "alert", // "alert", "confirm", "prompt"
  danger = false,
  defaultValue = "",
  dark
}) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (show) setInputValue(defaultValue);
  }, [show, defaultValue]);

  if (!show) return null;

  const handleConfirm = () => {
    if (type === "prompt") onConfirm(inputValue);
    else onConfirm();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onCancel || (() => {})}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {onCancel && (
          <button
            aria-label="Close"
            className="absolute top-4 right-4 text-sm text-muted transition-colors"
            onClick={onCancel}
          >
            ✕
          </button>
        )}
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        {message && <p className="mb-4 text-sm text-muted">{message}</p>}
        
        {type === "prompt" && (
          <input
            type="text"
            autoFocus
            className="input-base w-full mb-4"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        )}

        <div className="flex justify-end gap-3 mt-4">
          {showCancel && onCancel && (
            <button
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
          {onConfirm && (
            <button
              className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
