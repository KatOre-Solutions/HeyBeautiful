"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Sparkles, Users, Heart } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

const communityPerks = [
  { icon: Sparkles, text: "Early access to new launches" },
  { icon: Users, text: "Join 50k+ women on the journey" },
  { icon: Heart, text: "Exclusive member discounts" },
];

export default function Newsletter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section
      id="community"
      ref={ref}
      className="section-py section-padding relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/images/inspo-6.jpeg"
          alt="Community"
          fill
          className="object-cover scale-105"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(30,24,20,0.75) 0%, rgba(30,24,20,0.55) 40%, rgba(139,94,82,0.4) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(201,151,122,0.12) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Label */}
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-[#c9977a]/70" />
            <span className="label-caps text-[#c9977a]/90">Community</span>
            <div className="h-px w-10 bg-[#c9977a]/70" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="heading-display text-white mb-6"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
            }}
          >
            Join the Movement.
            <br />
            <em style={{ fontStyle: "italic", color: "#e8c4ad" }}>
              Own Your Glow.
            </em>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="text-white/70 mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ fontSize: "0.95rem", fontWeight: 300 }}
          >
            Be part of a growing community of women who choose themselves every
            day. Get exclusive offers, early access, and wellness inspiration
            delivered straight to you.
          </motion.p>

          {/* Perks */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-6 mb-10"
          >
            {communityPerks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.text} className="flex items-center gap-2">
                  <Icon size={13} className="text-[#c9977a]" />
                  <span className="text-white/70 text-sm">{perk.text}</span>
                </div>
              );
            })}
          </motion.div>

          {/* Form */}
          <motion.div variants={fadeUp} className="max-w-md mx-auto">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, duration: 0.6, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle size={40} className="text-[#c9977a]" />
                  </motion.div>
                  <p
                    className="heading-serif text-2xl text-white"
                    style={{ fontFamily: "var(--font-cormorant)" }}
                  >
                    Welcome to the family.
                  </p>
                  <p className="text-white/65 text-sm">
                    Check your inbox for a special welcome gift.
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  exit={{ opacity: 0 }}
                  className="relative"
                >
                  <div
                    className="flex rounded-full overflow-hidden"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(16px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      boxShadow: "0 4px 30px rgba(0,0,0,0.15)",
                    }}
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className="flex-1 bg-transparent px-6 py-4 text-white placeholder-white/40 text-sm focus:outline-none"
                      style={{ fontFamily: "var(--font-manrope)" }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-4 rounded-full text-white text-[10px] font-semibold tracking-[0.1em] uppercase transition-all duration-300 flex-shrink-0"
                      style={{
                        background: loading ? "rgba(201,151,122,0.7)" : "#c9977a",
                        margin: "4px",
                        boxShadow: "0 4px 16px rgba(201,151,122,0.4)",
                      }}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                        />
                      ) : (
                        <>
                          Join Now
                          <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-white/35 text-xs mt-3">
                    No spam, ever. Unsubscribe anytime.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Social proof numbers */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-center gap-3 mt-10"
          >
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {["/images/inspo-1.jpeg", "/images/inspo-2.jpeg", "/images/inspo-3.jpeg"].map(
                (src, i) => (
                  <div
                    key={i}
                    className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white/40"
                  >
                    <Image src={src} alt="" fill className="object-cover" />
                  </div>
                )
              )}
            </div>
            <p className="text-white/60 text-sm">
              <span className="text-white font-medium">50,000+</span> women already in
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
