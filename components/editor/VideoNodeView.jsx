"use client";

import { NodeViewWrapper } from "@tiptap/react";

import VideoPlayer from "../media/VideoPlayer";
import {
  VIDEO_PROVIDER_LABELS,
  normalizeVideoProvider,
} from "../../lib/video-url";

export default function VideoNodeView({ node, deleteNode, selected }) {
  const { src, provider, title, poster } = node.attrs;
  const normalizedProvider = normalizeVideoProvider(provider);

  return (
    <NodeViewWrapper
      className={`editor-video-block ${selected ? "editor-video-block-selected" : ""}`}
      contentEditable={false}
    >
      <div className="editor-video-head" data-drag-handle>
        <span className="editor-video-label">
          <i className="ri-film-line" aria-hidden="true" />
          {VIDEO_PROVIDER_LABELS[normalizedProvider]}
        </span>

        <button
          type="button"
          className="editor-video-remove"
          onClick={() => deleteNode()}
        >
          <i className="ri-delete-bin-line" aria-hidden="true" /> Hapus video
        </button>
      </div>

      <VideoPlayer
        provider={normalizedProvider}
        src={src}
        title={title}
        poster={poster}
      />
    </NodeViewWrapper>
  );
}
