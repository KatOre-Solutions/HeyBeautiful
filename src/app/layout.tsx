import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { ClientWrapper } from "@/components/ClientWrapper";

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
  metadataBase: new URL("https://heybeautiful.com"),
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
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
