"use client";

import { useState } from "react";
import toast from "react-hot-toast";

function toSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoryManager({ initialCategories = [] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setIsActive(true);
    setSlugTouched(false);
  }

  function editCategory(category) {
    setEditingId(category.id);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setIsActive(category.isActive !== false);
    setSlugTouched(true);
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const response = await fetch(editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ name, slug, description, isActive }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan kategori.");

      setCategories((current) => {
        const next = editingId
          ? current.map((item) => item.id === editingId ? { ...item, ...result.category } : item)
          : [...current, { ...result.category, _count: { posts: 0 } }];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });
      resetForm();
      toast.success(editingId ? "Kategori berhasil diperbarui." : "Kategori berhasil ditambahkan.");
    } catch (err) {
      toast.error(err.message || "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCategory(category) {
    if (!window.confirm(`Hapus kategori "${category.name}"? Konten terkait akan tetap ada tanpa kategori.`)) return;
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE", credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus kategori.");
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingId === category.id) resetForm();
      toast.success("Kategori berhasil dihapus.");
    } catch (err) {
      toast.error(err.message || "Gagal menghapus kategori.");
    }
  }

  return (
    <div className="cms-category-manager">
      <form className="surface-card cms-form-card cms-category-form" onSubmit={submit}>
        <div>
          <h2 className="cms-sidebar-title">{editingId ? "Edit Kategori" : "Tambah Kategori"}</h2>
          <p className="form-hint">Kategori digunakan untuk mengelompokkan berita, pengumuman, dan kegiatan.</p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="category-name">Nama kategori</label>
          <input
            id="category-name"
            className="form-input"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(toSlug(event.target.value));
            }}
            maxLength={100}
            required
            placeholder="Contoh: Berita"
          />
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="category-slug">Slug</label>
          <input
            id="category-slug"
            className="form-input"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(toSlug(event.target.value));
            }}
            maxLength={120}
            placeholder="berita"
          />
          <span className="cms-slug-preview">/post?kategori={slug || "slug-kategori"}</span>
          <p className="form-hint">Slug dipakai untuk filter kategori di halaman publik. Harus unik.</p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="category-description">Deskripsi (opsional)</label>
          <textarea
            id="category-description"
            className="form-textarea"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Deskripsi kategori..."
          />
          <p className="form-hint">{description.length}/500 karakter.</p>
        </div>

        <label className="form-check" htmlFor="category-active">
          <input
            id="category-active"
            type="checkbox"
            className="form-check-input"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          Kategori aktif dan bisa dipilih pada konten
        </label>

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={saving}>
            {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Kategori"}
          </button>
          {editingId && <button type="button" className="button-secondary" onClick={resetForm}>Batal</button>}
        </div>
      </form>

      <div className="surface-card cms-category-list">
        <div className="cms-category-list-heading">
          <h2 className="cms-sidebar-title">Daftar Kategori</h2>
          <span>{categories.length} kategori</span>
        </div>

        {categories.length ? categories.map((category) => (
          <div className="cms-category-row" key={category.id}>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong>{category.name}</strong>
                {category.isActive === false && <span className="cms-category-inactive">Nonaktif</span>}
              </div>
              <span className="cms-category-meta">/{category.slug} · {category._count?.posts ?? 0} konten</span>
              {category.description && <span className="cms-category-description">{category.description}</span>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className="cms-row-action" onClick={() => editCategory(category)}>Edit</button>
              <button type="button" className="cms-danger-action mt-0" onClick={() => removeCategory(category)}>Hapus</button>
            </div>
          </div>
        )) : (
          <div className="empty-content-state">
            <i className="ri-price-tag-3-line" aria-hidden="true" />
            <h2>Belum ada kategori</h2>
            <p>Buat kategori pertama untuk mengelompokkan konten.</p>
          </div>
        )}
      </div>
    </div>
  );
}
