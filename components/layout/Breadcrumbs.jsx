import Link from "next/link";

export default function Breadcrumbs({ items = [], className = "" }) {
  if (!items.length) return null;

  return (
    <nav
      className={["breadcrumb", className].filter(Boolean).join(" ")}
      aria-label="Breadcrumb"
    >
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.href || "current"}-${index}`}
              className="breadcrumb-item"
            >
              {index > 0 && (
                <i
                  className="ri-arrow-right-s-line breadcrumb-separator"
                  aria-hidden="true"
                />
              )}

              {isLast || !item.href ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
