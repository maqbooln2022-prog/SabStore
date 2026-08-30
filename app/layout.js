import "./globals.css";

export const metadata = {
  title: "SabStore",
  description: "Billing, inventory, and udhaar for local shops of any kind",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
