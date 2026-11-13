"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

import ContentEditor from "../editor/ContentEditor";
import { EMPTY_TIPTAP_DOCUMENT } from "../../lib/tiptap-extensions";

function makeSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

const CONTENT_LIST_PATH = "/dashboard";

// router.replace() saja cukup; router.refresh() setelahnya bisa memicu race
// pada route dinamis di Next.js 16.4.x sehingga navigasi tidak terjadi.
// Fallback hard navigation menjaga UX kalau navigasi client-side tetap no-op.
function navigateToContentList(router) {
  router.replace(CONTENT_LIST_PATH);

  window.setTimeout(() => {
    if (window.location.pathname !== CONTENT_LIST_PATH) {
      // Fallback sengaja memakai hard navigation agar tidak terjebak bug
      // navigasi client-side; router.replace sudah dicoba lebih dulu.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(CONTENT_LIST_PATH);
    }
  }, 700);
}

export default function PostForm({ initialPost = null, initialCategories = [], userRole = "EDITOR" }) {
  const router = useRouter();
  const coverInputRef = useRef(null);
  const pendingUploadsRef = useRef(new Set());
  const isEdit = Boolean(initialPost?.id);

  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [categoryId, setCategoryId] = useState(initialPost?.categoryId || "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage || "");
  const [content, setContent] = useState(initialPost?.content || EMPTY_TIPTAP_DOCUMENT);
  const [visibility, setVisibility] = useState(initialPost?.visibility || "PUBLIC");
  const [categories, setCategories] = useState(initialCategories);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");

  const estimatedWords = useMemo(() => {
    function collect(node, parts) {
      if (node?.type === "text" && node.text) parts.push(node.text);
      if (Array.isArray(node?.content)) node.content.forEach((child) => collect(child, parts));
    }
    const parts = [];
    collect(content, parts);
    return parts.join(" ").trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  function trackUpload(url) {
    if (typeof url === "string" && url) pendingUploadsRef.current.add(url);
  }

  // Minta server menghapus upload sesi ini yang tidak dipakai konten mana pun.
  function discardUploads(urls) {
    const list = [...new Set(urls)].filter(
      (url) => typeof url === "string" && pendingUploadsRef.current.has(url),
    );
    if (!list.length) return Promise.resolve();

    for (const url of list) pendingUploadsRef.current.delete(url);

    return fetch("/api/admin/media/cleanup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ urls: list }),
    }).catch(() => {});
  }

  // Jaring pengaman saat tab ditutup/di-refresh tanpa menyimpan.
  useEffect(() => {
    function handlePageHide() {
      const urls = [...pendingUploadsRef.current];
      if (!urls.length) return;

      fetch("/api/admin/media/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        keepalive: true,
        body: JSON.stringify({ urls }),
      }).catch(() => {});
    }

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  function handleTitleChange(value) {
    setTitle(value);
    if (!slugTouched) setSlug(makeSlug(value));
  }

  async function createCategory(event) {
    event.preventDefault();
    if (userRole !== "ADMIN" || isCategorySaving) return;

    const categoryName = newCategoryName.trim();
    if (categoryName.length < 2) {
      toast.error("Nama kategori minimal 2 karakter.");
      return;
    }

    setIsCategorySaving(true);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name: categoryName, slug: newCategorySlug || makeSlug(categoryName) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal membuat kategori.");
      setCategories((current) => [...current, result.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(result.category.id);
      setNewCategoryName("");
      setNewCategorySlug("");
      setShowCategoryForm(false);
      toast.success("Kategori berhasil ditambahkan.");
    } catch (err) {
      toast.error(err.message || "Gagal membuat kategori.");
    } finally {
      setIsCategorySaving(false);
    }
  }

  async function uploadCover(file) {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", credentials: "same-origin", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload sampul gagal.");
      const previous = coverImage;
      if (previous && previous !== result.url) {
        discardUploads([previous]);
      }
      trackUpload(result.url);
      setCoverImage(result.url);
      toast.success("Gambar sampul berhasil diunggah.");
    } catch (err) {
      toast.error(err.message || "Upload sampul gagal.");
    } finally {
      setIsUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function save(status) {
    if (isSaving) return;
    setIsSaving(true);
    let navigating = false;

    const payload = {
      title,
      slug,
      excerpt,
      categoryId: categoryId || null,
      coverImage: coverImage || null,
      content,
      status,
      visibility,
    };

    try {
      const response = await fetch(isEdit ? `/api/admin/posts/${initialPost.id}` : "/api/admin/posts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan konten.");

      // Upload yang tidak jadi dipakai dibersihkan tanpa menahan redirect.
      // keepalive pada request membuat cleanup tetap terkirim saat halaman
      // langsung ditinggal.
      discardUploads([...pendingUploadsRef.current]);

      toast.success(result.message || "Konten berhasil disimpan.");
      navigating = true;
      navigateToContentList(router);
    } catch (err) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      if (!navigating) setIsSaving(false);
    }
  }

  function removeCover() {
    const current = coverImage;
    setCoverImage("");
    if (current) discardUploads([current]);
  }

  async function deleteCurrentPost() {
    if (!isEdit || isSaving) return;
    if (!window.confirm("Yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/posts/${initialPost.id}`, { method: "DELETE", credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus konten.");
      toast.success("Konten berhasil dihapus.");
      navigateToContentList(router);
    } catch (err) {
      toast.error(err.message || "Gagal menghapus konten.");
      setIsSaving(false);
    }
  }

  return (
    <div className="cms-form-layout">
      <div className="cms-form-main">
        <div className="surface-card cms-form-card">
          <label className="form-label" htmlFor="post-title">Judul konten</label>
          <input id="post-title" className="form-input cms-title-input" value={title} onChange={(event) => handleTitleChange(event.target.value)} maxLength={180} placeholder="Tulis judul konten..." required />

          <label className="form-label" htmlFor="post-slug">Slug / URL</label>
          <div className="cms-slug-field">
            <span>/post/</span>
            <input id="post-slug" className="form-input" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(makeSlug(event.target.value)); }} maxLength={160} placeholder="judul-konten" />
          </div>
          <p className="form-hint">Slug harus unik. Perubahan slug dapat membuat tautan lama tidak berlaku.</p>

          <label className="form-label" htmlFor="post-excerpt">Ringkasan</label>
          <textarea id="post-excerpt" className="form-textarea" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} maxLength={500} rows={3} placeholder="Ringkasan singkat untuk daftar berita (opsional)..." />
          <p className="form-hint">{excerpt.length}/500 karakter. Kosongkan jika tidak perlu; ringkasan tidak diambil otomatis dari isi konten.</p>
        </div>

        <section className="cms-editor-section">
          <div className="cms-section-heading">
            <div>
              <h2>Isi Konten</h2>
              <p>Tulis dan format artikel menggunakan editor.</p>
            </div>
            <span>{estimatedWords} kata</span>
          </div>
          <ContentEditor
            value={content}
            onChange={setContent}
            onMediaUploaded={trackUpload}
            onMediaDiscarded={(url) => discardUploads([url])}
          />
        </section>
      </div>

      <aside className="cms-form-sidebar">
        <div className="surface-card cms-sidebar-card">
          <h2 className="cms-sidebar-title">Publikasi</h2>
          <label className="form-label" htmlFor="post-visibility">Visibilitas saat diterbitkan</label>
          <select id="post-visibility" className="form-select" value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="PUBLIC">Publik — tampil di daftar berita</option>
            <option value="UNLISTED">Unlisted — hanya melalui link</option>
          </select>
          <p className="form-hint">Unlisted dapat dibuka siapa saja yang memiliki URL, tetapi tidak dimunculkan di listing publik dan diberi noindex.</p>

          <div className="cms-action-stack">
            <button type="button" className="button-secondary button-block" disabled={isSaving || isUploading} onClick={() => save("DRAFT")}>
              <i className="ri-save-line" /> {isSaving ? "Menyimpan..." : "Simpan sebagai Draft"}
            </button>
            <button type="button" className="button-primary button-block" disabled={isSaving || isUploading} onClick={() => save("PUBLISHED")}>
              <i className="ri-send-plane-line" /> {isSaving ? "Memproses..." : initialPost?.status === "PUBLISHED" ? "Simpan & Terbitkan" : "Terbitkan Konten"}
            </button>
          </div>
        </div>

        <div className="surface-card cms-sidebar-card">
          <div className="cms-sidebar-heading-row">
            <h2 className="cms-sidebar-title">Kategori</h2>
            {userRole === "ADMIN" && (
              <button
                type="button"
                className="cms-text-action"
                aria-expanded={showCategoryForm}
                aria-controls="inline-category-form"
                onClick={() => setShowCategoryForm((current) => !current)}
              >
                {showCategoryForm ? "Tutup" : "+ Tambah"}
              </button>
            )}
          </div>
          <label className="form-label" htmlFor="post-category">Pilih kategori</label>
          <select id="post-category" className="form-select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Tanpa kategori</option>
            {categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          {userRole !== "ADMIN" && <p className="form-hint">Hubungi administrator untuk menambah kategori.</p>}

          {showCategoryForm && (
            <form id="inline-category-form" className="cms-inline-form" onSubmit={createCategory}>
              <label className="form-label" htmlFor="new-category-name">Nama kategori baru</label>
              <input
                id="new-category-name"
                className="form-input"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                maxLength={100}
                required
                placeholder="Contoh: Agenda"
              />
              <label className="form-label" htmlFor="new-category-slug">Slug</label>
              <input
                id="new-category-slug"
                className="form-input"
                value={newCategorySlug}
                onChange={(event) => setNewCategorySlug(makeSlug(event.target.value))}
                maxLength={120}
                placeholder="otomatis dari nama"
              />
              <div className="form-actions">
                <button type="submit" className="button-primary" disabled={isCategorySaving}>
                  {isCategorySaving ? "Menyimpan..." : "Simpan"}
                </button>
                <button type="button" className="button-secondary" onClick={() => setShowCategoryForm(false)}>Batal</button>
              </div>
            </form>
          )}
        </div>

        <div className="surface-card cms-sidebar-card">
          <h2 className="cms-sidebar-title">Gambar Sampul</h2>
          {coverImage ? (
            <div className="cms-cover-preview-wrap">
              <img className="cms-cover-preview" src={coverImage} alt="Preview gambar sampul" />
              <button type="button" className="cms-remove-cover" onClick={removeCover}>Hapus gambar</button>
            </div>
          ) : (
            <div className="cms-cover-empty"><i className="ri-image-add-line" /><span>Belum ada gambar sampul</span></div>
          )}
          <label className="form-label" htmlFor="cover-url">URL gambar</label>
          <input id="cover-url" className="form-input" type="url" value={coverImage.startsWith("/") ? "" : coverImage} onChange={(event) => setCoverImage(event.target.value)} placeholder="https://example.com/gambar.jpg" />
          <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => uploadCover(event.target.files?.[0])} />
          <button type="button" className="button-secondary button-block mt-3" disabled={isUploading || isSaving} onClick={() => coverInputRef.current?.click()}>
            <i className="ri-upload-2-line" /> {isUploading ? "Mengunggah..." : "Upload dari perangkat"}
          </button>
          <p className="form-hint">JPEG, PNG, WEBP, atau GIF. Maksimal 5 MB.</p>
        </div>

        {isEdit && (
          <div className="surface-card cms-sidebar-card">
            <h2 className="cms-sidebar-title">Informasi</h2>
            <p className="form-hint">Status saat ini: <strong>{initialPost.status}</strong></p>
            <button type="button" className="cms-danger-action" disabled={isSaving} onClick={deleteCurrentPost}>Hapus konten</button>
          </div>
        )}

        <Link href="/dashboard" className="cms-back-link"><i className="ri-arrow-left-line" /> Kembali ke daftar konten</Link>
      </aside>
    </div>
  );
}
