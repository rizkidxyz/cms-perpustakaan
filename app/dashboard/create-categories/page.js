import { Suspense } from "react";

import CategoryManager from "../../../components/cms/CategoryManager";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";

export const metadata = {
  title: "Kategori Post",
  robots: { index: false, follow: false },
};

function CategoryFallback() {
  return <div className="wrapper-page section-space"><div className="surface-card empty-content-state">Memuat kategori...</div></div>;
}

async function CategoryContent() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, description: true, isActive: true, _count: { select: { posts: true } } },
  });

  return (
    <section className="wrapper-page section-space">
      <div className="cms-page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="content-page-title">Kategori Post</h1>
          <p className="content-page-description">Kelola kategori untuk mengelompokkan publikasi perpustakaan.</p>
        </div>
      </div>
      <CategoryManager initialCategories={categories} />
    </section>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<CategoryFallback />}>
      <CategoryContent />
    </Suspense>
  );
}
