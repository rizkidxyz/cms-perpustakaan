<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Panduan Project Website Perpustakaan

Dokumen ini menjadi konteks dan aturan kerja untuk AI coding agents maupun developer yang mengerjakan project website perpustakaan ini. Baca dokumen ini sebelum mengubah kode.

## 1. Tujuan Project

Membangun website perpustakaan yang nantinya berkembang menjadi CMS untuk mengelola halaman, profil perpustakaan, layanan, berita, agenda, dan konten lainnya.

Arah desain yang telah disepakati:

- Modern minimalis, bersih, dan profesional.
- Warna utama emerald green.
- Mendukung light mode dan dark mode.
- Responsif untuk mobile, tablet, dan desktop.
- Navbar sticky.
- Konten dan menu nantinya diarahkan agar dapat dikelola melalui CMS.

Nama resmi perpustakaan belum ditetapkan di konfigurasi. Jangan mengarang nama, alamat, nomor telepon, jam operasional, statistik, berita, atau informasi institusi lainnya. Gunakan placeholder yang jelas sampai data diberikan.

## 2. Aturan Kolaborasi

- Komunikasi dengan pemilik project menggunakan bahasa Indonesia yang santai, ringkas, jelas, dan langsung ke inti.
- Pemilik project ingin menyetujui saran desain, fitur, maupun perubahan arah sebelum diterapkan. Ajukan satu keputusan penting pada satu waktu; jangan diam-diam menambahkan fitur besar.
- Untuk perbaikan bug, jelaskan penyebab, file yang perlu diubah, dan berikan kode yang bisa langsung diterapkan.
- Jangan mengklaim kode sudah diuji di komputer pemilik project kecuali memang ada hasil pengujian nyata.
- Jangan menghapus atau mengganti fungsi yang sudah berjalan tanpa alasan yang jelas.
- Jangan pernah meminta atau menuliskan secret, password database, token, atau kredensial asli ke dalam source code, log, dokumentasi, maupun commit.

## 3. Tech Stack yang Disepakati

- Next.js App Router.
- JavaScript saja: gunakan `.js`, `.jsx`, dan `.mjs`; jangan menambahkan TypeScript (`.ts` / `.tsx`) tanpa persetujuan.
- Tidak menggunakan import alias `@`. Gunakan relative imports.
- Tailwind CSS v4.
- Styling reusable menggunakan `@layer components` dan `@apply` di `app/globals.css`.
- `next-themes` untuk light/dark/system theme.
- Remix Icon untuk ikon.
- Database dapat diganti lewat `.env` (`DB_PROVIDER`): MySQL/MariaDB, PostgreSQL, atau Neon.
- Prisma ORM 7.x dengan driver adapter: `@prisma/adapter-mariadb`, `@prisma/adapter-pg`, dan `@prisma/adapter-neon`.
- Node.js runtime untuk kode server yang menggunakan Prisma atau Argon2. Jangan menambahkan konfigurasi route `runtime` jika `cacheComponents` aktif.

Sebelum mengubah versi dependency atau konfigurasi build, periksa `package.json`, lockfile, dan file konfigurasi aktual. Jangan melakukan upgrade major secara sepihak.

## 4. Struktur Project yang Diharapkan

Struktur dapat berkembang, tetapi pertahankan pemisahan tanggung jawab berikut:

```text
app/
  api/
    admin/
      categories/route.js
      media/route.js
      posts/route.js
    auth/
      login/route.js
      logout/route.js
      me/route.js
    media/[...path]/route.js
    posts/route.js
  dashboard/
    page.js
    create-post/page.js
    edit-post/[id]/page.js
    create-categories/page.js
  post/
    page.js
    [slug]/page.js
  login/
    page.js
  globals.css
  globals-cms.css
  layout.js
  page.js

components/
  auth/
    LoginForm.jsx
    LogoutButton.jsx
  cms/
    PostForm.jsx
    CategoryManager.jsx
    DashboardTabs.jsx
  home/
    HeroHeadline.jsx
    HeroCardStack.jsx
    HeroHighlight.jsx
    AboutVisual.jsx
    use-auto-cycle.js
  layout/
    Navbar.jsx
    Footer.jsx
    NavLinks.jsx
    ScrollToTop.jsx
    Breadcrumbs.jsx
  posts/
    PostCard.jsx
    PostShare.jsx
  providers/
    ThemeProvider.jsx

config/
  site.js
  home-content.js

controllers/
  auth.controller.js

lib/
  auth.js
  db-config.js
  prisma.js
  security.js

prisma/
  schema.prisma
  schema.active.prisma
  migrations-mysql/
  migrations-postgresql/
  seed.mjs

scripts/
  db-check.mjs
  db-schema.mjs

public/
  images/
    hero/
      hero-01.svg ... hero-05.svg

prisma.config.mjs
.env
.env.example
```

