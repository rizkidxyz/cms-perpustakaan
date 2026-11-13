import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";

import Breadcrumbs from "../../../components/layout/Breadcrumbs";
import PostShare from "../../../components/posts/PostShare";
import { getPublishedPostBySlug } from "../../../lib/public-posts";
import { renderSafeTiptapHtml } from "../../../lib/cms-content";
import { formatDateLong, toDateAttribute } from "../../../lib/format";
import { estimateReadingTime } from "../../../lib/reading-time";
import { createOpenGraph, createTwitter } from "../../shared-metadata";

export async function generateMetadata({ params }) {
  await connection();
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Konten Tidak Ditemukan",
      robots: { index: false, follow: false },
    };
  }

  const description = post.excerpt || `Artikel ${post.title}`;
  const postPath = `/post/${post.slug}`;
  const images = post.coverImage
    ? [{ url: post.coverImage, alt: post.title }]
    : undefined;

  const openGraph = createOpenGraph({
    type: "article",
    title: post.title,
    description,
    url: postPath,
    authors: [post.author.name],
  });

  if (images) openGraph.images = images;
  if (post.publishedAt) {
    openGraph.publishedTime = new Date(post.publishedAt).toISOString();
  }
  if (post.category?.name) openGraph.section = post.category.name;

  return {
    title: post.title,
    description,
    alternates: { canonical: postPath },
    openGraph,
    twitter: createTwitter({ title: post.title, description, images }),
    ...(post.visibility === "UNLISTED"
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

function buildBreadcrumbJsonLd(post) {
  const baseUrl = (process.env.APP_URL || "").replace(/\/+$/, "");
  const items = [
    { name: "Home", path: "/" },
    { name: "Post", path: "/post" },
    { name: post.title, path: `/post/${post.slug}` },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  };
}

function PostDetailFallback() {
  return (
    <article className="wrapper-page post-detail-page section-space" aria-busy="true">
      <div className="surface-card empty-content-state">
        <i className="ri-loader-4-line animate-spin" aria-hidden="true" />
        <p>Memuat konten...</p>
      </div>
    </article>
  );
}

async function PostDetail({ params }) {
  await connection();
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) notFound();

  const html = renderSafeTiptapHtml(post.content);
  const readingTime = estimateReadingTime(post.content);
  const postPath = `/post/${post.slug}`;
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(post);

  return (
    <article className="wrapper-page post-detail-page section-space">
      <Breadcrumbs
        className="mx-auto mb-8 max-w-3xl"
        items={[
          { label: "Home", href: "/" },
          { label: "Post", href: "/post" },
          { label: post.title },
        ]}
      />

      <div className="post-detail-header">
        {post.category && (
          <span className="post-category-label">{post.category.name}</span>
        )}

        <h1 className="post-detail-title">{post.title}</h1>

        <div className="post-meta">
          <span><i className="ri-user-3-line" /> {post.author.name}</span>
          {post.publishedAt && (
            <time dateTime={toDateAttribute(post.publishedAt)}>
              <i className="ri-calendar-line" />
              {formatDateLong(post.publishedAt)}
            </time>
          )}
          {readingTime && (
            <span>
              <i className="ri-time-line" />
              {readingTime.minutes} menit baca
            </span>
          )}
          {post.visibility === "UNLISTED" && (
            <span className="post-unlisted-label"><i className="ri-link" /> Unlisted</span>
          )}
        </div>

        {post.excerpt && <p className="post-detail-excerpt">{post.excerpt}</p>}

        <PostShare path={postPath} title={post.title} />
      </div>

      {post.coverImage && (
        <div className="post-cover-wrap">
          <img className="post-cover-image" src={post.coverImage} alt={post.title} />
        </div>
      )}

      <div className="post-content" dangerouslySetInnerHTML={{ __html: html }} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </article>
  );
}

export default function PublicPostPage({ params }) {
  return (
    <Suspense fallback={<PostDetailFallback />}>
      <PostDetail params={params} />
    </Suspense>
  );
}
