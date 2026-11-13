import Link from "next/link";

import { siteConfig } from "../../config/site";
import { Suspense } from "react";
import CurrentYear from "./CurrentYear";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrapper-page">
        <div className="footer-inner">
          {/* Footer Main */}
          <div className="footer-main">
            {/* Brand */}
            <div className="footer-brand">
              <Link
                href="/"
                className="site-brand focus-ring"
                aria-label={`${siteConfig.name} - Beranda`}
              >
                <span className="site-brand-mark">
                  <i className="ri-book-open-line" aria-hidden="true" />
                </span>

                <span className="site-brand-name">{siteConfig.name}</span>
              </Link>

              <p className="footer-description">
                Temukan informasi, koleksi, dan layanan perpustakaan dalam satu
                ruang digital.
              </p>
            </div>

            {/* Navigation */}
            <div className="footer-navigation">
              <h2 className="footer-heading">Navigasi</h2>

              <nav aria-label="Navigasi footer">
                <ul className="footer-links">
                  {siteConfig.navigation.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="footer-link">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Copyright */}
          <div className="footer-bottom">
            <p className="footer-copyright">
              &copy;
              <Suspense
                fallback={<span className="inline-block w-[4ch]">----</span>}
              >
                <CurrentYear />{" "}
              </Suspense>
              {siteConfig.name}. Seluruh hak cipta dilindungi.
            </p>

            <p className="footer-note">Membangun budaya literasi bersama.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
