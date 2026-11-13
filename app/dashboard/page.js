import Link from "next/link";
import { Suspense } from "react";

import CategoryManager from "../../components/cms/CategoryManager";
import DashboardTabs from "../../components/cms/DashboardTabs";
import LogoutButton from "../../components/auth/LogoutButton";
import { requireStaff } from "../../lib/auth";
import { getAdminCategoryOptions, getAdminPostList } from "../../lib/admin-posts";
import { formatDateMedium } from "../../lib/format";
import { buildQueryString, normalizeAdminFilters } from "../../lib/post-filters";
import { prisma } from "../../lib/prisma";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

function DashboardFallback() {
  return (
    <div className="wrapper-page section-space">
      <div className="surface-card empty-content-state">Memuat dashboard...</div>
    </div>
  );
}

async function getCategoryManagerItems() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      _count: { select: { posts: true } },
    },
  });
}

function PostsPanel({ data, filters, categories, hasFilters, pageHref }) {
  return (
    <>
      <div className="surface-card filter-panel">
        <form className="filter-form" action="/dashboard" method="get">
          <div className="form-field">
            <label className="form-label" htmlFor="admin-search">Cari konten</label>
            <input id="admin-search" name="q" className="form-input" defaultValue={filters.q} maxLength={100} placeholder="Cari judul atau slug..." />
          </div>

          <div className="form-field form-field-narrow">
            <label className="form-label" htmlFor="admin-status">Status</label>
            <select id="admin-status" name="status" className="form-select" defaultValue={filters.status}>
              <option value="">Semua status</option>
              <option value="PUBLISHED">Terbit</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div className="form-field form-field-narrow">
            <label className="form-label" htmlFor="admin-category">Kategori</label>
            <select id="admin-category" name="kategoriId" className="form-select" defaultValue={filters.categoryId}>
              <option value="">Semua kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}{category.isActive ? "" : " (nonaktif)"}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field form-field-narrow">
            <label className="form-label" htmlFor="admin-sort">Urutkan</label>
            <select id="admin-sort" name="urut" className="form-select" defaultValue={filters.sort}>
              <option value="terbaru">Terbaru diperbarui</option>
              <option value="lama">Terlama diperbarui</option>
            </select>
          </div>

          <div className="filter-submit">
            <button type="submit" className="button-primary"><i className="ri-search-line" /> Cari</button>
            {hasFilters && <Link href="/dashboard" className="button-secondary">Reset</Link>}
          </div>
        </form>
      </div>

      <div className="surface-card cms-list-card">
        {data.items.length ? (
          <>
            <p className="result-count px-5 pt-5">
              Menampilkan {data.items.length} dari {data.total} konten.
            </p>

            <div className="cms-table-wrap">
              <table className="cms-table">
                <thead><tr><th>Konten</th><th>Kategori</th><th>Status</th><th>Visibilitas</th><th>Diperbarui</th><th>Aksi</th></tr></thead>
                <tbody>
                  {data.items.map((post) => (
                    <tr key={post.id}>
                      <td><div className="cms-table-title">{post.title}</div><div className="cms-table-slug">/post/{post.slug}</div></td>
                      <td>{post.category?.name || "—"}</td>
                      <td><span className={`cms-status-badge ${post.status === "PUBLISHED" ? "is-published" : "is-draft"}`}>{post.status === "PUBLISHED" ? "Terbit" : "Draft"}</span></td>
                      <td>{post.visibility === "UNLISTED" ? "Unlisted" : "Publik"}</td>
                      <td>{formatDateMedium(post.updatedAt)}</td>
                      <td><Link className="cms-row-action" href={`/dashboard/edit-post/${post.id}`}>Edit <i className="ri-arrow-right-line" /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty-content-state">
            <i className={hasFilters ? "ri-search-line" : "ri-file-edit-line"} />
            <h2>{hasFilters ? "Tidak ada konten yang cocok" : "Belum ada konten"}</h2>
            <p>{hasFilters ? "Coba ubah kata kunci atau filter yang dipakai." : "Mulai buat berita, pengumuman, atau kegiatan pertama."}</p>
            {hasFilters
              ? <Link href="/dashboard" className="button-secondary">Reset filter</Link>
              : <Link href="/dashboard/create-post" className="button-primary">Buat Post</Link>}
          </div>
        )}
      </div>

      {data.pages > 1 && (
        <nav className="pagination" aria-label="Navigasi halaman konten">
          {data.page > 1
            ? <Link className="pagination-link" href={pageHref(data.page - 1)}><i className="ri-arrow-left-line" /> Sebelumnya</Link>
            : <span className="pagination-link pagination-link-disabled" aria-hidden="true"><i className="ri-arrow-left-line" /> Sebelumnya</span>}

          <span className="pagination-status">Halaman {data.page} dari {data.pages}</span>

          {data.page < data.pages
            ? <Link className="pagination-link" href={pageHref(data.page + 1)}>Berikutnya <i className="ri-arrow-right-line" /></Link>
            : <span className="pagination-link pagination-link-disabled" aria-hidden="true">Berikutnya <i className="ri-arrow-right-line" /></span>}
        </nav>
      )}
    </>
  );
}

async function DashboardContent({ searchParams }) {
  const user = await requireStaff();
  const filters = normalizeAdminFilters(await searchParams);

  const [data, categories, categoryItems] = await Promise.all([
    getAdminPostList({ user, filters }),
    getAdminCategoryOptions(),
    user.role === "ADMIN" ? getCategoryManagerItems() : Promise.resolve([]),
  ]);

  const hasFilters = Boolean(filters.q || filters.status || filters.categoryId);
  const activeParams = {
    q: filters.q,
    status: filters.status,
    kategoriId: filters.categoryId,
    urut: filters.sort === "lama" ? "lama" : "",
  };
  const pageHref = (page) => `/dashboard${buildQueryString({ ...activeParams, page: page > 1 ? page : "" })}`;

  return (
    <section className="wrapper-page section-space">
      <div className="cms-page-heading">
        <div>
          <p className="eyebrow">Administrator Panel</p>
          <h1 className="content-page-title">Dashboard</h1>
          <p className="content-page-description">Kelola postingan dan kategori publikasi perpustakaan.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === "ADMIN" && (
            <Link href="/dashboard/create-categories" className="button-secondary">
              <i className="ri-price-tag-3-line" /> Kategori
            </Link>
          )}
          <Link href="/dashboard/create-post" className="button-primary">
            <i className="ri-add-line" /> Buat Post
          </Link>
          <LogoutButton />
        </div>
      </div>

      <DashboardTabs
        canManageCategories={user.role === "ADMIN"}
        posts={
          <PostsPanel
            data={data}
            filters={filters}
            categories={categories}
            hasFilters={hasFilters}
            pageHref={pageHref}
          />
        }
        categories={<CategoryManager initialCategories={categoryItems} />}
      />
    </section>
  );
}

export default function DashboardPage({ searchParams }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent searchParams={searchParams} />
    </Suspense>
  );
}
