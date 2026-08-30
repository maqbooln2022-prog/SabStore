import { rupee } from "@/lib/format";
import { upiUri, upiQrImageUrl } from "@/lib/messaging";

export default function UpiQrCard({ upiId, payeeName, amount, note }) {
  if (!upiId) return null;
  const uri = upiUri(upiId, payeeName, amount, note);
  return (
    <div className="rounded-2xl p-4 flex flex-col items-center gap-2" style={{ background: "#F8F9FD", border: "1px dashed #D8CBAE" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={upiQrImageUrl(uri)} alt="UPI QR code" width={140} height={140} style={{ borderRadius: 10 }} />
      <p className="text-xs text-[#6B7280] text-center">
        Scan to pay <span className="font-semibold text-[#000000]">{rupee(amount)}</span> via any UPI app
      </p>
      <a href={uri} className="text-[11px] font-semibold text-[#4F46E5]">
        Open in UPI app instead
      </a>
    </div>
  );
}
