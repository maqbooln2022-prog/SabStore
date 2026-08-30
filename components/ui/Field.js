export default function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-[#6B7280] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
