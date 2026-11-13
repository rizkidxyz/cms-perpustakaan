import "server-only";

import { prisma } from "./prisma";
import { adminPostOrderBy, buildAdminPostWhere } from "./post-filters";

export const ADMIN_POST_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  visibility: true,
  updatedAt: true,
  publishedAt: true,
  category: { select: { id: true, name: true } },
  author: { select: { name: true } },
};

export async function getAdminPostList({ user, filters }) {
  const { page, perPage, ...rest } = filters;
  const where = buildAdminPostWhere(user, rest);

  const [items, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: ADMIN_POST_LIST_SELECT,
      orderBy: adminPostOrderBy(filters.sort),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getAdminCategoryOptions() {
  return prisma.category.findMany({
    select: { id: true, name: true, isActive: true },
    orderBy: { name: "asc" },
  });
}
