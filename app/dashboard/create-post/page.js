import { Suspense } from "react";

import PostForm from "../../../components/cms/PostForm";
import { prisma } from "../../../lib/prisma";
import { requireStaff } from "../../../lib/auth";

export const metadata = {
  title: "Buat Post",
  robots: { index: false, follow: false },
};

function CreateFallback() {
  return <div className="wrapper-page section-space"><div className="surface-card empty-content-state">Menyiapkan formulir...</div></div>;
}

async function CreateContent() {
  const user = await requireStaff();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <section className="wrapper-page section-space">
      <div className="cms-page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="content-page-title">Buat Post Baru</h1>
          <p className="content-page-description">Tulis konten dan tentukan cara publikasinya.</p>
        </div>
      </div>
      <PostForm initialCategories={categories} userRole={user.role} />
    </section>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={<CreateFallback />}>
      <CreateContent />
    </Suspense>
  );
}
