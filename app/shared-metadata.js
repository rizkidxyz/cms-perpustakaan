import { siteConfig } from "../config/site";

// Gambar OG default dipakai semua halaman. Route-nya digenerate oleh
// app/opengraph-image.js, jadi tidak butuh file aset di public/.
export const defaultOgImage = {
  url: siteConfig.ogImagePath,
  width: 1200,
  height: 630,
  alt: siteConfig.name,
};

// Metadata OpenGraph bersifat shallow merge: halaman yang mendefinisikan
// openGraph akan mengganti seluruh openGraph dari root layout. Karena itu
// semua field dasar dibangun ulang lewat helper ini.
export function createOpenGraph({
  title = siteConfig.name,
  description = siteConfig.description,
  url = "/",
  type = "website",
  images = [defaultOgImage],
  ...extra
} = {}) {
  return {
    type,
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title,
    description,
    url,
    images,
    ...extra,
  };
}

export function createTwitter({
  title = siteConfig.name,
  description = siteConfig.description,
  images = [defaultOgImage],
} = {}) {
  return {
    card: "summary_large_image",
    title,
    description,
    images,
  };
}
