"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Leaf, Sparkles, HeartHandshake, ShieldCheck } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/motion";

/**
 * Four reassurances under the hero. Kept deliberately quiet — this is
 * merchandising furniture, not a feature section. `sections/Benefits.tsx` is the
 * expansive treatment of the same ideas and lives on the homepage; repeating its
 * six cards here would bury the products.
 */
const trust = [
  { icon: Leaf, title: "Quality ingredients", copy: "Clean, traceable, third-party tested" },
  { icon: Sparkles, title: "Wellness focused", copy: "Formulated for the female body" },
  { icon: HeartHandshake, title: "Made for your routine", copy: "Designed to fit the day you have" },
  { icon: ShieldCheck, title: "Secure checkout", copy: "Encrypted payment, tracked delivery" },
];

export default function TrustStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div
      ref={ref}
      className="border-y border-[#e8dcd0]"
      style={{ background: "#f0ebe3" }}
    >
      <div className="section-padding max-w-7xl mx-auto py-10 md:py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8"
        >
          {trust.map(({ icon: Icon, title, copy }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="flex items-start gap-3.5"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(201,151,122,0.1)",
                  border: "1px solid rgba(201,151,122,0.22)",
                }}
              >
                <Icon size={16} className="text-[#c9977a]" />
              </div>
              <div className="min-w-0">
                <p className="text-ink text-sm font-medium leading-snug">{title}</p>
                <p
                  className="text-ink/50 mt-1 leading-relaxed"
                  style={{ fontSize: "0.8125rem", fontWeight: 300 }}
                >
                  {copy}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
