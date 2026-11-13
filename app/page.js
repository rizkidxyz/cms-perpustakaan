import Link from "next/link";
import { Suspense } from "react";

import AboutVisual from "../components/home/AboutVisual";
import HeroCardStack from "../components/home/HeroCardStack";
import HeroHeadline from "../components/home/HeroHeadline";
import HeroHighlight from "../components/home/HeroHighlight";
import LatestPosts, {
  LatestPostsFallback,
} from "../components/posts/LatestPosts";
import {
  aboutVisuals,
  heroHeadlines,
  heroIllustrations,
  leftRight,
} from "../config/home-content";
import { siteConfig } from "../config/site";
import { createOpenGraph, createTwitter } from "./shared-metadata";

const HOME_DESCRIPTION = `Selamat datang di ${siteConfig.name}. Temukan informasi, layanan, dan berbagai kegiatan perpustakaan.`;

export const metadata = {
  title: "Beranda",
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: createOpenGraph({
    title: "Beranda",
    description: HOME_DESCRIPTION,
    url: "/",
  }),
  twitter: createTwitter({
    title: "Beranda",
    description: HOME_DESCRIPTION,
  }),
};

const quickLinks = [
  {
    icon: "ri-building-2-line",
    title: "Profil Perpustakaan",
    description:
      "Kenali lebih dekat perpustakaan, sejarah, visi, dan misi kami.",
    href: "/profile",
  },
  {
    icon: "ri-customer-service-2-line",
    title: "Layanan",
    description: "Temukan berbagai informasi mengenai layanan perpustakaan.",
    href: "/services",
  },
  {
    icon: "ri-calendar-event-line",
    title: "Post",
    description: "Ikuti informasi terbaru, kegiatan, dan agenda perpustakaan.",
    href: "/post",
  },
];

