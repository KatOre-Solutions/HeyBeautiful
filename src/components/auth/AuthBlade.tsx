"use client";

import { forwardRef } from "react";
import Image from "next/image";
import type { AuthMode } from "./AuthTransitionContext";

/**
 * The branded angled panel — and the only branded element on the card. It isn't
 * an overlay flying over a separate brand column; it *is* the brand column, and
 * it rests on the left for sign-in and the right for sign-up, sweeping between
 * the two through full cover.
 *
 * The diagonal comes from `clip-path`, not the skew + counter-skew pairing the
 * original reference used: the element stays an ordinary rectangle, so its `x`
 * is a single clean motion value, and nothing inside needs a counter-transform
 * to stay upright (clip-path clips paint without skewing internal layout).
 * The edge glow is `drop-shadow`, which follows the clipped silhouette —
 * `box-shadow` would trace the unclipped rectangle and read as obviously wrong
 * against an angled cut.
 */
const COPY: Record<AuthMode, { eyebrow: string; heading: string; accent: string; lines: string[] }> = {
  signin: {
    eyebrow: "Welcome",
    heading: "Welcome",
    accent: "back.",
    lines: [
      "Your glow, your goals, your journey continues here.",
      "Let's make today beautiful.",
    ],
  },
  signup: {
    eyebrow: "Join us",
    heading: "Begin your",
    accent: "ritual.",
    lines: [
      "Premium wellness essentials, made for your everyday.",
      "Fuel your strength. Keep your glow.",
    ],
  },
};

interface AuthBladeProps {
  mode: AuthMode;
}

const AuthBlade = forwardRef<HTMLDivElement, AuthBladeProps>(function AuthBlade(
  { mode },
  ref
) {
  const copy = COPY[mode];

  return (
    <div
      ref={ref}
      aria-hidden
      className="absolute inset-y-0 left-0 w-[118%] z-20 pointer-events-none will-change-transform"
      style={{
        clipPath: "polygon(11% 0%, 100% 0%, 89% 100%, 0% 100%)",
        filter: "drop-shadow(0 20px 40px rgba(139,94,82,0.35))",
      }}
    >
      {/* Rose-gold fill + travelling sheen. These span the whole oversized blade
          and move with it — that's what reads as the brand treatment sweeping
          across the interface. The slow highlight is what sells polished metal
          over a printed gradient; it reuses the existing shimmer keyframe. */}
      <div className="absolute inset-0 bg-rose-gold-gradient" />
      <div
        className="absolute inset-0 bg-rose-gold-sheen animate-shimmer opacity-60"
        style={{ backgroundSize: "200% 100%" }}
      />

      {/* Everything that must stay legible sits in here and is counter-translated
          by the transition, so it holds still inside the visible slice instead of
          drifting off with the blade's overhang. The artwork belongs in here too:
          stretched across the full 118% blade it would be upscaled ~2x from a
          688px-wide portrait source and wash out to flat colour.
          Found by attribute rather than a second forwarded ref — the blade owns
          the only ref, and the transition resolves this from it. */}
      <div data-blade-content className="absolute inset-0 will-change-transform">
        {/* Sized to the visible slice, which also happens to match the source's
            portrait aspect almost exactly — so it crops and scales barely at all. */}
        {/* `isolation` matters: without it the mix-blend overlay below composites
            against the blade's opaque gradient as well as the photo, which washes
            the artwork out completely. Isolating keeps the blend on the image. */}
        <div className="relative h-full w-[41%] overflow-hidden isolate">
          <Image
            src="/images/model-2.jpeg"
            alt=""
            fill
            priority
            className="object-cover"
            style={{ objectPosition: "50% 28%" }}
            sizes="(max-width: 1279px) 46vw, 576px"
          />

          {/* `overlay` tints the artwork's own highlights and shadows rather than
              painting over them, so the photograph stays visible underneath. */}
          {/* soft-light, not overlay: the gradient's lightest stop is near-white,
              and overlay blows the photograph out to a flat wash. soft-light tints
              it while keeping the artwork readable. The second pass is a plain
              translucent tint that carries the rose-gold hue itself. */}
          <div className="absolute inset-0 bg-rose-gold-gradient opacity-85 mix-blend-soft-light" />
          <div className="absolute inset-0 bg-rose-gold-gradient opacity-[0.26]" />
          {/* Bottom scrim, purely for copy legibility. */}
          <div className="absolute inset-0 bg-gradient-to-t from-rose-dark/80 via-rose-dark/10 to-transparent" />

          <div className="relative h-full flex flex-col justify-end p-12 lg:p-16 text-off-white">
          <span className="label-caps text-soft-tan mb-4">{copy.eyebrow}</span>

          <h2
            className="text-off-white m-0"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.25rem, 3.4vw, 3.5rem)",
              fontWeight: 300,
              lineHeight: 0.98,
            }}
          >
            {copy.heading}
            <em className="block text-soft-tan italic">{copy.accent}</em>
          </h2>

          <div className="mt-6 max-w-sm space-y-1.5">
            {copy.lines.map((line) => (
              <p
                key={line}
                className="text-off-white/75 leading-relaxed"
                style={{ fontFamily: "var(--font-manrope)", fontSize: "0.9rem", fontWeight: 300 }}
              >
                {line}
              </p>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AuthBlade;
