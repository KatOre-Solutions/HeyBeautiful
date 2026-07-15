"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram, Youtube, MessageCircle } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

const links = {
  Shop: [
    { label: "All Products", href: "#" },
    { label: "Bundles", href: "#bundles" },
    { label: "New Arrivals", href: "#" },
    { label: "Best Sellers", href: "#products" },
  ],
  Discover: [
    { label: "Our Story", href: "#story" },
    { label: "Ingredients", href: "#" },
    { label: "Wellness Journal", href: "#" },
    { label: "Community", href: "#community" },
  ],
  Support: [
    { label: "FAQ", href: "#" },
    { label: "Shipping & Returns", href: "#" },
    { label: "Track My Order", href: "#" },
    { label: "Contact Us", href: "#" },
  ],
};

const socials = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
  { icon: MessageCircle, label: "TikTok", href: "#" },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "#1a1410",
        borderTop: "1px solid rgba(201,151,122,0.15)",
      }}
    >
      {/* Main footer */}
      <div className="section-padding py-16 md:py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                {/* w-10 h-10 = 40px */}
                <Image
                  src="/images/logo.jpeg"
                  alt="Hey Beautiful"
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <span
                className="text-white/90 text-xl"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                }}
              >
                Hey Beautiful
              </span>
            </div>

            <p
              className="text-white/40 leading-relaxed mb-8"
              style={{ fontSize: "0.875rem", fontWeight: 300, lineHeight: 1.8 }}
            >
              Premium feminine wellness supplements crafted for the modern woman
              who refuses to compromise.
            </p>

            {/* Social icons */}
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-[#c9977a] hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Icon size={14} className="text-white/60" />
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <p className="label-caps text-[#c9977a] mb-5 text-[9px]">
                {category}
              </p>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-white/45 hover:text-white/80 transition-colors duration-300 text-sm font-light"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Deco line + tagline */}
        <div
          className="mt-14 pt-10"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Large wordmark */}
            <div
              className="text-center md:text-left"
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(2rem, 5vw, 4rem)",
                fontWeight: 300,
                letterSpacing: "-0.02em",
                color: "rgba(255,255,255,0.06)",
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              Hey Beautiful
            </div>

            {/* Legal */}
            <div className="flex flex-col md:flex-row items-center gap-4 text-center">
              <p className="text-white/25 text-xs">
                © {new Date().getFullYear()} Hey Beautiful. All rights reserved.
              </p>
              <div className="flex gap-4">
                {["Privacy Policy", "Terms", "Accessibility"].map((label) => (
                  <Link
                    key={label}
                    href="#"
                    className="text-white/25 hover:text-white/50 text-xs transition-colors duration-300"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
