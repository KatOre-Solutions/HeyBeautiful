"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface FloatingInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  autoComplete?: string;
  required?: boolean;
  rightElement?: ReactNode;
}

export default function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
  required,
  rightElement,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <motion.div variants={fadeUp}>
      <div
        className={cn(
          "relative rounded-2xl border bg-white transition-all duration-300",
          error
            ? "border-red-300"
            : focused
            ? "border-[#c9977a]"
            : "border-[rgba(232,220,208,1)]"
        )}
        style={{
          boxShadow: error
            ? "0 0 0 3px rgba(239,68,68,0.1)"
            : focused
            ? "0 0 0 3px rgba(201,151,122,0.12)"
            : "none",
        }}
      >
        <label
          htmlFor={id}
          className={cn(
            "absolute left-5 pointer-events-none transition-all duration-300 origin-left",
            floated
              ? "top-2 text-[10px] tracking-[0.12em] uppercase"
              : "top-1/2 -translate-y-1/2 text-sm"
          )}
          style={{
            fontFamily: "var(--font-manrope)",
            color: error
              ? "rgba(239,68,68,0.8)"
              : floated
              ? "rgba(201,151,122,0.9)"
              : "rgba(30,24,20,0.4)",
            fontWeight: floated ? 500 : 400,
          }}
        >
          {label}
        </label>

        <div className="flex items-center">
          <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoComplete={autoComplete}
            required={required}
            className="w-full bg-transparent px-5 pt-6 pb-2 text-sm text-[#1e1814] focus:outline-none"
            style={{ fontFamily: "var(--font-manrope)" }}
          />
          {rightElement && (
            <div className="pr-4 flex-shrink-0">{rightElement}</div>
          )}
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 ml-1 text-xs text-red-400"
          style={{ fontFamily: "var(--font-manrope)" }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
