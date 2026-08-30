import "./globals.css";

export const metadata = {
  title: "Shop Manager",
  description: "Billing, inventory, and udhaar for local shops of any kind",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
