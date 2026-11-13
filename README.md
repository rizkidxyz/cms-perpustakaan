# CMS Konten Perpustakaan — implementasi awal

Paket ini berisi modul konten untuk project Next.js App Router + JavaScript + Tailwind CSS v4 + Prisma 7 + MySQL yang sudah memiliki autentikasi `lib/auth.js` dan Prisma Client di `lib/prisma.js`.

## Keputusan yang diimplementasikan

- Editor Tiptap 3 (JSON disimpan di MySQL).
- Kategori dinamis.
- Status `DRAFT` / `PUBLISHED` dipisahkan dari visibilitas `PUBLIC` / `UNLISTED`.
- `PUBLIC` tampil di daftar publik dan halaman detail.
- `UNLISTED` dapat diakses lewat `/post/[slug]`, tetapi tidak tampil di daftar publik dan diberi `noindex,nofollow`.
- Draft hanya dapat diakses dari CMS oleh pengguna berwenang; URL publik mengembalikan 404.
- Gambar dapat dimasukkan melalui URL atau diunggah ke `storage/images` (di luar `public`) dan disajikan melalui `/api/media/images/...`.
- Gambar di editor dapat di-resize, dirata-kirikan/tengah/kanankan, atau dibuat mengalirkan teks di sekitarnya.
- Halaman `/post` menampilkan konten terbit dengan pencarian, filter kategori, urutan terbaru/terlama, dan pagination.
- Dashboard `/dashboard` langsung menampilkan daftar post dengan pencarian, filter status/kategori, urutan, dan pagination. Toggle Posts/Categories tersedia untuk ADMIN tanpa mengubah URL.
- Breadcrumb inline (tidak sticky) hanya di halaman `/post` dan `/post/[slug]`. Halaman detail memakai `Home > Post > Judul` dan JSON-LD BreadcrumbList. Tombol share WhatsApp, Facebook, Instagram, serta salin link tersedia di detail.
- Metadata lengkap: title template, deskripsi, keywords, canonical, OpenGraph, Twitter card, dan gambar OG default hasil generate `app/opengraph-image.js`. Login dan dashboard diberi `noindex,nofollow`.
- Homepage menampilkan maksimal 10 post terbaru dalam slider horizontal dua arah tanpa putus (`getLatestPublicPosts()`).
- Hero homepage memakai headline berganti otomatis dengan fade dan tumpukan 3 kartu gambar yang berotasi tiap 5 detik; gambar tetap menempel pada kartunya dan hanya kartu yang masuk slot kanan mendapat gambar baru.
- Dua floating card di hero dan visual about berganti konten dengan fade. Konten headline, gambar hero, dan item about diatur di `config/home-content.js`; placeholder gambar ada di `public/images/hero/`.
- Animasi menghormati `prefers-reduced-motion` dan berhenti saat tab tidak aktif.
- Estimasi waktu baca (jumlah kata / 225) tampil di halaman detail dan kartu daftar `/post` bila minimal satu menit.
- Tombol logout tersedia di header dashboard.
- Tombol kembali ke atas muncul setelah halaman digulir setengah.
- Menghapus konten ikut membersihkan gambar lokal yang tidak lagi dipakai konten lain.
- Form memakai class reusable `form-*` di `app/globals.css`.
- Ringkasan konten bersifat opsional dan tidak diambil otomatis dari isi konten.
- Toolbar editor menempel di bawah navbar saat halaman digulir (mulai ukuran tablet).
- Route API administratif memeriksa session dan role di server.
- Konten JSON divalidasi dengan allowlist dan HTML hasil render disanitasi sebelum ditampilkan.

## 1. Prasyarat dan package

Pastikan project sudah memiliki:

- Next.js App Router dengan `cacheComponents: true`.
- Prisma ORM 7 dan konfigurasi database MySQL yang sudah berjalan.
- `lib/prisma.js` mengekspor `{ prisma }`.
- `lib/auth.js` mengekspor `requireStaff()` dan `requireAdmin()`; `requireStaff()` mengembalikan `{ id, name, email, role }`.
- Package `server-only` telah terpasang.

