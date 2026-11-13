import { connection } from "next/server";

import { getLatestPublicPosts } from "../../lib/public-posts";
import PostCard from "./PostCard";
import PostSlider from "./PostSlider";

const LATEST_POST_LIMIT = 10;

export function LatestPostsFallback() {
  return (
    <div className="post-slider-fallback mt-8" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
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
  );
}

function EmptyLatestPosts() {
  return (
    <div className="surface-card mt-8 flex flex-col items-center px-5 py-14 text-center sm:py-20">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
        <i className="ri-newspaper-line" />
      </span>

      <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
        Informasi Segera Hadir
      </h3>

      <p className="mt-2 max-w-md text-sm leading-7 text-slate-500 dark:text-slate-400">
        Berita dan agenda terbaru perpustakaan akan ditampilkan di sini.
      </p>
    </div>
  );
}

export default async function LatestPosts() {
  // Daftar post harus mengikuti data terbaru, bukan hasil prerender statis.
  await connection();

  const posts = await getLatestPublicPosts(LATEST_POST_LIMIT);

  if (!posts.length) return <EmptyLatestPosts />;

  if (posts.length === 1) {
    return (
      <div className="mt-8 max-w-md">
        <PostCard post={posts[0]} />
      </div>
    );
  }

  return <PostSlider posts={posts} />;
}
