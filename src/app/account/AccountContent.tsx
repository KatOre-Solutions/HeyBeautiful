"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Sparkles,
  Mail,
} from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";

const cards = [
  {
    Icon: ShoppingBag,
    title: "My Orders",
    copy: "Track shipments and review your purchase history.",
  },
  {
    Icon: Heart,
    title: "Wishlist",
    copy: "Everything you've saved, ready when you are.",
  },
  {
    Icon: UserIcon,
    title: "Profile Settings",
    copy: "Update your details, address, and preferences.",
  },
  {
    Icon: Sparkles,
    title: "Loyalty Points",
    copy: "Earn rewards with every ritual. Glow further.",
  },
];

export default function AccountContent() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // The proxy gates this route on a presence cookie only. If the Firebase session
  // is actually gone (expired / stale cookie), bounce to login rather than render
  // the dashboard to a logged-out visitor.
  useEffect(() => {
    if (!loading && !user) router.replace("/login?from=/account");
  }, [loading, user, router]);

  const firstName = user?.displayName?.split(" ")[0] ?? "Beautiful";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Avoid flashing the dashboard before auth resolves or while redirecting out.
  if (loading || !user) {
    return (
      <section
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#faf7f4" }}
      >
        <span
          className="label-caps text-rose-gold/70"
          style={{ fontSize: "11px" }}
        >
          Loading…
        </span>
      </section>
    );
  }

  return (
    <section
      className="section-py section-padding min-h-screen"
      style={{ background: "#faf7f4" }}
    >
      <div className="max-w-5xl mx-auto pt-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center mb-14"
        >
          <motion.span
            variants={fadeUp}
            className="label-caps text-rose-gold block mb-4"
          >
            My Account
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="heading-display text-ink"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
            }}
          >
            Welcome, {loading ? "…" : firstName}
          </motion.h1>

          {/* Email verification reminder */}
          {user && !user.emailVerified && (
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full"
              style={{
                background: "rgba(201,151,122,0.1)",
                border: "1px solid rgba(201,151,122,0.25)",
              }}
            >
              <Mail size={13} className="text-rose-gold" />
              <span
                className="text-ink/65"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.75rem" }}
              >
                Please verify your email
              </span>
              <button
                onClick={() => router.push("/verify-email")}
                className="text-rose-gold font-medium hover:opacity-70"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.75rem" }}
              >
                Verify now →
              </button>
            </motion.div>
          )}

          <motion.div
            variants={fadeUp}
            className="h-px w-16 mx-auto mt-7"
            style={{ background: "#c9977a" }}
          />
        </motion.div>

        {/* Stub cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        >
          {cards.map(({ Icon, title, copy }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="glass-card p-7 cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: "rgba(201,151,122,0.1)",
                  border: "1px solid rgba(201,151,122,0.22)",
                }}
              >
                <Icon size={20} className="text-rose-gold" />
              </div>
              <h3
                className="text-ink mb-1.5"
                style={{
                  fontFamily: "var(--font-cormorant)",
                  fontSize: "1.4rem",
                  fontWeight: 500,
                }}
              >
                {title}
              </h3>
              <p
                className="text-ink/50 leading-relaxed"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.85rem" }}
              >
                {copy}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <button onClick={handleSignOut} className="btn-outline">
            Sign Out
          </button>
        </motion.div>
      </div>
    </section>
  );
}
