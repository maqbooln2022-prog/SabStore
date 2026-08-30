"use client";

import { categoryColor } from "@/components/CategoryChip";

// Shows the item's photo if one was set, otherwise a colored initial-letter
// placeholder in the same category color used for its chip.
export default function ItemThumb({ item, size = 32 }) {
  const c = categoryColor(item.category || "");
  if (item.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.image_url}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className="rounded-lg flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, background: c.bg, color: c.text, fontSize: size * 0.4 }}
    >
      {(item.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}
