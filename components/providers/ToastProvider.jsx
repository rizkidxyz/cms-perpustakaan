"use client";

import { Toaster } from "react-hot-toast";

// Semua notifikasi tampil dari atas tengah, di bawah navbar.
const TOAST_CONTAINER_STYLE = { top: 80 };

const TOAST_OPTIONS = {
  style: {
    background: "var(--toast-bg)",
    color: "var(--toast-fg)",
    border: "1px solid var(--toast-border)",
    borderRadius: "0.9rem",
    boxShadow: "var(--toast-shadow)",
    fontSize: "0.875rem",
    fontWeight: 500,
    lineHeight: 1.5,
    maxWidth: "min(24rem, calc(100vw - 2rem))",
    padding: "0.75rem 1rem",
  },
  success: {
    duration: 3000,
    iconTheme: { primary: "#047857", secondary: "#ffffff" },
  },
  error: {
    duration: 4500,
    iconTheme: { primary: "#dc2626", secondary: "#ffffff" },
  },
};

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gutter={10}
      containerStyle={TOAST_CONTAINER_STYLE}
      toastOptions={TOAST_OPTIONS}
    />
  );
}
