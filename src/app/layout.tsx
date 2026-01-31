import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SkipLink } from "@/components/SkipLink";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";
import { CookieConsent } from "@/components/CookieConsent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Eatsight - Menu Intelligence Platform",
    template: "%s | Eatsight",
  },
  description: "Help your guests find dishes they'll love. Three questions, perfect recommendations, happier customers.",
  keywords: ["restaurant", "menu", "recommendations", "QR code", "hospitality", "analytics"],
  authors: [{ name: "Eatsight" }],
  creator: "Eatsight",
  metadataBase: new URL("https://eatsight.io"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eatsight",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://eatsight.io",
    siteName: "Eatsight",
    title: "Eatsight - Menu Intelligence Platform",
    description: "Help your guests find dishes they'll love. Three questions, perfect recommendations, happier customers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eatsight - Menu Intelligence Platform",
    description: "Help your guests find dishes they'll love. Three questions, perfect recommendations, happier customers.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#722F37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <SkipLink />
        <ServiceWorkerRegister />
        <InstallPrompt />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
