"use client";

import { useEffect, useState } from "react";

export const CYCLE_DELAY = 5000;
export const FADE_DURATION = 250;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Indeks berganti tiap `delay`, dengan fade-out singkat sebelum teks diganti.
// `startOffset` dipakai bila beberapa komponen perlu mulai dari item berbeda.
export function useFadingCycle(
  length,
  delay = CYCLE_DELAY,
  fadeDuration = FADE_DURATION,
  startOffset = 0,
) {
  const [index, setIndex] = useState(() =>
    length > 0 ? startOffset % length : 0,
  );
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (length < 2 || prefersReducedMotion()) return;

    let intervalId = 0;
    let fadeTimer = 0;

    const stop = () => {
      window.clearInterval(intervalId);
      window.clearTimeout(fadeTimer);
    };

    const tick = () => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % length);
        setVisible(true);
      }, fadeDuration);
    };

    const start = () => {
      stop();
      intervalId = window.setInterval(tick, delay);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
        setVisible(true);
      } else {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [length, delay, fadeDuration]);

  return { index, visible };
}

// Rotasi tumpukan kartu hero. Frame dan gambar kartu diperbarui bersamaan
// supaya gambar tetap menempel pada kartunya saat berpindah slot.
// Hanya kartu yang masuk slot kanan yang menerima gambar baru.
export function useCardRotation(images, delay = CYCLE_DELAY) {
  const cardCount = Math.min(3, images.length);
  const [state, setState] = useState(() => ({
    frame: 0,
    cardImages: Array.from({ length: cardCount }, (_, index) => index),
  }));

  useEffect(() => {
    // Kurang dari tiga kartu ditampilkan statis, jadi tidak perlu rotasi.
    if (cardCount < 3 || images.length < 1 || prefersReducedMotion()) return;

    let intervalId = 0;

    const tick = () => {
      setState((current) => {
        const nextFrame = current.frame + 1;
        const nextImages = current.cardImages.slice();

        // Kartu yang kini di slot kiri akan masuk ke slot kanan berikutnya.
        // Indeks gambar dihitung dari frame supaya updater tetap murni.
        if (images.length > cardCount) {
          const incomingCard = (1 - current.frame + 3) % 3;
          nextImages[incomingCard] = (cardCount + current.frame) % images.length;
        }

        return { frame: nextFrame, cardImages: nextImages };
      });
    };

    const start = () => {
      window.clearInterval(intervalId);
      intervalId = window.setInterval(tick, delay);
    };

    const onVisibilityChange = () => {
      if (document.hidden) window.clearInterval(intervalId);
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [cardCount, delay, images.length]);

  return {
    frame: cardCount < 3 ? 0 : state.frame,
    cardImages: state.cardImages,
  };
}
