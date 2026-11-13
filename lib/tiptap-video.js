import { Node } from "@tiptap/core";

import { normalizeVideoProvider } from "./video-url";

const EMBED_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";

// Node video dipakai bersama editor dan static renderer (HTML publik).
export const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      provider: {
        default: "file",
        parseHTML: (element) => normalizeVideoProvider(element.getAttribute("data-provider")),
        renderHTML: (attributes) => ({
          "data-provider": normalizeVideoProvider(attributes.provider),
        }),
      },
      title: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-title") ||
          element.querySelector("video, iframe")?.getAttribute("title") ||
          null,
        renderHTML: (attributes) =>
          typeof attributes.title === "string" && attributes.title
            ? { "data-title": attributes.title }
            : {},
      },
      poster: {
        default: null,
        parseHTML: (element) => element.querySelector("video")?.getAttribute("poster") || null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-video-embed]",
        getAttrs: (element) => {
          const media = element.querySelector("video, iframe");
          return {
            src: media?.getAttribute("src") || null,
            provider: normalizeVideoProvider(element.getAttribute("data-provider")),
            title:
              element.getAttribute("data-title") || media?.getAttribute("title") || null,
            poster: media?.getAttribute("poster") || null,
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const provider = normalizeVideoProvider(node.attrs.provider);
    const src = node.attrs.src || "";
    const title = node.attrs.title || (provider === "file" ? "Video" : "Video tersemat");

    const wrapper = {
      class: "video-embed",
      "data-video-embed": "",
      "data-provider": provider,
      ...(node.attrs.title ? { "data-title": node.attrs.title } : {}),
    };

    if (provider === "file") {
      return [
        "div",
        wrapper,
        [
          "video",
          {
            src,
            controls: "",
            preload: "metadata",
            playsinline: "",
            title,
            ...(node.attrs.poster ? { poster: node.attrs.poster } : {}),
          },
        ],
      ];
    }

    return [
      "div",
      wrapper,
      [
        "iframe",
        {
          src,
          title,
          loading: "lazy",
          allow: EMBED_ALLOW,
          allowfullscreen: "",
          referrerpolicy: "strict-origin-when-cross-origin",
          frameborder: "0",
        },
      ],
    ];
  },
});
