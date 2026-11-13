"use client";

import toast from "react-hot-toast";

function buildAbsoluteUrl(path) {
  if (typeof window === "undefined") return "";
  return new URL(path, window.location.origin).toString();
}

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      const copied = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
}

export default function PostShare({ path, title }) {
  async function copyLink() {
    const copied = await writeClipboard(buildAbsoluteUrl(path));

    if (copied) {
      toast.success("Link berhasil disalin.");
    } else {
      toast.error("Gagal menyalin link. Salin manual dari address bar.");
    }
  }

  function shareWhatsApp() {
    const url = buildAbsoluteUrl(path);
    openExternal(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`);
  }

  function shareFacebook() {
    const url = buildAbsoluteUrl(path);
    openExternal(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
  }

  async function shareInstagram() {
    const url = buildAbsoluteUrl(path);

    // Instagram tidak punya URL share resmi. Di perangkat yang mendukung,
    // pakai share sheet bawaan agar Instagram muncul sebagai target.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    const copied = await writeClipboard(url);
    toast[copied ? "success" : "error"](
      copied
        ? "Link disalin. Tempel di Instagram."
        : "Gagal menyalin link. Salin manual dari address bar.",
    );
    openExternal("https://www.instagram.com/");
  }

  return (
    <div className="post-share">
      <span className="post-share-label">Bagikan</span>

      <div className="post-share-actions">
        <button
          type="button"
          className="post-share-button focus-ring"
          onClick={shareWhatsApp}
          aria-label="Bagikan ke WhatsApp"
        >
          <i className="ri-whatsapp-line" aria-hidden="true" />
          <span>WhatsApp</span>
        </button>

        <button
          type="button"
          className="post-share-button focus-ring"
          onClick={shareFacebook}
          aria-label="Bagikan ke Facebook"
        >
          <i className="ri-facebook-circle-line" aria-hidden="true" />
          <span>Facebook</span>
        </button>

        <button
          type="button"
          className="post-share-button focus-ring"
          onClick={shareInstagram}
          aria-label="Bagikan ke Instagram"
        >
          <i className="ri-instagram-line" aria-hidden="true" />
          <span>Instagram</span>
        </button>

        <button
          type="button"
          className="post-share-button focus-ring"
          onClick={copyLink}
          aria-label="Salin link halaman"
        >
          <i className="ri-link" aria-hidden="true" />
          <span>Salin link</span>
        </button>
      </div>
    </div>
  );
}
