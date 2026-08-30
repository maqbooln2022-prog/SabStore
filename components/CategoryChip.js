const CHIP_PALETTE = [
  { bg: "#E4F5F0", text: "#4F46E5" },
  { bg: "#FCEEDA", text: "#B5720B" },
  { bg: "#FDEAEA", text: "#C13F45" },
  { bg: "#EAEBFD", text: "#4B4FC1" },
  { bg: "#FDEAF6", text: "#B5399C" },
  { bg: "#E9F3FD", text: "#1D6FB5" },
];

export function categoryColor(category) {
  let h = 0;
  for (let i = 0; i < (category || "").length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return CHIP_PALETTE[h % CHIP_PALETTE.length];
}

export default function CategoryChip({ category }) {
  const c = categoryColor(category);
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
      {category}
    </span>
  );
}