Ikuti struktur aktual repository jika pemilik project sudah mengubah lokasi folder. Beberapa project mungkin memakai `src/`; jangan memindahkan folder hanya demi mencocokkan contoh di dokumen ini.

## 5. Aturan Next.js App Router dan React

- Gunakan Server Component secara default.
- Tambahkan `"use client"` hanya untuk komponen yang benar-benar membutuhkan state, event handler, browser API, atau hooks client.
- Pisahkan Client Component kecil dari halaman Server Component jika memungkinkan.
- Jangan mengubah seluruh halaman menjadi Client Component hanya untuk satu interaksi.
- Jangan menggunakan `useEffect` untuk mengatur state yang sebenarnya bisa diselesaikan lewat event handler, props, render kondisional, atau CSS.
- Untuk route handler, gunakan `route.js` dan export HTTP method (`GET`, `POST`, dan sebagainya).
- `cacheComponents` aktif pada konfigurasi project. Jangan menambahkan segment config seperti `export const runtime` atau `export const dynamic` tanpa memastikan dukungan versi Next.js dan kompatibilitas `cacheComponents`.
- Jika Server Component membaca request-time data seperti `cookies()` atau `headers()`, tempatkan akses tersebut di dalam komponen async yang berada di bawah `<Suspense>` dengan fallback yang sesuai.
- Bila pembacaan waktu aktual (`Date.now()` / `new Date()`) dilakukan dalam jalur Server Component yang masih dapat diprerender, gunakan `await connection()` dari `next/server` sebelum pembacaan waktu tersebut. Jangan menaruh waktu aktual dalam static output.
- Pertahankan `data-scroll-behavior="smooth"` pada elemen `<html>` jika `scroll-behavior: smooth` dipakai pada CSS.
- `cookies()` pada Next.js modern bersifat async; gunakan `await cookies()`.
- Gunakan `router.refresh()` setelah perubahan autentikasi bila diperlukan agar Server Component membaca cookie/session terbaru.

## 6. Root Layout dan Theme

- `app/layout.js` adalah root layout global.
- `Navbar` dan `Footer` dipasang satu kali di root layout, bukan di setiap halaman.
- `ScrollToTop` juga dipasang satu kali di root layout sebagai tombol kembali ke atas.
- `<main>` menggunakan layout seperti `w-full min-w-0 flex-1` agar tidak memicu horizontal overflow.
- Setiap halaman menggunakan `.wrapper-page` untuk lebar konten dan responsive padding.
- `ThemeProvider` dari `next-themes` menggunakan `attribute="class"`, `defaultTheme="system"`, `enableSystem`, dan `disableTransitionOnChange`.
- Elemen `<html>` menggunakan `suppressHydrationWarning` karena theme library dapat mengubah class saat hydration.
- Ikon theme toggle harus aman terhadap hydration. Hindari membaca theme untuk menghasilkan markup yang berbeda sebelum client siap.

## 7. Aturan Styling Tailwind CSS v4

Gunakan pola berikut untuk component classes:

```css
@import "tailwindcss";
@import "remixicon/fonts/remixicon.css";

@custom-variant dark (&:where(.dark, .dark *));

@layer components {
  .wrapper-page {
    @apply mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8;
  }

  .button-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-full
      bg-emerald-700 px-5 py-3 text-sm font-semibold text-white
      transition-colors hover:bg-emerald-800;
  }
}
```

Aturan styling:

- Untuk reusable component classes, utamakan `@layer components` + `@apply`, bukan `@utility`, sesuai preferensi pemilik project.
- Gunakan Tailwind utility langsung untuk styling yang hanya dipakai sekali atau variasi lokal.
- Gunakan dark variant / `@variant dark` untuk semua komponen visual yang perlu mendukung dark mode.
- Gunakan palette slate untuk netral dan emerald untuk aksen utama.
- Pastikan kontras teks, hover, focus, border, input, placeholder, disabled, dan error state memadai pada kedua tema.
- Jangan menulis selector CSS yang memaksa `color-scheme` salah pada dark mode.
- Hindari `w-screen` / `min-w-screen` pada wrapper utama bila `w-full` lebih sesuai.
- Gunakan breakpoint Tailwind (`sm:`, `md:`, `lg:`, dan seterusnya) untuk responsivitas.

