"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { siteConfig } from "../../config/site";

function isNavigationActive(pathname, href) {
  if (!pathname) return false;

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

// Satu renderer untuk navigasi utama dan fallback.
function NavigationMenu({ pathname, mobileOpen, onNavigate }) {
  const visibility = mobileOpen ? "flex" : "hidden";

  return (
    <nav
      id="primary-navigation"
      aria-label="Navigasi utama"
      className={[
        visibility,
        "absolute left-0 right-0 top-full z-50 flex-col gap-1",
        "rounded-b-2xl border border-t-0 border-slate-200 bg-white p-3 shadow-lg",
        "dark:border-slate-800 dark:bg-slate-950",
        "lg:static lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-center",
        "lg:gap-1 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
      ].join(" ")}
    >
      {siteConfig.navigation.map((item) => {
        const active = isNavigationActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={[
              "flex w-full items-center rounded-xl px-4 py-3",
              "text-sm font-medium whitespace-nowrap transition-colors",
              "hover:bg-emerald-50 hover:text-emerald-800",
              "dark:hover:bg-emerald-950 dark:hover:text-emerald-300",
              "lg:w-auto lg:justify-center lg:rounded-full lg:px-3.5 lg:py-2.5",
              active
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300"
                : "text-slate-600 dark:text-slate-300",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Fallback tidak membutuhkan usePathname.
export function NavLinksFallback({ mobileOpen, onNavigate }) {
  return (
    <NavigationMenu
      pathname={null}
      mobileOpen={mobileOpen}
      onNavigate={onNavigate}
    />
  );
}

// Satu-satunya komponen yang membaca pathname.
export default function NavLinks({ mobileOpen, onNavigate }) {
  const pathname = usePathname();

  return (
    <NavigationMenu
      pathname={pathname}
      mobileOpen={mobileOpen}
      onNavigate={onNavigate}
    />
  );
}
