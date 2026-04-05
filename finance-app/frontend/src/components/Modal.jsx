import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
    if (show) {
       setInputValue(defaultValue);
       document.body.classList.add("modal-open");
    } else {
       document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [show, defaultValue]);

  if (!show) return null;

  const handleConfirm = () => {
    if (type === "prompt") onConfirm(inputValue);
    else onConfirm();
  };

  const modalElement = (
    <div className="modal-overlay" onClick={onCancel || (() => {})}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {onCancel && (
          <button
            aria-label="Fechar"
            className="modal-close"
            onClick={onCancel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}

        {title && <h2 className="text-xl font-bold mb-6">{title}</h2>}
        {message && <p className="mb-8 text-sm text-muted leading-relaxed">{message}</p>}
        
        {type === "prompt" && (
          <div className="flex flex-col gap-1.5 mb-8">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Ação requerida</label>
            <input
              type="text"
              autoFocus
              className="input-base w-full"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
          </div>
        )}

        <div className="flex justify-end gap-3">
          {showCancel && onCancel && (
            <button className="btn btn-secondary border border-border px-6" onClick={onCancel}>
              Cancelar
            </button>
          )}
          {onConfirm && (
            <button className={`btn ${danger ? "btn-danger" : "btn-primary"} px-8`} onClick={handleConfirm}>
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalElement, document.body);
}
