import Link from "next/link";

import { formatDateLong, toDateAttribute } from "../../lib/format";

export default function PostCard({ post }) {
  const href = `/post/${post.slug}`;

  return (
    <article className="public-post-card">
      <Link
        href={href}
        className="public-post-link"
        aria-label={`Baca selengkapnya: ${post.title}`}
      >
        <div className="public-post-image-wrap">
          {post.coverImage ? (
            <img className="public-post-image" src={post.coverImage} alt="" loading="lazy" decoding="async" />
          ) : (
            <span className="public-post-image-placeholder">
              <i className="ri-newspaper-line" />
            </span>
          )}
        </div>

        <div className="public-post-body">
          {post.category && <span className="post-category-label">{post.category.name}</span>}

          <h2 className="public-post-title">{post.title}</h2>

          {post.excerpt && <p className="public-post-excerpt">{post.excerpt}</p>}

          <div className="public-post-meta">
            <span>
              <i className="ri-user-3-line" aria-hidden="true" />
              {post.author?.name || "Redaksi"}
            </span>

            {post.publishedAt && (
              <time dateTime={toDateAttribute(post.publishedAt)}>
                {formatDateLong(post.publishedAt)}
              </time>
            )}

            {post.readingMinutes ? (
              <span>
                <i className="ri-time-line" aria-hidden="true" />
                {post.readingMinutes} menit baca
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
