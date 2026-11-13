"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Logout gagal.");
      }

      toast.success("Berhasil logout.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Gagal logout. Silakan coba lagi.");
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="button-secondary focus-ring disabled:opacity-50"
    >
      <i className="ri-logout-box-r-line" />

      {isLoading ? "Keluar..." : "Logout"}
    </button>
  );
}
