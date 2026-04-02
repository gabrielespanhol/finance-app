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
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className={`p-4 rounded-2xl w-full max-w-md border shadow-lg relative bg-white text-gray-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          className="absolute top-3 right-3 text-sm text-[#9CA3AF] hover:text-black"
          onClick={onCancel}
        >
          ✕
        </button>
        <h2 className="font-semibold mb-3">{title}</h2>
        <p className="mb-4 text-sm text-[#9CA3AF]">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded-2xl"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="bg-red-600 text-white px-3 py-1 rounded-2xl"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
