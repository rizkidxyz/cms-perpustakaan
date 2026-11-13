import "./globals.css";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import ScrollToTop from "../components/layout/ScrollToTop";
import ThemeProvider from "../components/providers/ThemeProvider";
import ToastProvider from "../components/providers/ToastProvider";

import { siteConfig } from "../config/site";
import { createOpenGraph, createTwitter } from "./shared-metadata";

export const metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),

  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },

  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,

  openGraph: createOpenGraph(),
  twitter: createTwitter(),

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <Navbar />

          <main id="main-content" className="w-full min-w-0 flex-1">
            {children}
          </main>

          <Footer />
          <ToastProvider />
          <ScrollToTop />
        </ThemeProvider>
      </body>
    </html>
  );
}
