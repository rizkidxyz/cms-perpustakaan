"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import toast from "react-hot-toast";

import {
  createTiptapExtensions,
  EMPTY_TIPTAP_DOCUMENT,
  normalizeImageLayout,
} from "../../lib/tiptap-extensions";
import { detectVideoSource } from "../../lib/video-url";
import VideoNodeView from "./VideoNodeView";

const EDITOR_EXTENSIONS = createTiptapExtensions().map((extension) =>
  extension.name === "video"
    ? extension.extend({
        addNodeView() {
          return ReactNodeViewRenderer(VideoNodeView);
        },
      })
    : extension,
);

// Kumpulkan video upload sesi ini yang masih ada di dokumen.
function collectStoredVideoUrls(node, urls = new Set()) {
  if (!node || typeof node !== "object") return urls;

  if (
    node.type === "video" &&
    typeof node.attrs?.src === "string" &&
    node.attrs.src.startsWith("/api/media/videos/")
  ) {
    urls.add(node.attrs.src);
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) collectStoredVideoUrls(child, urls);
  }

  return urls;
}
const FONTS = ["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Tahoma"];
const IMAGE_LAYOUT_OPTIONS = [
  { value: "left", label: "Gambar rata kiri", icon: "ri-align-left" },
  { value: "center", label: "Gambar rata tengah", icon: "ri-align-center" },
  { value: "right", label: "Gambar rata kanan", icon: "ri-align-right" },
  { value: "wrap-left", label: "Gambar di kiri, teks mengalir di kanan", icon: "ri-layout-left-2-line" },
  { value: "wrap-right", label: "Gambar di kanan, teks mengalir di kiri", icon: "ri-layout-right-2-line" },
];

function ToolButton({ label, icon, active = false, disabled = false, danger = false, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`editor-tool-button ${active ? "editor-tool-button-active" : ""} ${danger ? "editor-tool-button-danger" : ""}`}
    >
      <i className={icon} aria-hidden="true" />
    </button>
  );
}

