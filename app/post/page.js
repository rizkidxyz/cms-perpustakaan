import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";

import PostCard from "../../components/posts/PostCard";
import Breadcrumbs from "../../components/layout/Breadcrumbs";
import { getPublicPostList } from "../../lib/public-posts";
import {
  buildQueryString,
  normalizePublicFilters,
} from "../../lib/post-filters";
import { createOpenGraph, createTwitter } from "../shared-metadata";

const POST_LIST_DESCRIPTION =
  "Berita, pengumuman, dan kegiatan terbaru perpustakaan.";

export const metadata = {
  title: "Post",
  description: POST_LIST_DESCRIPTION,
  alternates: { canonical: "/post" },
  openGraph: createOpenGraph({
    title: "Post",
    description: POST_LIST_DESCRIPTION,
    url: "/post",
  }),
  twitter: createTwitter({
    title: "Post",
    description: POST_LIST_DESCRIPTION,
  }),
};

const PER_PAGE = 9;

// ========================================
// LOADING FALLBACK
// ========================================

function PostListFallback() {
  return (
    <section className="wrapper-page section-space">
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Home", href: "/" },
          { label: "Post" },
        ]}
      />

      <header className="content-page-header">
        <div className="skeleton-block mb-3 h-4 w-40" />
        <div className="skeleton-block h-10 w-72 max-w-full" />
        <div className="skeleton-block mt-4 h-4 w-full max-w-lg" />
      </header>

      <div className="surface-card filter-panel">
        <div className="skeleton-block h-12 w-full" />
      </div>

      <div className="public-post-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface-card overflow-hidden">
            <div className="skeleton-block aspect-[16/10] w-full rounded-none" />

            <div className="space-y-3 p-5">
              <div className="skeleton-block h-4 w-24" />
              <div className="skeleton-block h-6 w-full" />
              <div className="skeleton-block h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ========================================
// CONTENT
// ========================================

async function PostListContent({ searchParams }) {
  // Tunggu request masuk.
  await connection();

  const filters = normalizePublicFilters(await searchParams, {
    perPage: PER_PAGE,
  });
  const data = await getPublicPostList(filters);

  const hasFilters = Boolean(
    filters.q || filters.categorySlug || filters.sort === "lama",
  );

  function listHref({ page, kategori, urut } = {}) {
    return `/post${buildQueryString({
      q: filters.q,
      kategori: kategori === undefined ? filters.categorySlug : kategori,
      urut: (urut === undefined ? filters.sort === "lama" : urut === "lama")
        ? "lama"
        : "",
      page: page && page > 1 ? page : "",
    })}`;
  }

  return (
    <section className="wrapper-page section-space">
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Home", href: "/" },
          { label: "Post" },
        ]}
      />

      <header className="content-page-header">
        <p className="eyebrow">Informasi Perpustakaan</p>
        <h1 className="content-page-title">Post</h1>
        <p className="content-page-description">
          Berita, pengumuman, dan kegiatan terbaru perpustakaan.
        </p>
      </header>

      <div className="surface-card filter-panel">
        <form className="filter-form" action="/post" method="get">
          <div className="form-field">
            <label className="form-label" htmlFor="post-search">
              Cari konten
            </label>
            <input
              id="post-search"
              name="q"
              className="form-input"
              defaultValue={filters.q}
              maxLength={100}
              placeholder="Cari judul atau ringkasan..."
            />
          </div>

          <div className="form-field form-field-narrow">
            <label className="form-label" htmlFor="post-sort">
              Urutkan
            </label>
            <select
              id="post-sort"
              name="urut"
              className="form-select"
              defaultValue={filters.sort}
            >
              <option value="terbaru">Terbaru</option>
              <option value="lama">Terlama</option>
            </select>
          </div>

          {filters.categorySlug && (
            <input type="hidden" name="kategori" value={filters.categorySlug} />
          )}

          <div className="filter-submit">
            <button type="submit" className="button-primary">
              <i className="ri-search-line" /> Cari
            </button>
            {hasFilters && (
              <Link href="/post" className="button-secondary">
                Reset
              </Link>
            )}
          </div>
        </form>

        {data.categories.length > 0 && (
          <div className="filter-section">
            <span className="filter-label">Kategori</span>
            <div className="filter-chips">
              <Link
                href={listHref({ kategori: "" })}
                className={`category-chip ${filters.categorySlug ? "" : "category-chip-active"}`}
                aria-current={filters.categorySlug ? undefined : "page"}
              >
                Semua
              </Link>

              {data.categories.map((category) => {
                const active = filters.categorySlug === category.slug;
                return (
                  <Link
                    key={category.slug}
                    href={listHref({ kategori: active ? "" : category.slug })}
                    className={`category-chip ${active ? "category-chip-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {data.items.length ? (
        <>
          <p className="result-count">
            Menampilkan {data.items.length} dari {data.total} konten.
          </p>

          <div className="public-post-grid">
            {data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </>
      ) : (
        <div className="surface-card empty-content-state">
          <i
            className={hasFilters ? "ri-search-line" : "ri-newspaper-line"}
            aria-hidden="true"
          />
          <h2>
            {hasFilters
              ? "Tidak ada konten yang cocok"
              : "Belum tersedia konten"}
          </h2>
          <p>
            {hasFilters
              ? "Coba ubah kata kunci, kategori, atau urutan yang dipakai."
              : "Berita, pengumuman, dan agenda perpustakaan akan tampil di sini setelah diterbitkan."}
          </p>
          {hasFilters && (
            <Link href="/post" className="button-secondary">
              Reset filter
            </Link>
          )}
        </div>
      )}

      {data.pages > 1 && (
        <nav
          className="pagination"
          aria-label="Navigasi halaman berita dan agenda"
        >
          {data.page > 1 ? (
            <Link
              className="pagination-link"
              href={listHref({ page: data.page - 1 })}
            >
              <i className="ri-arrow-left-line" /> Sebelumnya
            </Link>
          ) : (
            <span
              className="pagination-link pagination-link-disabled"
              aria-hidden="true"
            >
              <i className="ri-arrow-left-line" /> Sebelumnya
            </span>
          )}

          <span className="pagination-status">
            Halaman {data.page} dari {data.pages}
          </span>

          {data.page < data.pages ? (
            <Link
              className="pagination-link"
              href={listHref({ page: data.page + 1 })}
            >
              Berikutnya <i className="ri-arrow-right-line" />
            </Link>
          ) : (
            <span
              className="pagination-link pagination-link-disabled"
              aria-hidden="true"
            >
              Berikutnya <i className="ri-arrow-right-line" />
            </span>
          )}
        </nav>
      )}
    </section>
  );
}

export default function PostListPage({ searchParams }) {
  return (
    <Suspense fallback={<PostListFallback />}>
      <PostListContent searchParams={searchParams} />
    </Suspense>
  );
}