Reusable classes yang telah diperkenalkan antara lain:

- `wrapper-page` / `container-page`
- `section-space`
- `stack-y`
- `surface-card`
- `text-muted`
- `button-primary`
- `button-secondary`
- `focus-ring`
- `nav-link`, `nav-link-active`
- `mobile-nav-link`, `mobile-nav-link-active`
- `footer-link`
- `scroll-top-button`
- `breadcrumb`, `breadcrumb-list`, `breadcrumb-link`, `breadcrumb-current`, `breadcrumb-separator`
- `post-slider`, `post-slider-toolbar`, `post-slider-viewport`, `post-slider-track`, `post-slider-group`, `post-slider-item`, `post-slider-button`, `post-slider-hint`, `post-slider-fallback`
- `post-share`, `post-share-button`
- `dashboard-tabs`, `dashboard-tab`, `dashboard-tab-panel`
- `hero-headline-swap`
- `hero-card-stack`, `hero-card-stack-item`, `hero-card-stack-image`, `hero-card-slot-top`, `hero-card-slot-left`, `hero-card-slot-right`
- `hero-float-card`, `hero-float-card-delay`, `hero-highlight-content`, `hero-stack-caption`
- `about-visual-content`, `about-visual-icon`, `about-visual-label`, `about-visual-caption`, `about-visual-orb`, `about-visual-orb-delay`

Jika menambahkan reusable class baru, letakkan di bagian kategori yang sesuai dalam `@layer components` dan dokumentasikan kegunaannya secara singkat.

Animasi homepage memakai CSS dan hook lokal, tanpa library tambahan:

- `useFadingCycle()` di `components/home/use-auto-cycle.js` mengganti indeks tiap 5 detik dengan fade 250 ms. Parameter keempat `startOffset` membuat beberapa komponen bisa mulai dari item berbeda.
- `useCardRotation()` merotasi tiga kartu hero: kanan → atas, atas → kiri, kiri → kanan. Frame dan gambar kartu disimpan bersama agar gambar ikut berpindah; hanya kartu yang masuk slot kanan menerima gambar baru.
- Kedua hook berhenti saat `prefers-reduced-motion: reduce` dan menjeda timer saat tab tidak aktif.

## 8. Navigasi dan Identitas Website

Menu navigasi yang sudah disetujui:

1. Beranda (`/`)
2. Profil (`/profile`)
3. Layanan (`/services`)
4. Post (`/post`)
5. Kontak (`/contact`)

Slug konten tetap memakai slug buatan pengguna. Halaman detail publik berada di `/post/[slug]`. Dashboard internal berada di `/dashboard` dengan halaman `/dashboard/create-post`, `/dashboard/edit-post/[id]`, dan `/dashboard/create-categories`.

Data nama website dan menu dikelola sementara melalui `config/site.js`. Jadikan satu sumber data; jangan menduplikasi daftar menu di Navbar dan Footer. Nantinya sumber data dapat diganti dengan CMS setelah model konten disepakati.

Navbar:

- Sticky.
- Desktop navigation dan mobile menu.
- Mobile menu menutup setelah pengguna memilih link atau menekan Escape.
- Gunakan `aria-label`, `aria-expanded`, `aria-controls`, dan `aria-current` bila relevan.

Footer:

- Tetap Server Component kecuali ada kebutuhan interaksi nyata.
- Jangan menampilkan alamat, email, jam operasional, atau media sosial fiktif.

## 9. Database dan Prisma

Koneksi database dipilih lewat `.env`. Satu set kode yang sama bisa dipakai untuk MySQL/MariaDB, PostgreSQL biasa, atau Neon tanpa mengubah source.

