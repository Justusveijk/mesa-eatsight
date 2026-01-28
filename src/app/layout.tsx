import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mesa - Menu Recommendations",
  description: "Get personalized menu recommendations at your favorite restaurants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
