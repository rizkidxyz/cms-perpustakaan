"use client";

import { useFadingCycle } from "./use-auto-cycle";

export default function HeroHeadline({ items }) {
  const { index, visible } = useFadingCycle(items.length);
  const item = items[index] ?? items[0];

  if (!item) return null;

  return (
    <h1 className="max-w-2xl text-4xl font-bold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
      <span className="hero-headline-swap" data-visible={visible}>
        <span className="block">{item.lead}</span>

        <span className="mt-2 block text-emerald-700 dark:text-emerald-400">
          {item.accent}
        </span>
      </span>
    </h1>
  );
}
