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
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] transition-opacity"
      onClick={onCancel || (() => {})}
    >
      <div
        className={`p-6 rounded-2xl w-full max-w-sm border shadow-xl relative ${dark ? "bg-[#1E2329] border-[#2B3139] text-[#EAECEF]" : "bg-white text-gray-900 border-gray-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {onCancel && (
          <button
            aria-label="Close"
            className="absolute top-4 right-4 text-sm text-[#9CA3AF] hover:text-current transition-colors"
            onClick={onCancel}
          >
            ✕
          </button>
        )}
        {title && <h2 className="font-semibold mb-3 text-lg">{title}</h2>}
        {message && <p className={`mb-4 text-sm ${dark ? "text-[#9CA3AF]" : "text-gray-500"}`}>{message}</p>}
        
        {type === "prompt" && (
          <input
            type="text"
            autoFocus
            className={`w-full p-2 mb-4 rounded-xl outline-none focus:ring-2 focus:ring-[#FCD535] ${dark ? "bg-[#151719] border border-[#2B3139] text-[#EAECEF]" : "bg-gray-50 border border-gray-200 text-gray-900"}`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          />
        )}

        <div className="flex justify-end gap-3 mt-4">
          {showCancel && onCancel && (
            <button
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${dark ? "text-[#9CA3AF] hover:bg-[#2B3139]" : "text-gray-500 hover:bg-gray-100"}`}
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
          {onConfirm && (
            <button
              className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${danger ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#FCD535] text-black hover:bg-[#FFE055]"}`}
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
