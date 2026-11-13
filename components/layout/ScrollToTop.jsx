"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    function updateVisibility() {
      frame = 0;

      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setIsVisible(false);
        return;
      }

      const shouldShow = window.scrollY >= scrollableHeight / 2;
      setIsVisible((current) => (current === shouldShow ? current : shouldShow));
    }

    function handleScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(updateVisibility);
    }

    updateVisibility();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToTop() {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }

  if (!isVisible) return null;

  return (
    <button
      type="button"
      className="scroll-top-button focus-ring"
      onClick={scrollToTop}
      aria-label="Kembali ke atas"
    >
      <i className="ri-arrow-up-line" aria-hidden="true" />
    </button>
  );
}
