import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { ClientWrapper } from "@/components/ClientWrapper";
import { siteUrl } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd } from "@/lib/structured-data";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolved per deploy rather than hardcoded, so this and `sitemap.ts` can never quote
  // different origins. The previous literal was heybeautiful.com, which is not connected
  // yet (#18) — every relative OG image was resolving against a host that doesn't answer.
  metadataBase: new URL(siteUrl()),
  title: "Hey Beautiful — Fuel Your Strength. Keep Your Glow.",
  description:
    "Premium feminine wellness supplements crafted for the modern woman. Performance meets femininity. Strength meets beauty. Elevate your everyday ritual.",
  keywords: [
    "feminine wellness",
    "women supplements",
    "plant protein",
    "beauty wellness",
    "women fitness",
    "glow supplements",
    "hey beautiful",
  ],
  verification: {
    google: "MBRhCK7Z0a31F7y4F5nDhSWbf2aeRMW8RwNshOqNgwk",
  },
  openGraph: {
    title: "Hey Beautiful — Fuel Your Strength. Keep Your Glow.",
    description:
      "Premium feminine wellness supplements crafted for the modern woman.",
    type: "website",
    images: ["/images/product-mock-up.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="antialiased">
        {/* Site-wide: the brand is the same on every page, product or not. */}
        <JsonLd data={organizationJsonLd()} />
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
