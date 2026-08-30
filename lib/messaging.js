import { rupee } from "@/lib/format";

// Manual wa.me deep links — pre-fills a WhatsApp message for the owner to
// hit send. Phase 2 (per PROJECT_BRIEF.md) replaces this with the WhatsApp
// Cloud API for automatic sending; this is the correct phase-1 behavior.
export function whatsappLink(phone, text) {
  const digits = (phone || "").replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(text)}`;
}

export function upiUri(upiId, payeeName, amount, note) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount ? String(Math.round(amount * 100) / 100) : "",
    cu: "INR",
    tn: note || "",
  });
  return `upi://pay?${params.toString()}`;
}

export function upiQrImageUrl(uri, size = 180) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(uri)}`;
}

// Tax breakup assuming line prices are GST-inclusive (standard for retail).
export function taxBreakup(billItems) {
  let taxable = 0,
    taxAmt = 0;
  (billItems || []).forEach((it) => {
    const lineTotal = it.qty * it.price;
    if (it.gst) {
      const base = (lineTotal * 100) / (100 + it.gst);
      taxable += base;
      taxAmt += lineTotal - base;
    } else {
      taxable += lineTotal;
    }
  });
  return { taxable: Math.round(taxable * 100) / 100, taxAmt: Math.round(taxAmt * 100) / 100 };
}

export function billMessageText(bill, storeName, gstin) {
  const lines = (bill.items || []).map((it) => `• ${it.name} x ${it.qty}${it.unit} — ${rupee(it.qty * it.price)}`).join("\n");
  const { taxable, taxAmt } = taxBreakup(bill.items);
  const taxLine = taxAmt > 0 ? `\nTaxable: ${rupee(taxable)}\nGST: ${rupee(taxAmt)}\n` : "";
  const gstinLine = gstin ? `GSTIN: ${gstin}\n` : "";
  return `*${storeName}*\n${gstinLine}Bill No: ${bill.bill_no}\nDate: ${new Date(bill.date).toLocaleString("en-IN")}\n\n${lines}\n${taxLine}\n*Total: ${rupee(bill.total)}*\n\nThank you for shopping with us!`;
}

export function creditReminderText(storeName, name, balance) {
  return `*${storeName}*\nHi ${name || "there"}, this is a friendly reminder that your outstanding balance (udhaar) is *${rupee(balance)}*. Please settle at your convenience. Thank you!`;
}
