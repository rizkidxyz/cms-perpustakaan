"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { siteConfig } from "../../config/site";
import NavLinks, { NavLinksFallback } from "./NavLinks";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      closeMenu();
    }
  }

  return (
    <header className="site-header" onKeyDown={handleKeyDown}>
      <div className="wrapper-page">
        <div className="navbar-inner relative">
          {/* Brand */}
          <Link
            href="/"
            className="site-brand focus-ring"
            onClick={closeMenu}
            aria-label={`${siteConfig.name} - Beranda`}
          >
            <span className="site-brand-mark">
              <i className="ri-book-open-line" aria-hidden="true" />
            </span>

            <span className="site-brand-name">{siteConfig.name}</span>
          </Link>

          {/* Navigation: satu komponen untuk semua viewport */}
          <Suspense
            fallback={
              <NavLinksFallback
                mobileOpen={isMenuOpen}
                onNavigate={closeMenu}
              />
            }
          >
            <NavLinks mobileOpen={isMenuOpen} onNavigate={closeMenu} />
          </Suspense>

          {/* Actions */}
          <div className="navbar-actions">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-toggle focus-ring"
              aria-label="Ganti tema terang atau gelap"
              title="Ganti tema"
            >
              <i className="ri-contrast-2-line" aria-hidden="true" />
            </button>

            {/* Mobile Toggle */}
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="mobile-menu-button focus-ring"
              aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={isMenuOpen}
              aria-controls="primary-navigation"
            >
              <i
                className={isMenuOpen ? "ri-close-line" : "ri-menu-3-line"}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
