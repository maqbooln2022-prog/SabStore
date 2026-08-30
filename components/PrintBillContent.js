import { rupee } from "@/lib/format";
import { taxBreakup } from "@/lib/messaging";

export default function PrintBillContent({ bill, storeName, gstin }) {
  const { taxable, taxAmt } = taxBreakup(bill.items);
  return (
    <div style={{ width: "300px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#000", padding: "16px" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{storeName}</div>
        <div>Local Stores · Retail Bill</div>
        {gstin && <div>GSTIN: {gstin}</div>}
      </div>
      <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "6px 0", margin: "6px 0" }}>
        <div>Bill No: {bill.bill_no}</div>
        <div>Date: {new Date(bill.date).toLocaleString("en-IN")}</div>
        {bill.customer_name && <div>Customer: {bill.customer_name}</div>}
        {bill.customer_phone && <div>Phone: {bill.customer_phone}</div>}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <td style={{ paddingBottom: 4 }}>Item</td>
            <td style={{ paddingBottom: 4, textAlign: "center" }}>Qty</td>
            <td style={{ paddingBottom: 4, textAlign: "right" }}>Amt</td>
          </tr>
        </thead>
        <tbody>
          {(bill.items || []).map((it, idx) => (
            <tr key={it.shop_product_id || idx}>
              <td style={{ padding: "2px 0" }}>{it.name}</td>
              <td style={{ padding: "2px 0", textAlign: "center" }}>
                {it.qty}
                {it.unit}
              </td>
              <td style={{ padding: "2px 0", textAlign: "right" }}>{it.qty * it.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {taxAmt > 0 && (
        <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Taxable value</span>
            <span>{rupee(taxable)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>GST</span>
            <span>{rupee(taxAmt)}</span>
          </div>
        </div>
      )}
      <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
        <span>TOTAL</span>
        <span>{rupee(bill.total)}</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 10 }}>Thank you, visit again!</div>
    </div>
  );
}
