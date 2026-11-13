export const siteConfig = {
  name: "Perpustakaan",

  description:
    "Website perpustakaan yang menyajikan informasi profil, layanan, berita, dan agenda perpustakaan.",

  keywords: [
    "perpustakaan",
    "website perpustakaan",
    "layanan perpustakaan",
    "berita perpustakaan",
    "agenda perpustakaan",
  ],

  locale: "id_ID",

  // Route gambar OpenGraph default (digenerate oleh app/opengraph-image.js).
  ogImagePath: "/opengraph-image",

  navigation: [
    {
      label: "Beranda",
      href: "/",
    },
    {
      label: "Profil",
      href: "/profile",
    },
    {
      label: "Layanan",
      href: "/services",
    },
    {
      label: "Post",
      href: "/post",
    },
    {
      label: "Kontak",
      href: "/contact",
    },
  ],
};
