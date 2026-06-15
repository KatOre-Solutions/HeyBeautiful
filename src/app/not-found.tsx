import Link from "next/link";

// Explicit 404. Providing our own avoids the synthetic `/_not-found` page that
// trips the same `Expected workStore to be initialized` InvariantError during
// prerender on Next 16 + Turbopack.
export const metadata = {
  title: "Page not found — Hey Beautiful",
};

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center section-padding"
      style={{ background: "#faf7f4" }}
    >
      <div className="text-center max-w-md">
        <p className="label-caps text-rose-gold mb-4">Error 404</p>
        <h1
          className="heading-display text-ink mb-3"
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
          }}
        >
          Page not found
        </h1>
        <p
          className="text-ink/55 mb-8 leading-relaxed"
          style={{ fontFamily: "var(--font-manrope)", fontSize: "0.95rem", fontWeight: 300 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="btn-outline">
            Back Home
          </Link>
          <Link href="/store" className="btn-outline">
            Shop the Store
          </Link>
        </div>
      </div>
    </main>
  );
}
