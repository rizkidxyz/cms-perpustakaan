"use client";

import Image from "next/image";

import { useCardRotation } from "./use-auto-cycle";

const SLOT_CLASSES = [
  "hero-card-slot-top",
  "hero-card-slot-left",
  "hero-card-slot-right",
];

export default function HeroCardStack({ images }) {
  const { frame, cardImages } = useCardRotation(images);
  const cardCount = Math.min(3, images.length);

  if (!cardCount) return null;

  return (
    <div className="hero-card-stack" aria-hidden="true">
      {Array.from({ length: cardCount }).map((_, index) => {
        const slot = SLOT_CLASSES[(index + frame) % SLOT_CLASSES.length];
        const imageIndex = (cardImages[index] ?? index) % images.length;
        const src = images[imageIndex];

        return (
          <div key={index} className={`hero-card-stack-item ${slot}`}>
            <Image
              key={src}
              src={src}
              alt=""
              width={480}
              height={600}
              unoptimized
              priority={index === 0}
              className="hero-card-stack-image"
            />
          </div>
        );
      })}
    </div>
  );
}
