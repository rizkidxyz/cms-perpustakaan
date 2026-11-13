"use client";

import {
  CYCLE_DELAY,
  FADE_DURATION,
  useFadingCycle,
} from "./use-auto-cycle";

const TONE_CLASSES = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

export default function HeroHighlight({
  items,
  startOffset = 0,
  tone = "emerald",
}) {
  const { index, visible } = useFadingCycle(
    items.length,
    CYCLE_DELAY,
    FADE_DURATION,
    startOffset,
  );
  const item = items[index] ?? items[0];

  if (!item) return null;

  return (
    <div className="hero-highlight-content" data-visible={visible}>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xl ${
          TONE_CLASSES[tone] ?? TONE_CLASSES.emerald
        }`}
      >
        <i className={item.icon} aria-hidden="true" />
      </span>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-white">
          {item.label}
        </p>
        <p className="mt-0.5 line-clamp-2 min-h-8 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
          {item.caption}
        </p>
      </div>
    </div>
  );
}
