import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";

import { VideoNode } from "./tiptap-video";

export const IMAGE_LAYOUTS = ["left", "center", "right", "wrap-left", "wrap-right"];
export const DEFAULT_IMAGE_LAYOUT = "center";

export function normalizeImageLayout(value) {
  return IMAGE_LAYOUTS.includes(value) ? value : DEFAULT_IMAGE_LAYOUT;
}

// Keep this extension list identical on the editor and server renderer.
export function createTiptapExtensions() {
  const ContentImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        layout: {
          default: DEFAULT_IMAGE_LAYOUT,
          parseHTML: (element) => normalizeImageLayout(element.getAttribute("data-layout")),
          renderHTML: (attributes) => ({ "data-layout": normalizeImageLayout(attributes.layout) }),
        },
      };
    },
  });

  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
        },
      },
    }),
    TextStyleKit,
    Highlight.configure({ multicolor: true }),
    ContentImage.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        loading: "lazy",
        decoding: "async",
      },
      resize: {
        enabled: true,
        directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
        minWidth: 96,
        minHeight: 96,
        alwaysPreserveAspectRatio: true,
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
    }),
    TableKit,
    VideoNode,
  ];
}

export const EMPTY_TIPTAP_DOCUMENT = {
  type: "doc",
  content: [{ type: "paragraph" }],
};
