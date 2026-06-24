"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { heroEntrance, shimmerLine, staggerContainerSlow } from "@/lib/motion";

interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
}

export default function AuthForm({
  title,
  subtitle,
  children,
  maxWidth = "max-w-sm",
}: AuthFormProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={heroEntrance}
      className={`w-full ${maxWidth}`}
    >
      {/* Header */}
      <div className="mb-8">
        {subtitle && (
          <motion.p
            variants={shimmerLine}
            className="label-caps text-[#c9977a] mb-3"
          >
            {subtitle}
          </motion.p>
        )}
        <h1
          className="heading-display text-[#1e1814]"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(2.25rem, 5vw, 3rem)",
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        <motion.div
          variants={shimmerLine}
          className="h-px w-16 mt-5 origin-left"
          style={{ background: "#c9977a" }}
        />
      </div>

      {/* Body — staggered fields */}
      <motion.div
        variants={staggerContainerSlow}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-4"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
