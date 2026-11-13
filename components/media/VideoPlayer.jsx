import { normalizeVideoProvider } from "../../lib/video-url";

const EMBED_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

// Player video reusable: file/CDN memakai <video>, platform lain memakai iframe.
export default function VideoPlayer({
  provider = "file",
  src,
  title,
  poster,
  className = "",
}) {
  const normalizedProvider = normalizeVideoProvider(provider);
  if (!src) return null;

  const label = title || (normalizedProvider === "file" ? "Video" : "Video tersemat");

  return (
    <div
      className={`video-embed ${className}`.trim()}
      data-provider={normalizedProvider}
    >
      {normalizedProvider === "file" ? (
        <video
          src={src}
          controls
          preload="metadata"
          playsInline
          title={label}
          poster={poster || undefined}
        />
      ) : (
        <iframe
          src={src}
          title={label}
          loading="lazy"
          allow={EMBED_ALLOW}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
    </div>
  );
}
