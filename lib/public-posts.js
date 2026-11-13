import "server-only";

import { cache } from "react";
import { prisma } from "./prisma";
import { extractFirstParagraphText } from "./cms-content";
import { buildPublicPostWhere, publicPostOrderBy } from "./post-filters";
import { estimateReadingTime } from "./reading-time";

export const LATEST_POSTS_LIMIT = 10;

const PUBLIC_POST_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImage: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
  author: { select: { name: true } },
};

// Ringkasan kartu: pakai excerpt asli, atau paragraf pertama konten.
// Waktu baca dihitung di server agar konten penuh tidak dikirim ke client.
function toPostCard({ content, ...post }) {
  return {
    ...post,
    excerpt: post.excerpt?.trim() || extractFirstParagraphText(content) || null,
    readingMinutes: estimateReadingTime(content)?.minutes ?? null,
  };
}

export const getPublishedPostBySlug = cache(async (slug) => {
  return prisma.post.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      visibility: { in: ["PUBLIC", "UNLISTED"] },
      publishedAt: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      visibility: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
      author: { select: { name: true } },
    },
  });
});

export async function getPublicPostList({
  page = 1,
  perPage = 12,
  categorySlug = "",
  q = "",
  sort = "terbaru",
} = {}) {
  const where = buildPublicPostWhere({ q, categorySlug });

  const [posts, total, categories] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: PUBLIC_POST_CARD_SELECT,
      orderBy: publicPostOrderBy(sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({
      where: {
        isActive: true,
        posts: {
          some: {
            status: "PUBLISHED",
            visibility: "PUBLIC",
            publishedAt: { not: null },
          },
        },
      },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    items: posts.map(toPostCard),
    total,
    categories,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

// Maksimal 10 post terbaru untuk slider di homepage.
export const getLatestPublicPosts = cache(async (limit = LATEST_POSTS_LIMIT) => {
  const parsed = Number.parseInt(limit, 10);
  const take = Math.min(Math.max(Number.isFinite(parsed) ? parsed : LATEST_POSTS_LIMIT, 1), LATEST_POSTS_LIMIT);

  const posts = await prisma.post.findMany({
    where: buildPublicPostWhere(),
    select: PUBLIC_POST_CARD_SELECT,
    orderBy: publicPostOrderBy("terbaru"),
    take,
  });

  return posts.map(toPostCard);
});
