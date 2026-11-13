import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import PostForm from "../../../../components/cms/PostForm";
import { prisma } from "../../../../lib/prisma";
import { requireStaff } from "../../../../lib/auth";

export const metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

function EditFallback() {
  return <div className="wrapper-page section-space"><div className="surface-card empty-content-state">Memuat konten...</div></div>;
}

async function EditContent({ id }) {
  const user = await requireStaff();
  const [post, categories] = await prisma.$transaction([
    prisma.post.findUnique({ where: { id } }),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true, slug: true, isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();
  if (user.role !== "ADMIN" && post.authorId !== user.id) redirect("/dashboard");

  return (
    <section className="wrapper-page section-space">
      <div className="cms-page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="content-page-title">Edit Post</h1>
          <p className="content-page-description">Perbarui informasi dan publikasi konten.</p>
        </div>
      </div>
      <PostForm initialPost={post} initialCategories={categories} userRole={user.role} />
    </section>
  );
}

async function EditContentBoundary({ params }) {
  const { id } = await params;
  return <EditContent id={id} />;
}

export default function EditPostPage({ params }) {
  return (
    <Suspense fallback={<EditFallback />}>
      <EditContentBoundary params={params} />
    </Suspense>
  );
}