- `DB_PROVIDER` menentukan provider: `mysql` (alias `mariadb`), `postgresql` (alias `pg`/`postgres`), atau `neon`.
- Isi salah satu sumber koneksi: `DB_URL` (connection string lengkap) atau parameter `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSLMODE`. Minimal salah satunya harus terisi.
- `DB_URL_DIRECT` opsional. Dipakai Prisma CLI untuk operasi DDL. Di Neon, isi endpoint tanpa `-pooler`, atau biarkan kosong supaya `-pooler` dilepas otomatis dari `DB_URL`.
- `lib/db-config.js` menjadi pusat logika provider dan URL, dipakai oleh runtime aplikasi, Prisma CLI, dan script.
- `lib/prisma.js` memilih driver adapter saat runtime sesuai `DB_PROVIDER`.
- Prisma CLI config berada di `prisma.config.mjs`; Prisma CLI selalu memakai koneksi direct.
- `prisma/schema.prisma` adalah template sumber. `scripts/db-schema.mjs` menyalinnya ke `prisma/schema.active.prisma` sambil menyesuaikan `provider`. File aktif ini yang dipakai Prisma CLI dan bersifat generated (tidak di-commit).
- Migrasi dipisah per provider: `prisma/migrations-mysql/` dan `prisma/migrations-postgresql/`. `lib/db-config.js` memilih folder sesuai provider.
- Prisma Client hasil generate berada di `generated/prisma` sesuai konfigurasi generator.
- Gunakan satu instance Prisma Client untuk menghindari koneksi berlebihan saat development.

Environment variables yang digunakan:

```env
APP_URL="http://localhost:3000"

DB_PROVIDER="postgresql"
DB_URL=""
DB_URL_DIRECT=""
DB_HOST=""
DB_PORT=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""
DB_SSLMODE="require"

AUTH_SECRET=""
ADMIN_NAME="Administrator"
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
```

Jangan menambahkan prefix `NEXT_PUBLIC_` pada kredensial atau secret server.

Script `package.json` yang tersedia:

- `npm run db:sync` — generate `prisma/schema.active.prisma` dari `DB_PROVIDER`.
- `npm run db:check` — tes koneksi database.
- `npm run db:generate` — sync schema lalu `prisma generate`.
- `npm run db:migrate` — sync lalu `prisma migrate dev` (untuk development).
- `npm run db:deploy` — sync lalu `prisma migrate deploy` (untuk production/Neon).
- `npm run db:seed` — jalankan seed administrator.
- `npm run db:studio` — buka Prisma Studio.
- `npm run db:setup` — sync, generate, deploy, dan seed sekaligus.

Aturan migrasi:

- Perubahan schema harus dibuat melalui Prisma Migrate, bukan mengedit database secara manual.
- Selalu ubah `prisma/schema.prisma` (template), lalu jalankan `npm run db:sync`.
- Development lokal: `npx prisma migrate dev --name nama_perubahan`.
- Neon dan production: `prisma migrate deploy`, bukan `migrate dev`.
- Untuk membuat baseline di provider baru, gunakan `prisma migrate diff --from-empty --to-schema prisma/schema.active.prisma --script`, lalu terapkan dengan `migrate deploy`. Jangan pakai `migrate dev` di Neon.
- Jangan menjalankan `migrate reset`, menghapus migration, atau menghapus database tanpa persetujuan eksplisit.
- Jangan menjalankan ulang seed dengan asumsi password admin akan diperbarui: seed awal hanya membuat akun jika belum ada. Perubahan password harus memakai prosedur reset yang aman.

Schema awal telah dirancang untuk:

- `User`: akun ADMIN dan EDITOR.
- `Session`: session token hash, user relation, dan expiry.
- `LoginAttempt`: catatan percobaan login untuk rate limit.

Untuk deklarasi relation Prisma, ikuti sintaks Prisma yang valid. Format satu baris dapat dipakai agar parser tidak salah membaca multiline relation pada schema yang sedang digunakan:

