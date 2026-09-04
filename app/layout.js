import "./globals.css";

export const metadata = {
  title: "SabStore",
  description: "Billing, inventory, and udhaar for local shops of any kind",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F2A93B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SabStore" />
      </head>
      <body>{children}</body>
    </html>
  );
}
