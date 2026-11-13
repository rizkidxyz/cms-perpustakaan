"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "same-origin",

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Gagal melakukan login.");

        return;
      }

      toast.success(result.message || "Login berhasil.");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.error("Tidak dapat terhubung ke server. Silakan coba kembali.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="surface-card space-y-5 p-6 sm:p-8"
      aria-busy={isLoading}
    >
      {/* Email */}
      <div>
        <label htmlFor="email" className="form-label">
          Email
        </label>

        <div className="relative">
          <i className="ri-mail-line form-input-icon" />

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            required
            maxLength={191}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            disabled={isLoading}
            className="form-input form-input-with-icon"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="password" className="form-label mb-0">
            Password
          </label>
        </div>

        <div className="relative">
          <i className="ri-lock-password-line form-input-icon" />

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            disabled={isLoading}
            className="form-input form-input-with-icon pr-12"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={
              showPassword ? "Sembunyikan password" : "Tampilkan password"
            }
            className="focus-ring absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-lg text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400"
          >
            <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="button-primary button-block focus-ring"
      >
        {isLoading ? (
          <>
            <i className="ri-loader-4-line animate-spin text-lg" />
            Memproses...
          </>
        ) : (
          <>
            Masuk ke Dashboard
            <i className="ri-arrow-right-line text-lg" />
          </>
        )}
      </button>
    </form>
  );
}
