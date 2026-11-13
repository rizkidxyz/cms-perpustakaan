"use client";

import { useFadingCycle } from "./use-auto-cycle";

export default function AboutVisual({ items }) {
  const { index, visible } = useFadingCycle(items.length);
  const item = items[index] ?? items[0];

  if (!item) return null;

  return (
    <div className="about-visual-content" data-visible={visible}>
      <span className="about-visual-icon">
        <i className={item.icon} aria-hidden="true" />
      </span>

      <p className="about-visual-label">{item.label}</p>
      <p className="about-visual-caption">{item.caption}</p>
    </div>
  );
}