```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

Jangan mengarang versi Prisma atau adapter. Periksa package terpasang sebelum mengubah API konfigurasi.

## 10. Authentication dan Security

Arsitektur autentikasi yang telah dibuat:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- Controller terpisah di `controllers/auth.controller.js`.
- Session opaque token 256-bit, disimpan sebagai SHA-256 hash di database.
- Session cookie bernama `perpus_session` dengan `HttpOnly`, `SameSite=Lax`, `Path=/`, dan `Secure` pada production.
- Session berlaku 7 hari.
- Password di-hash menggunakan Argon2id; jangan menyimpan plaintext password.
- Login rate limit awal: 8 percobaan per IP dalam 15 menit, memakai `LoginAttempt`.
- Pemeriksaan Origin untuk operasi login/logout.
- `requireStaff()` dan `requireAdmin()` untuk authorization di server.
- Role awal: `ADMIN` dan `EDITOR`.

Aturan wajib:

- Jangan pernah mempercayai role, user ID, atau status login dari client/localStorage.
- Setiap halaman admin dan setiap API mutasi konten wajib melakukan authorization server-side.
- Jangan hanya menyembunyikan tombol atau menu di frontend sebagai proteksi.
- Jangan pernah mengembalikan `passwordHash`, raw session token, `AUTH_SECRET`, atau kredensial database ke client.
- Response autentikasi yang sensitif harus memakai `Cache-Control: no-store`.
- Login harus menggunakan pesan error generik agar tidak membocorkan apakah email terdaftar.
- Periksa reverse proxy dan sanitasi forwarded IP headers sebelum mengandalkan rate limit berbasis IP di production.
- `APP_URL` harus sesuai origin publik yang benar di setiap environment karena dipakai untuk pemeriksaan Origin.
- Jangan memasang middleware/proxy auth secara membabi buta tanpa memahami versi Next.js dan alur session yang ada.
- Jangan mengimpor modul database, Argon2, atau fungsi autentikasi ke Client Component.

Catatan module boundary: script Prisma seed berjalan di Node.js CLI. Modul yang juga dipakai oleh seed tidak boleh memiliki import `server-only` yang menyebabkan CLI gagal. Jaga agar modul sensitif hanya diimpor dari kode server dan script CLI; jika perlu, refactor pemisahan modul server-only dengan helper yang dapat dipakai seed. Jangan menghapus perlindungan server-only dari modul yang langsung digunakan oleh route/controller/page server tanpa alasan.

## 11. Penanganan Cache Components dan Rendering Dinamis

Project mengaktifkan `cacheComponents`. Karena itu:

- Jangan menambahkan `export const runtime = "nodejs"` pada route handler jika bertentangan dengan konfigurasi aktif; Node.js adalah runtime default untuk kebutuhan saat ini.
- Jangan menambahkan `export const dynamic = "force-dynamic"` sebagai jalan pintas.
- Untuk halaman yang membaca cookies/session, letakkan komponen async yang memanggil `getCurrentUser()` atau `requireStaff()` di bawah `<Suspense>` dengan fallback.
- `getCurrentUser()` saat ini menggunakan `await connection()` dari `next/server` sebelum membaca waktu aktual dan cookies. Pertahankan pola yang bekerja tersebut kecuali ada alasan teknis yang diverifikasi.
- Jangan memanggil `Date.now()` atau `new Date()` pada jalur render statis tanpa mekanisme request-time yang sesuai.
- API Route Handler yang menangani autentikasi tetap memanggil controller server-side; jangan memindahkan autentikasi ke browser.

## 12. Environment dan Git

- `.env` wajib berada di `.gitignore`.
- Commit `.env.example` tanpa nilai rahasia.
- Jangan menaruh password asli, secret, session token, atau dump database di repository.
- Jangan menyalin isi `.env` ke issue, chat, log, atau dokumentasi.
- Jika membuat file baru, pastikan import path relatif benar karena project tidak menggunakan alias `@`.

## 13. Workflow Perubahan

Sebelum mengubah kode:

1. Periksa file yang ada dan konfigurasi aktual; jangan berasumsi nama/path persis sama dengan contoh.
2. Identifikasi dampak pada App Router, `cacheComponents`, Prisma, auth, dan light/dark mode.
3. Pertahankan fitur yang sudah berfungsi.
4. Untuk perubahan skema database, jelaskan dampak migrasinya.
5. Untuk perubahan desain/fitur besar, minta persetujuan pemilik project terlebih dahulu.

Setelah mengubah kode, jalankan pemeriksaan yang tersedia:

```bash
npx prisma validate
npx prisma generate
npm run lint
npm run build
```

Jalankan hanya pemeriksaan yang relevan dan tersedia pada `package.json`. Jangan mengklaim pemeriksaan berhasil bila tidak benar-benar dijalankan.

## 14. Status Project Saat Ini

Yang telah disepakati atau dibuat:

- Root layout dengan Navbar dan Footer global.
- Design system modern minimalis dengan aksen emerald.
- Light/dark mode melalui `next-themes`.
- Remix Icon.
- Responsive navigation dengan menu: Beranda, Profil, Layanan, Berita & Agenda, Kontak.
- `wrapper-page` sebagai container halaman reusable.
- Custom `not-found.js`.
- Homepage awal dengan hero, pintasan informasi, tentang perpustakaan, placeholder berita/agenda, dan CTA kontak.
- Animasi homepage: headline hero berganti 4 varian dengan fade, tumpukan 3 kartu gambar berotasi tiap 5 detik (gambar ikut berpindah bersama kartu), dua floating card dan visual about berganti konten dengan fade. Konten diatur di `config/home-content.js`, placeholder gambar di `public/images/hero/`.
- Database switchable lewat `DB_PROVIDER`: MySQL/MariaDB, PostgreSQL, atau Neon. Database aktif saat ini: Neon PostgreSQL (`cms_perpustakaan`).
- Prisma ORM 7.10.1 dengan driver adapter `@prisma/adapter-mariadb`, `@prisma/adapter-pg`, dan `@prisma/adapter-neon`.
- Schema awal User, Session, LoginAttempt.
- Bootstrap database dan seed administrator.
- Login, logout, endpoint pemeriksaan sesi, Argon2id password hash, database-backed sessions, dan role ADMIN/EDITOR.
- Halaman `/login` dan dashboard di `/dashboard`.
- Route publik berbahasa Inggris: `/profile`, `/services`, `/post`, `/contact`, dan detail `/post/[slug]`; slug konten tidak diubah.
- Dashboard langsung menampilkan daftar post dengan pencarian/filter, plus toggle Posts/Categories tanpa parameter URL. Categories hanya tersedia untuk ADMIN.
- Halaman `/dashboard/create-post`, `/dashboard/edit-post/[id]`, dan `/dashboard/create-categories`.
- Breadcrumb inline (tidak sticky) hanya di halaman `/post` dan `/post/[slug]`. Halaman detail memakai `Home > Post > Judul`, lengkap dengan JSON-LD BreadcrumbList.
- Metadata lengkap: title template, deskripsi, keywords, canonical per halaman, OpenGraph (`website`/`article`), Twitter card, dan gambar OG default yang digenerate di `app/opengraph-image.js`.
- Halaman login dan dashboard memakai `noindex,nofollow`.
- Homepage menampilkan maksimal 10 post terbaru dalam slider horizontal yang bisa digeser dua arah tanpa putus, diambil lewat `getLatestPublicPosts()` di `lib/public-posts.js`.
- Tombol share WhatsApp, Facebook, Instagram (share sheet atau salin link), dan salin link.
- Estimasi waktu baca dari isi konten dengan rumus kata / 225; tampil di halaman detail dan kartu daftar `/post`, tidak ditampilkan bila di bawah satu menit.
- Tombol kembali ke atas yang muncul setelah halaman digulir setengah.
- Tombol logout tersedia di header dashboard.
- Perbaikan rendering `cacheComponents`: route tidak lagi menggunakan deklarasi `runtime`/`dynamic`; komponen yang mengakses session dibungkus Suspense; `getCurrentUser()` menggunakan `connection()` sebelum pembacaan waktu aktual.
- CMS konten dasar: daftar, buat, edit, hapus, kategori, serta status publikasi.
- Media gambar: upload ke `storage/images`, penyajian via `/api/media/images/...`, validasi signature, dan cleanup file yatim.
- Media video: upload MP4/WEBM maksimal 100 MB ke `storage/videos`, penyajian dengan dukungan HTTP Range, embed YouTube/Vimeo/Google Drive/file langsung, player sendiri, dan cleanup file yatim.
- Redirect setelah simpan/hapus konten memakai `router.replace()` tanpa `router.refresh()`, dengan fallback hard navigation bila navigasi client-side tidak terjadi.

Hal yang belum dikerjakan:

- CRUD profil, layanan, berita, dan agenda.
- Media/file upload untuk jenis selain gambar dan video.
- Pengelolaan akun admin/editor dari dashboard.
- Password reset dan MFA.
- Pengujian production dan hardening operasional.

Jangan menganggap fitur yang belum dikerjakan sudah tersedia.

## 15. Prioritas Pengembangan Berikutnya

Lanjutkan dari kondisi repository aktual dan konfirmasi dengan pemilik project sebelum menetapkan desain/fitur besar berikutnya. Arah yang direncanakan adalah penyempurnaan dashboard, manajemen akun, lalu modul pengelolaan halaman profil/layanan secara bertahap.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