export default function ContentEditor({ value, onChange, onMediaUploaded, onMediaDiscarded }) {
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const onMediaDiscardedRef = useRef(onMediaDiscarded);
  useEffect(() => {
    onMediaDiscardedRef.current = onMediaDiscarded;
  }, [onMediaDiscarded]);

  const videoUrlsRef = useRef(collectStoredVideoUrls(value || EMPTY_TIPTAP_DOCUMENT));

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: value || EMPTY_TIPTAP_DOCUMENT,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap-document",
        spellcheck: "true",
        "aria-label": "Editor konten artikel",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const json = currentEditor.getJSON();
      const nextVideoUrls = collectStoredVideoUrls(json);

      // Video upload yang dihapus dari dokumen langsung dibuang dari storage.
      for (const url of videoUrlsRef.current) {
        if (!nextVideoUrls.has(url)) onMediaDiscardedRef.current?.(url);
      }
      videoUrlsRef.current = nextVideoUrls;

      onChange?.(json);
    },
  });

  const imageState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor?.isActive("image")) return null;
      const attributes = currentEditor.getAttributes("image");
      return {
        layout: normalizeImageLayout(attributes.layout),
        width: Number(attributes.width) || 0,
        height: Number(attributes.height) || 0,
      };
    },
  });

  function setImageLayout(layout) {
    editor?.chain().focus().updateAttributes("image", { layout }).run();
  }

  async function uploadImage(file) {
    if (!file) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Upload gambar gagal.");

      onMediaUploaded?.(result.url);
      editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run();
      toast.success("Gambar berhasil diunggah.");
    } catch (error) {
      toast.error(error.message || "Upload gambar gagal.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function insertImageFromUrl() {
    const url = window.prompt("Masukkan URL gambar (HTTP/HTTPS):");
    if (!url) return;
    if (!/^https?:\/\//i.test(url.trim())) {
      toast.error("URL gambar harus diawali http:// atau https://.");
      return;
    }
    editor?.chain().focus().setImage({ src: url.trim() }).run();
  }

  async function uploadVideo(file) {
    if (!file) return;
    setUploadingVideo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media?type=videos", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Upload video gagal.");

      onMediaUploaded?.(result.url);
      editor
        ?.chain()
        .focus()
        .insertContent([
          {
            type: "video",
            attrs: { src: result.url, provider: "file", title: file.name },
          },
          { type: "paragraph" },
        ])
        .run();
      toast.success("Video berhasil diunggah.");
    } catch (error) {
      toast.error(error.message || "Upload video gagal.");
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  function insertVideoFromUrl() {
    const entered = window.prompt(
      "Masukkan URL video (YouTube, Vimeo, Google Drive, atau file .mp4/.webm):",
    );
    if (entered === null) return;

    const source = detectVideoSource(entered);
    if (!source) {
      toast.error(
        "URL video tidak dikenali. Gunakan link YouTube, Vimeo, Google Drive, atau file .mp4/.webm.",
      );
      return;
    }

    editor
      ?.chain()
      .focus()
      .insertContent([
        {
          type: "video",
          attrs: { ...source, title: source.provider === "file" ? "Video" : undefined },
        },
        { type: "paragraph" },
      ])
      .run();
  }

  function addLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href || "";
    const entered = window.prompt("Masukkan URL tautan:", previous);
    if (entered === null) return;
    const href = entered.trim();
    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|tel:|\/)/i.test(href) || href.startsWith("//")) {
      toast.error("Tautan harus menggunakan HTTP, HTTPS, mailto, tel, atau path internal.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href, target: "_blank" }).run();
  }

  if (!editor) {
    return <div className="editor-loading">Menyiapkan editor...</div>;
  }

  return (
    <div className="editor-shell">
      <div className="editor-toolbar" role="toolbar" aria-label="Format teks">
        <div className="editor-toolbar-group">
          <ToolButton label="Undo" icon="ri-arrow-go-back-line" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()} />
          <ToolButton label="Redo" icon="ri-arrow-go-forward-line" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()} />
        </div>

        <span className="editor-toolbar-divider" />

        <select
          aria-label="Gaya paragraf"
          className="editor-select editor-heading-select"
          value={editor.isActive("heading", { level: 1 }) ? "h1" : editor.isActive("heading", { level: 2 }) ? "h2" : editor.isActive("heading", { level: 3 }) ? "h3" : "p"}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "p") editor.chain().focus().setParagraph().run();
            else editor.chain().focus().toggleHeading({ level: Number(value.slice(1)) }).run();
          }}
        >
          <option value="p">Paragraf</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <select
          aria-label="Jenis huruf"
          className="editor-select editor-font-select"
          defaultValue="Arial"
          onChange={(event) => editor.chain().focus().setFontFamily(event.target.value).run()}
        >
          {FONTS.map((font) => <option key={font} value={font}>{font}</option>)}
        </select>

        <select
          aria-label="Ukuran huruf"
          className="editor-select editor-size-select"
          defaultValue="16px"
          onChange={(event) => editor.chain().focus().setFontSize(event.target.value).run()}
        >
          {["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>

        <span className="editor-toolbar-divider" />

        <ToolButton label="Bold" icon="ri-bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <ToolButton label="Italic" icon="ri-italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <ToolButton label="Underline" icon="ri-underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} />
        <ToolButton label="Strikethrough" icon="ri-strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <ToolButton label="Highlight" icon="ri-mark-pen-line" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef08a" }).run()} />

        <label className="editor-color-control" title="Warna teks">
          <i className="ri-font-color" aria-hidden="true" />
          <input aria-label="Warna teks" type="color" defaultValue="#0f172a" onChange={(event) => editor.chain().focus().setColor(event.target.value).run()} />
        </label>

        <span className="editor-toolbar-divider" />

        <ToolButton label="Rata kiri" icon="ri-align-left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <ToolButton label="Rata tengah" icon="ri-align-center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <ToolButton label="Rata kanan" icon="ri-align-right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />
        <ToolButton label="Rata kiri-kanan" icon="ri-align-justify" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} />

        <span className="editor-toolbar-divider" />

        <ToolButton label="Bullet list" icon="ri-list-unordered" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolButton label="Numbered list" icon="ri-list-ordered" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <ToolButton label="Blockquote" icon="ri-double-quotes-l" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        <ToolButton label="Code block" icon="ri-code-box-line" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />

        <span className="editor-toolbar-divider" />

        <ToolButton label="Tambah tautan" icon="ri-link" active={editor.isActive("link")} onClick={addLink} />
        <ToolButton label="Hapus tautan" icon="ri-link-unlink" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()} />
        <ToolButton label="Upload gambar" icon="ri-upload-2-line" disabled={uploading} onClick={() => fileInputRef.current?.click()} />
        <ToolButton label="Gambar dari URL" icon="ri-image-add-line" onClick={insertImageFromUrl} />
        <ToolButton label="Upload video" icon="ri-video-upload-line" disabled={uploadingVideo} onClick={() => videoInputRef.current?.click()} />
        <ToolButton label="Video dari URL" icon="ri-video-add-line" onClick={insertVideoFromUrl} />
        <ToolButton label="Sisipkan tabel" icon="ri-table-line" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
        <ToolButton label="Hapus tabel" icon="ri-delete-row" disabled={!editor.isActive("table")} onClick={() => editor.chain().focus().deleteTable().run()} />
      </div>

      {imageState && (
        <div className="editor-image-toolbar" role="toolbar" aria-label="Pengaturan gambar">
          <span className="editor-image-toolbar-label">
            <i className="ri-image-edit-line" aria-hidden="true" />
            Gambar terpilih
          </span>

          <div className="editor-image-toolbar-group">
            {IMAGE_LAYOUT_OPTIONS.map((option) => (
              <ToolButton
                key={option.value}
                label={option.label}
                icon={option.icon}
                active={imageState.layout === option.value}
                onClick={() => setImageLayout(option.value)}
              />
            ))}
          </div>

          <span className="editor-image-toolbar-size">
            {imageState.width ? `${imageState.width} × ${imageState.height || "?"} px` : "Ukuran asli"}
          </span>
          <span className="editor-image-toolbar-hint">Tarik sudut gambar untuk resize</span>

          <ToolButton
            label="Hapus gambar"
            icon="ri-delete-bin-line"
            danger
            onClick={() => {
              const src = editor.getAttributes("image").src;
              editor.chain().focus().deleteSelection().run();
              if (src) onMediaDiscarded?.(src);
            }}
          />
        </div>
      )}

      <div className="editor-table-actions">
        <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.isActive("table")}>+ Baris</button>
        <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.isActive("table")}>+ Kolom</button>
        <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.isActive("table")}>Hapus baris</button>
        <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.isActive("table")}>Hapus kolom</button>
        {uploading && <span className="editor-uploading"><i className="ri-loader-4-line ri-spin" /> Mengunggah gambar...</span>}
        {uploadingVideo && <span className="editor-uploading"><i className="ri-loader-4-line ri-spin" /> Mengunggah video...</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(event) => uploadImage(event.target.files?.[0])}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm"
        className="sr-only"
        onChange={(event) => uploadVideo(event.target.files?.[0])}
      />

      <EditorContent editor={editor} className="editor-content-area" />

      <div className="editor-footer">
        <span>{editor.getText().length} karakter</span>
        <span>Klik gambar/video untuk memilih; tarik sudut gambar untuk mengubah ukuran</span>
      </div>
    </div>
  );
}
