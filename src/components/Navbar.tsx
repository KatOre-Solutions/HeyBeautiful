"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { ShoppingBag, Heart, Search, Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "Store", href: "/store" },
  // Route-aware anchors so they scroll to the homepage section from any page.
  { label: "Bundles", href: "/#bundles" },
  { label: "Our Story", href: "/#story" },
  { label: "Wellness", href: "/#benefits" },
  { label: "Community", href: "/#community" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isHero, setIsHero] = useState(true);
  const { items: wishlistItems, setWishlistOpen } = useWishlist();
  const { itemCount, setCartOpen } = useCart();
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  const { scrollY } = useScroll();

  // Track whether we're in the hero zone (first 80vh)
  useEffect(() => {
    const heroHeight =
      typeof window !== "undefined" ? window.innerHeight * 0.8 : 600;
    const unsub = scrollY.on("change", (v) => {
      setIsHero(v < heroHeight);
    });
    return () => unsub();
  }, [scrollY]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        {/* Glassmorphism panel — always visible, dark on hero, warm on content */}
        <div className="relative mx-4 md:mx-8 lg:mx-12 mt-4">
          <motion.div
            animate={
              isHero
                ? {
                  backgroundColor: "rgba(20, 16, 12, 0.42)",
                  borderColor: "rgba(255, 255, 255, 0.13)",
                  boxShadow:
                    "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
                }
                : {
                  backgroundColor: "rgba(250, 247, 244, 0.88)",
                  borderColor: "rgba(255, 255, 255, 0.55)",
                  boxShadow:
                    "0 4px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
                }
            }
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 rounded-2xl border"
            style={{ backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
          />

          {/* Nav content */}
          <div className="relative flex items-center justify-between px-5 md:px-7 py-3.5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/20 flex-shrink-0">
                <Image
                  src="/images/logo.jpeg"
                  alt="Hey Beautiful"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <motion.span
                animate={{ color: isHero ? "rgba(255,255,255,0.95)" : "#1e1814" }}
                transition={{ duration: 0.5 }}
                className="hidden sm:block text-lg tracking-wide"
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}
              >
                Hey Beautiful
              </motion.span>
            </Link>

            {/* Center nav links */}
            <nav className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="relative group"
                >
                  <motion.span
                    animate={{
                      color: isHero ? "rgba(255,255,255,0.78)" : "rgba(30,24,20,0.65)",
                    }}
                    whileHover={{
                      color: isHero ? "#ffffff" : "#c9977a",
                    }}
                    transition={{ duration: 0.3 }}
                    className="label-caps text-[10px] tracking-[0.16em]"
                    style={{ fontFamily: "var(--font-manrope)" }}
                  >
                    {link.label}
                  </motion.span>
                  {/* Underline hover */}
                  <span
                    className="absolute -bottom-0.5 left-0 w-0 h-px transition-all duration-400 group-hover:w-full"
                    style={{
                      background: isHero ? "rgba(255,255,255,0.6)" : "#c9977a",
                    }}
                  />
                </Link>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Icon buttons */}
              {[
                { Icon: Search, label: "Search", href: null, badge: null, onClick: null },
                { Icon: User, label: user ? "My Account" : "Sign In", href: user ? "/account" : "/login", badge: null, onClick: null },
                { Icon: Heart, label: "Wishlist", href: null, badge: wishlistItems.length, onClick: () => setWishlistOpen(true) },
                { Icon: ShoppingBag, label: "Cart", href: null, badge: itemCount, onClick: () => setCartOpen(true) },
              ].map(({ Icon, label, href, badge, onClick }) => {
                const btn = (
                  <motion.div
                    key={label}
                    animate={{
                      backgroundColor: isHero
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(201,151,122,0.0)",
                    }}
                    whileHover={{
                      backgroundColor: isHero
                        ? "rgba(255,255,255,0.16)"
                        : "rgba(201,151,122,0.1)",
                      scale: 1.06,
                    }}
                    transition={{ duration: 0.25 }}
                    className="relative w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                  >
                    <motion.div
                      animate={{
                        color: isHero ? "rgba(255,255,255,0.8)" : "rgba(30,24,20,0.65)",
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <Icon size={16} />
                    </motion.div>
                    {badge != null && badge > 0 && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#c9977a] text-white text-[8px] flex items-center justify-center font-bold">
                        {badge}
                      </span>
                    )}
                  </motion.div>
                );
                return href ? (
                  <Link key={label} href={href} aria-label={label}>
                    {btn}
                  </Link>
                ) : (
                  <button key={label} aria-label={label} onClick={onClick ?? undefined}>
                    {btn}
                  </button>
                );
              })}

              {/* CTA pill — matches reference image style */}
              <Link href="/store" className="hidden md:block ml-1">
                <motion.div
                  animate={
                    isHero
                      ? {
                        backgroundColor: "rgba(255,255,255,0.95)",
                        color: "#1e1814",
                        borderColor: "rgba(255,255,255,0.0)",
                      }
                      : {
                        backgroundColor: "#c9977a",
                        color: "#ffffff",
                        borderColor: "#c9977a",
                      }
                  }
                  whileHover={{ scale: 1.04, opacity: 0.92 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border"
                  style={{
                    fontFamily: "var(--font-manrope)",
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    boxShadow: isHero
                      ? "0 2px 16px rgba(255,255,255,0.15)"
                      : "0 4px 20px rgba(201,151,122,0.35)",
                  }}
                >
                  Shop Now
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              </Link>

              {/* Mobile menu */}
              <button
                className="lg:hidden ml-1 w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-300"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                style={{
                  background: isHero ? "rgba(255,255,255,0.1)" : "rgba(201,151,122,0.1)",
                }}
              >
                <motion.div
                  animate={{ color: isHero ? "rgba(255,255,255,0.9)" : "#1e1814" }}
                  transition={{ duration: 0.4 }}
                >
                  <Menu size={18} />
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[300px] max-w-[88vw]"
              style={{
                background: "rgba(20, 16, 12, 0.92)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "-20px 0 60px rgba(0,0,0,0.3)",
                borderLeft: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex flex-col h-full p-8">
                <div className="flex items-center justify-between mb-12">
                  <span
                    className="text-white/90 text-xl"
                    style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}
                  >
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-9 h-9 flex items-center justify-center rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <X size={18} className="text-white/80" />
                  </button>
                </div>

                <nav className="flex flex-col gap-5">
                  {navLinks.map((link, i) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: 0.08 + i * 0.06,
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-white/75 hover:text-[#e8c4ad] transition-colors duration-300"
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontSize: "2rem",
                          fontWeight: 300,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </nav>

                <div className="mt-auto">
                  <div className="h-px w-full mb-6" style={{ background: "rgba(255,255,255,0.08)" }} />

                  {/* Wishlist + Bag triggers */}
                  {[
                    {
                      Icon: Heart,
                      label: "Wishlist",
                      badge: wishlistItems.length,
                      onClick: () => {
                        setMobileOpen(false);
                        setWishlistOpen(true);
                      },
                    },
                    {
                      Icon: ShoppingBag,
                      label: "Bag",
                      badge: itemCount,
                      onClick: () => {
                        setMobileOpen(false);
                        setCartOpen(true);
                      },
                    },
                  ].map(({ Icon, label, badge, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      className="flex items-center gap-3 mb-5 w-full text-left text-white/75 hover:text-[#e8c4ad] transition-colors duration-300"
                    >
                      <span
                        className="relative w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <Icon size={16} />
                        {badge > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#c9977a] text-white text-[9px] flex items-center justify-center font-bold">
                            {badge}
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-cormorant)",
                          fontSize: "1.35rem",
                          fontWeight: 400,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}

                  {/* Auth link */}
                  <Link
                    href={user ? "/account" : "/login"}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 mb-5 transition-colors duration-300"
                    style={{ color: user ? "#e8c4ad" : "rgba(255,255,255,0.75)" }}
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <User size={16} />
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-cormorant)",
                        fontSize: "1.35rem",
                        fontWeight: 400,
                      }}
                    >
                      {user ? `Hi, ${firstName || "Beautiful"}` : "Sign In"}
                    </span>
                  </Link>

                  <Link
                    href="/store"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full text-[#1e1814] font-semibold text-xs tracking-[0.12em] uppercase transition-all hover:opacity-90"
                    style={{ background: "rgba(255,255,255,0.93)" }}
                  >
                    Shop the Collection
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
