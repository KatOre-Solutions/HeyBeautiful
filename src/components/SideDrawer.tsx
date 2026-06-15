"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { ease } from "@/lib/motion";

interface SideDrawerProps {
  /** Whether the drawer is open. */
  isOpen: boolean;
  /** Called when the backdrop or close button is clicked. */
  onClose: () => void;
  /** Icon shown beside the title (e.g. <ShoppingBag />, <Heart />). */
  icon: ReactNode;
  /** Drawer title, e.g. "My Bag". */
  title: string;
  /** Item count — drives the header badge; the badge hides when 0/undefined. */
  count?: number;
  /** Accessible label for the close button, e.g. "Close bag". */
  closeLabel: string;
  /** Scrollable body — the caller renders its own empty-state and item list. */
  children: ReactNode;
  /**
   * Footer content (e.g. subtotal + CTA). When provided it animates in/out;
   * pass `null`/`undefined` to hide the footer (e.g. while the drawer is empty).
   */
  footer?: ReactNode;
}

/**
 * Shared slide-in drawer shell (backdrop + right panel + header + scroll body +
 * footer slot). Used by CartSidebar and WishlistSidebar so the chrome lives in
 * one place. Body and footer content are passed by the caller.
 */
export default function SideDrawer({
  isOpen,
  onClose,
  icon,
  title,
  count,
  closeLabel,
  children,
  footer,
}: SideDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60]"
            style={{
              background: "rgba(30,24,20,0.25)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
            }}
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.div
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: ease.cinematic }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-[390px] max-w-[92vw] flex flex-col"
            style={{
              background: "rgba(250, 247, 244, 0.97)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderLeft: "1px solid rgba(201,151,122,0.22)",
              boxShadow:
                "-20px 0 80px rgba(30,24,20,0.1), inset 1px 0 0 rgba(255,255,255,0.6)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-7 pt-7 pb-5"
              style={{ borderBottom: "1px solid rgba(201,151,122,0.14)" }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4, ease: ease.cinematic }}
                >
                  {icon}
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.4rem",
                    color: "#1e1814",
                    fontWeight: 400,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {title}
                </motion.span>
                <AnimatePresence>
                  {count != null && count > 0 && (
                    <motion.span
                      key="drawer-count-badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: ease.cinematic }}
                      className="w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                      style={{ background: "#c9977a", fontFamily: "var(--font-manrope)" }}
                    >
                      {count}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full"
                style={{
                  background: "rgba(201,151,122,0.1)",
                  border: "1px solid rgba(201,151,122,0.22)",
                }}
                aria-label={closeLabel}
              >
                <X size={15} className="text-ink/55" />
              </motion.button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">{children}</div>

            {/* Footer — only shown when content is provided */}
            <AnimatePresence>
              {footer && (
                <motion.div
                  key="drawer-footer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.4, ease: ease.cinematic }}
                  className="px-5 pb-6 pt-4"
                  style={{ borderTop: "1px solid rgba(201,151,122,0.14)" }}
                >
                  {footer}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