export default function HomePage() {
  return (
    <>
      {/* =====================================
          HERO SECTION
      ===================================== */}

      <section className="relative isolate overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Background Decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-emerald-100/70 blur-3xl dark:bg-emerald-900/20"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-32 size-96 rounded-full bg-emerald-50 blur-3xl dark:bg-emerald-950/30"
        />

        <div className="wrapper-page relative">
          <div className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
            {/* Hero Content */}
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-400">
                <i className="ri-book-open-line text-base" />
                Ruang Literasi dan Pengetahuan
              </div>

              <HeroHeadline items={heroHeadlines} />

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8 dark:text-slate-400">
                Selamat datang di {siteConfig.name}. Temukan berbagai informasi,
                layanan, dan kegiatan perpustakaan sebagai ruang untuk belajar,
                membaca, dan mengembangkan wawasan.
              </p>

              {/* Hero Actions */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/services" className="button-primary focus-ring">
                  Jelajahi Layanan
                  <i className="ri-arrow-right-line text-lg" />
                </Link>

                <Link href="/profile" className="button-secondary focus-ring">
                  Tentang Kami
                </Link>
              </div>

              {/* Hero Note */}
              <div className="mt-10 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <i className="ri-book-mark-line text-lg" />
                </span>

                <span>Membaca, belajar, dan bertumbuh bersama.</span>
              </div>
            </div>

            {/* Hero Illustration */}
            <div className="relative mx-auto w-full max-w-lg">
              <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-100 via-white to-slate-100 p-5 shadow-sm sm:p-8 dark:border-emerald-900 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-950">
                {/* Decorative Circle */}
                <div className="absolute -right-16 -top-16 size-64 rounded-full border border-emerald-200/70 dark:border-emerald-800/50" />

                <div className="absolute -bottom-20 -left-20 size-64 rounded-full border border-emerald-200/70 dark:border-emerald-800/50" />

                <HeroCardStack images={heroIllustrations} />

                {/* Floating Card Left */}
                <div className="hero-float-card absolute left-0 top-[12%] z-40 w-56 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
                  <HeroHighlight
                    items={leftRight}
                    startOffset={0}
                    tone="emerald"
                  />
                </div>

                {/* Floating Card Right */}
                <div className="hero-float-card hero-float-card-delay absolute bottom-[10%] right-0 z-40 w-56 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-800/90">
                  <HeroHighlight
                    items={leftRight}
                    startOffset={2}
                    tone="amber"
                  />
                </div>

                {/* Bottom Decoration */}
                <p className="hero-stack-caption">READ · LEARN · GROW</p>
              </div>

              {/* Outside Decoration */}
              <div className="absolute -right-3 -top-3 -z-10 size-20 rounded-2xl bg-emerald-200/60 dark:bg-emerald-900/40" />

              <div className="absolute -bottom-3 -left-3 -z-10 size-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60" />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          QUICK LINKS
      ===================================== */}

      <section className="wrapper-page py-16 sm:py-20">
        <div className="mb-10 max-w-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
            Jelajahi Perpustakaan
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Semua Informasi dalam Satu Tempat
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Temukan informasi yang kamu butuhkan melalui berbagai halaman
            website kami.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="surface-card group flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg dark:hover:border-emerald-800"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl text-emerald-700 transition-colors group-hover:bg-emerald-700 group-hover:text-white dark:bg-emerald-950 dark:text-emerald-400">
                <i className={item.icon} />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-7 text-slate-500 dark:text-slate-400">
                {item.description}
              </p>

              <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Selengkapnya
                <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================
          ABOUT SECTION
      ===================================== */}

      <section className="bg-slate-50 dark:bg-slate-900/40">
        <div className="wrapper-page section-space">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            {/* About Visual */}
            <div className="relative">
              <div className="surface-card relative flex min-h-72 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-700 to-emerald-900 p-8 text-center sm:min-h-80 dark:from-emerald-950 dark:to-slate-900">
                <div className="about-visual-orb absolute -right-20 -top-20 size-64 rounded-full border border-white/10" />
                <div className="about-visual-orb about-visual-orb-delay absolute -bottom-24 -left-20 size-64 rounded-full border border-white/10" />

                <AboutVisual items={aboutVisuals} />

                <span className="relative mt-4 text-xs tracking-[0.2em] text-emerald-100">
                  KNOWLEDGE STARTS HERE
                </span>
              </div>
            </div>

            {/* About Content */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                Tentang Kami
              </p>

              <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Lebih dari Sekadar Tempat Membaca.
              </h2>

              <p className="mt-5 text-sm leading-8 text-slate-600 dark:text-slate-400">
                {siteConfig.name} hadir sebagai ruang untuk memperoleh
                informasi, memperluas wawasan, dan menumbuhkan budaya literasi.
              </p>

              <p className="mt-4 text-sm leading-8 text-slate-600 dark:text-slate-400">
                Kami percaya bahwa pengetahuan dapat membuka banyak kesempatan.
                Melalui perpustakaan, setiap orang memiliki ruang untuk terus
                belajar dan berkembang.
              </p>

              <div className="mt-8">
                <Link href="/profile" className="button-primary focus-ring">
                  Kenali Perpustakaan
                  <i className="ri-arrow-right-line text-lg" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          NEWS & AGENDA
      ===================================== */}

      <section className="wrapper-page section-space">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
              Informasi Terbaru
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Berita & Agenda
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Ikuti perkembangan informasi dan berbagai kegiatan terbaru dari
              perpustakaan.
            </p>
          </div>

          <Link
            href="/post"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Lihat Semua
            <i className="ri-arrow-right-line text-lg" />
          </Link>
        </div>

        <Suspense fallback={<LatestPostsFallback />}>
          <LatestPosts />
        </Suspense>
      </section>

      {/* =====================================
          CONTACT CTA
      ===================================== */}

      <section className="wrapper-page pb-16 sm:pb-20">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-emerald-800 px-6 py-12 sm:px-10 sm:py-16 dark:bg-emerald-950">
          {/* Background Decoration */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 size-80 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-20 size-80 rounded-full border border-white/10"
          />

          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                Hubungi Kami
              </p>

              <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                Ada yang Ingin Kamu Ketahui?
              </h2>

              <p className="mt-4 text-sm leading-7 text-emerald-100/80">
                Jangan ragu untuk menghubungi kami. Kami siap membantu
                memberikan informasi mengenai perpustakaan.
              </p>
            </div>

            <Link
              href="/contact"
              className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
            >
              Hubungi Kami
              <i className="ri-arrow-right-line text-lg" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
