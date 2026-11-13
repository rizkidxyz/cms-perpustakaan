import { Suspense } from "react";
import { redirect } from "next/navigation";

import LoginForm from "../../components/auth/LoginForm";
import { getCurrentUser } from "../../lib/auth";

export const metadata = {
  title: "Login Administrator",
  description: "Masuk ke panel administrasi perpustakaan.",
  robots: { index: false, follow: false },
};

// ========================================
// LOADING FALLBACK
// ========================================

function LoginFallback() {
  return (
    <section className="wrapper-page flex min-h-[70svh] items-center justify-center py-16">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <i className="ri-loader-4-line animate-spin text-3xl text-emerald-700 dark:text-emerald-400" />

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Memeriksa sesi pengguna...
        </p>
      </div>
    </section>
  );
}

// ========================================
// LOGIN CONTENT
// ========================================

async function LoginContent() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <section className="wrapper-page flex min-h-[70svh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-700 text-2xl text-white shadow-lg shadow-emerald-900/20">
            <i className="ri-shield-user-line" />
          </span>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            Administrator Access
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Selamat Datang
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Silakan masuk untuk mengelola konten dan informasi perpustakaan.
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-slate-400">
          Akses terbatas untuk administrator dan pengelola.
        </p>
      </div>
    </section>
  );
}

// ========================================
// PAGE
// ========================================

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
