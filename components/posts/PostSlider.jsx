"use client";

import { useEffect, useRef } from "react";

import PostCard from "./PostCard";

// Tiga salinan daftar membuat pergeseran bisa berputar dua arah tanpa putus.
const COPIES = 3;
const MIDDLE_COPY = 1;

function getMetrics(track) {
  const groups = track?.children;
  if (!groups || groups.length < 2) return { copyWidth: 0, step: 0 };

  const first = groups[0];
  const middle = groups[MIDDLE_COPY] ?? groups[0];

  // offsetLeft kedua grup relatif terhadap parent yang sama, jadi selisihnya
  // adalah lebar satu salinan termasuk gap.
  const copyWidth = middle.offsetLeft - first.offsetLeft;

  const cards = middle.children;
  const step =
    cards.length > 1
      ? cards[1].offsetLeft - cards[0].offsetLeft
      : cards[0]?.offsetWidth || 0;

  return { copyWidth, step };
}

export default function PostSlider({ posts }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const programmaticRef = useRef(false);
  const normalizeRef = useRef(() => {});
  const settleTimerRef = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    // Mulai di salinan tengah supaya masih ada ruang untuk geser ke kiri.
    const { copyWidth } = getMetrics(track);
    if (copyWidth > 0) viewport.scrollLeft = copyWidth;

    let frame = 0;

    const normalize = () => {
      frame = 0;
      const metrics = getMetrics(track);
      if (metrics.copyWidth <= 0) return;

      const left = viewport.scrollLeft;

      // Geser satu salinan penuh. Isinya identik, jadi lompatan ini tidak
      // terlihat dan posisi selalu kembali ke salinan tengah.
      if (left < metrics.copyWidth * 0.5) {
        viewport.scrollLeft = left + metrics.copyWidth;
      } else if (left > metrics.copyWidth * 1.5) {
        viewport.scrollLeft = left - metrics.copyWidth;
      }
    };

    normalizeRef.current = normalize;

    const onScroll = () => {
      // Saat tombol panah menganimasikan scroll, jangan normalisasi dulu.
      if (programmaticRef.current) return;
      if (frame) return;
      frame = requestAnimationFrame(normalize);
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settleTimerRef.current);
    };
  }, [posts.length]);

  function scrollByCards(direction) {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const { step } = getMetrics(track);
    if (!step) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      viewport.scrollBy({ left: direction * step, behavior: "auto" });
      normalizeRef.current();
      return;
    }

    // Tandai animasi berjalan, lalu normalisasi setelah scroll mendarat.
    programmaticRef.current = true;
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(() => {
      programmaticRef.current = false;
      normalizeRef.current();
    }, 600);

    viewport.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className="post-slider">
      <div className="post-slider-toolbar">
        <span className="post-slider-hint">
          <i className="ri-drag-move-2-line" aria-hidden="true" />
          Geser untuk melihat post lainnya
        </span>

        <div className="post-slider-actions">
          <button
            type="button"
            className="post-slider-button"
            aria-label="Post sebelumnya"
            onClick={() => scrollByCards(-1)}
          >
            <i className="ri-arrow-left-line" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="post-slider-button"
            aria-label="Post berikutnya"
            onClick={() => scrollByCards(1)}
          >
            <i className="ri-arrow-right-line" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="post-slider-viewport"
        role="region"
        aria-label="Post terbaru perpustakaan"
        tabIndex={0}
      >
        <div ref={trackRef} className="post-slider-track">
          {Array.from({ length: COPIES }).map((_, copyIndex) => (
            <div
              key={copyIndex}
              className="post-slider-group"
              {...(copyIndex === MIDDLE_COPY
                ? {}
                : { inert: true, "aria-hidden": true })}
            >
              {posts.map((post) => (
                <div key={`${copyIndex}-${post.id}`} className="post-slider-item">
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
