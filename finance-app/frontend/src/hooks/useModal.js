import { useState } from "react";

export default function useModal() {
  const [modalState, setModalState] = useState({
    show: false,
    title: "",
    message: "",
    confirmLabel: "OK",
    showCancel: false,
    onConfirm: null,
    onCancel: null,
    type: "alert",
    danger: false,
    defaultValue: "",
  });

  const hide = () => setModalState(s => ({ ...s, show: false }));

  const showAlert = (title, message) => {
    return new Promise((resolve) => {
      setModalState({
        show: true,
        title,
        message,
        confirmLabel: "OK",
        showCancel: false,
        type: "alert",
        danger: false,
        onConfirm: () => {
          hide();
          resolve();
        },
        onCancel: () => {
          hide();
          resolve();
        }
      });
    });
  };

  const showConfirm = (title, message, confirmLabel = "Confirmar", danger = false) => {
    return new Promise((resolve) => {
      setModalState({
        show: true,
        title,
        message,
        confirmLabel,
        showCancel: true,
        type: "confirm",
        danger,
        onConfirm: () => {
          hide();
          resolve(true);
        },
        onCancel: () => {
          hide();
          resolve(false);
        }
      });
    });
  };

  const showPrompt = (title, message, confirmLabel = "Confirmar", defaultValue = "") => {
    return new Promise((resolve) => {
      setModalState({
        show: true,
        title,
        message,
        confirmLabel,
        showCancel: true,
        type: "prompt",
        danger: false,
        defaultValue,
        onConfirm: (val) => {
          hide();
          resolve(val);
        },
        onCancel: () => {
          hide();
          resolve(null);
        }
      });
    });
  };

  return { modalState, showAlert, showConfirm, showPrompt };
}
