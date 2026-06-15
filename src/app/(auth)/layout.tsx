import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#faf7f4]">
      {/* Left brand panel — desktop only */}
      <div
        className="hidden lg:flex lg:w-[44%] fixed inset-y-0 left-0 flex-col items-center justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1e1814 0%, #2d1f1a 100%)" }}
      >
        {/* Background image */}
        <Image
          src="/images/product-model.jpeg"
          alt=""
          fill
          priority
          className="object-cover opacity-40"
          style={{ mixBlendMode: "luminosity" }}
          sizes="44vw"
        />
        {/* Warm overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(30,24,20,0.55) 0%, rgba(201,151,122,0.08) 60%, rgba(30,24,20,0.72) 100%)",
          }}
        />

        {/* Top — logo */}
        <Link
          href="/"
          className="relative z-10 self-start flex items-center gap-3"
        >
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/20">
            <Image
              src="/images/logo.jpeg"
              alt="Hey Beautiful"
              fill
              className="object-cover"
            />
          </div>
          <span
            className="text-white/90 text-lg tracking-wide"
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400 }}
          >
            Hey Beautiful
          </span>
        </Link>

        {/* Center — brand statement */}
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-8" style={{ background: "rgba(201,151,122,0.6)" }} />
            <span className="label-caps text-rose-gold/90">
              Premium Feminine Wellness
            </span>
            <div className="h-px w-8" style={{ background: "rgba(201,151,122,0.6)" }} />
          </div>
          <h2
            className="text-white"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2rem, 3vw, 3.2rem)",
              fontStyle: "italic",
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
            }}
          >
            Fuel Your Strength.
            <br />
            Keep Your Glow.
          </h2>
        </div>

        {/* Bottom — trust copy */}
        <p
          className="relative z-10 text-white/35"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.7rem", letterSpacing: "0.04em" }}
        >
          Trusted by 50,000+ women
        </p>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:ml-[44%] flex items-center justify-center min-h-screen py-16 px-6 sm:px-12">
        {children}
      </div>
    </div>
  );
}