Jalankan dari root project:

```bash
npm install @tiptap/core@^3 @tiptap/react@^3 @tiptap/pm@^3 @tiptap/starter-kit@^3 @tiptap/extension-text-style@^3 @tiptap/extension-highlight@^3 @tiptap/extension-image@^3 @tiptap/extension-text-align@^3 @tiptap/extension-table@^3 @tiptap/static-renderer@^3 sanitize-html
```

Jika package Tiptap tersebut sebelumnya sudah dipasang, npm hanya akan menyesuaikan dependency yang kurang.

## 2. Merge Prisma schema

File `prisma/schema.prisma` dalam paket ini adalah schema gabungan yang mempertahankan model `User`, `Session`, dan `LoginAttempt` dari implementasi auth sebelumnya serta menambahkan `Category` dan `Post`.

**Periksa `prisma/schema.prisma` milik project sebelum mengganti.** Jika sudah ada perubahan pada model auth, pertahankan perubahan itu dan merge bagian enum `PostStatus`, `PostVisibility`, model `Category`, model `Post`, serta relasi `posts Post[]` pada `User`.

Pastikan `generator` tetap menggunakan:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}
```

Sesudah schema digabung:

```bash
npx prisma format
npx prisma validate
npx prisma migrate dev --name add_cms_content
npx prisma generate
```

Jangan jalankan ulang seed administrator. Migrasi ini tidak menghapus tabel auth.

## 3. Salin file

Folder dalam paket ini mengikuti path project. Salin isi folder `app`, `components`, `controllers`, `lib`, dan `prisma` ke root project sesuai struktur folder. **Jangan menimpa `prisma/schema.prisma` project begitu saja** jika ada penyesuaian model auth lain; gunakan file dalam paket sebagai schema gabungan dan merge dengan teliti. File `app/globals-cms.css` sudah diimpor dari `app/globals.css`; jangan menyalin ulang isinya ke file lain.

## 4. Upload media (gambar dan video)

Endpoint upload menyimpan file image ke `storage/images/<uuid>.<ext>`, di luar folder `public`. File kemudian disajikan melalui route `GET /api/media/images/<uuid>.<ext>`. Format yang diterima hanya JPEG, PNG, WEBP, dan GIF; maksimum 5 MB. SVG ditolak untuk menghindari risiko script aktif.

Video lokal diunggah ke `storage/videos/<uuid>.<ext>` melalui endpoint yang sama dengan query `?type=videos` dan disajikan dari `/api/media/videos/<uuid>.<ext>`. Format yang diterima hanya MP4 dan WEBM, maksimum 100 MB. Deteksi tipe memakai signature file, bukan ekstensi: container MP4 divalidasi lewat brand `ftyp` agar HEIC/AVIF tidak lolos, dan WEBM lewat header EBML. Endpoint penyajian media mendukung HTTP Range (`206 Partial Content`) supaya video bisa di-seek.

Selain file lokal, editor juga menerima URL video dari YouTube, Vimeo, Google Drive, dan file `.mp4`/`.webm` langsung. URL embed dibentuk ulang di server; tidak ada unduhan atau transcoding. Google Drive harus dibagikan sebagai "Anyone with the link".

Struktur folder dipisah per jenis media agar mudah dikembangkan:

```text
storage/
  images/
    <uuid>.png   -> /api/media/images/<uuid>.png
  videos/
    <uuid>.mp4   -> /api/media/videos/<uuid>.mp4
