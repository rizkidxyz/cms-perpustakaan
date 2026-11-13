import Link from "next/link";

export const metadata = {
  title: "Halaman Tidak Ditemukan",
  description: "Halaman yang kamu cari tidak tersedia.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="not-found-page">
      {/* Background Decoration */}
      <div className="not-found-glow not-found-glow-top" aria-hidden="true" />

      <div
        className="not-found-glow not-found-glow-bottom"
        aria-hidden="true"
      />

      <div className="wrapper-page">
        <div className="not-found-content">
          {/* Illustration */}
          <div className="not-found-illustration">
            <i className="ri-book-open-line" aria-hidden="true" />

            <span className="not-found-question">?</span>
          </div>

          {/* Error Code */}
          <p className="not-found-code">ERROR 404</p>

          {/* Heading */}
          <h1 className="not-found-title">
            Halaman Tidak
            <span className="not-found-highlight">Ditemukan</span>
          </h1>

          {/* Description */}
          <p className="not-found-description">
            Sepertinya halaman yang kamu cari tidak tersedia, telah dipindahkan,
            atau alamat yang dimasukkan tidak benar. Jangan khawatir, masih
            banyak informasi menarik di perpustakaan yang bisa kamu jelajahi.
          </p>

          {/* Actions */}
          <div className="not-found-actions">
            <Link href="/" className="button-primary focus-ring">
              <i className="ri-home-5-line" aria-hidden="true" />
              Kembali ke Beranda
            </Link>

            <Link href="/contact" className="button-secondary focus-ring">
              <i className="ri-mail-line" aria-hidden="true" />
              Hubungi Kami
            </Link>
          </div>

          {/* Footer Note */}
          <p className="not-found-note">
            Butuh bantuan? Silakan hubungi pengelola perpustakaan.
          </p>
        </div>
      </div>
    </section>
  );
}