```

Gambar lama yang sudah tersimpan di `public/uploads` tetap dapat diakses. Upload baru tidak lagi ditulis ke `public`.

Lokasi penyimpanan dapat diubah lewat environment variable `MEDIA_STORAGE_DIR` (path absolut atau relatif terhadap root project). Jika tidak diisi, default-nya `storage`. Folder jenis media (`images`, `videos`) dibuat otomatis di dalamnya.

Saat konten dihapus atau media dihapus dari konten, file media lokal ikut dibersihkan bila tidak dipakai konten lain. Media eksternal dan file lama di `public/uploads` tidak pernah dihapus oleh proses ini.

Upload yang dibatalkan sebelum konten disimpan juga dibersihkan. Form konten mencatat upload selama sesi edit, lalu meminta server menghapusnya saat media dibuang, konten disimpan, atau tab ditutup. Server hanya menghapus file yang tidak direferensikan konten mana pun. Permintaan cleanup tidak menahan redirect setelah konten disimpan.

Sebagai jaring pengaman, file media yang tidak direferensikan dan umurnya lebih dari 24 jam disapu otomatis (maksimal sekali per jam saat ada upload). Pembersihan manual dapat dijalankan dengan:

```bash
npm run media:cleanup
```

Perintah tersebut menerima argumen usia minimum dalam milidetik, misalnya `npm run media:cleanup -- 3600000` untuk file berumur lebih dari 1 jam.

Penyimpanan lokal sesuai untuk VPS atau server dengan disk persisten. Untuk serverless/multi-instance, ganti penyimpanan ini dengan object storage (S3-compatible, R2, MinIO, dan sejenisnya) karena filesystem lokal bisa tidak persisten atau tidak dibagi antar-instance.

Pastikan reverse proxy/web server mengizinkan request body sedikit lebih besar dari batas upload (5 MB untuk gambar, 100 MB untuk video).

## 5. URL

- Dashboard: `/dashboard`
- Create post: `/dashboard/create-post`
- Edit post: `/dashboard/edit-post/[id]`
- Categories: `/dashboard/create-categories`
- Public listing: `/post`
- Public detail: `/post/[slug]`
- Profil: `/profile`
- Layanan: `/services`
- Kontak: `/contact`
- Admin APIs: `/api/admin/posts`, `/api/admin/categories`, `/api/admin/media`
- Media publik: `/api/media/[...path]`
- Public API: `/api/posts`

## 6. Keamanan / perilaku penting

- Jangan menaruh query database privat ke client component.
- Seluruh API admin memanggil `requireStaff()` atau `requireAdmin()`; jangan hanya mengandalkan proteksi halaman.
- Editor hanya boleh mengedit/menghapus post miliknya; ADMIN dapat mengelola semua post.
- Kategori hanya dapat dikelola ADMIN.
- `UNLISTED` bukan konten rahasia. Siapa pun yang memiliki URL dapat membukanya. Gunakan autentikasi atau password protection bila konten harus rahasia.
- URL unlisted dikecualikan dari listing dan API publik serta diberi `noindex,nofollow`; ini bukan jaminan bahwa mesin pencari tidak pernah menemukan URL melalui sumber eksternal.
- Jangan menambahkan `export const runtime` atau `export const dynamic` ke route handler/page di project yang menggunakan `cacheComponents`.
- Server Component yang membaca data request-time menggunakan `await connection()` sebelum query, dan komponen pemanggilnya dibungkus Suspense jika perlu streaming.
- Jangan meng-cache response berdasarkan session atau konten privat sebagai shared cache.

## 7. Catatan integrasi

Paket ini dibuat sebagai patch karena source project penuh tidak disediakan. Import path mengikuti struktur yang sudah kita sepakati. Periksa kembali path Prisma Client dan fungsi auth pada project. Kode belum dapat dijalankan atau diuji terhadap database lokal project tanpa source project tersebut.

### Kategori awal (opsional, direkomendasikan)

Setelah migrasi, jalankan script kategori default:

```bash
npx tsx prisma/seed-categories.mjs
```

Script ini idempotent: menjalankan ulang tidak menimpa kategori yang sudah ada. Kategori awal: Berita, Pengumuman, Kegiatan, dan Lainnya. Tambahkan script package.json bila ingin mempersingkat:

```json
"db:seed-categories": "tsx prisma/seed-categories.mjs"
```
