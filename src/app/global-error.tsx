"use client";

// Explicit global-error boundary. Providing our own avoids the synthetic
// `/_global-error` page that trips an `Expected workStore to be initialized`
// InvariantError during prerender on Next 16 + Turbopack. global-error must
// render its own <html>/<body> because it replaces the root layout.
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f4",
          color: "#1e1814",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: "#c9977a",
              marginBottom: "1rem",
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 400,
              margin: "0 0 0.75rem",
            }}
          >
            We hit an unexpected error
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "rgba(30,24,20,0.6)",
              margin: "0 0 1.75rem",
              lineHeight: 1.6,
            }}
          >
            Sorry about that. Please try again — if it keeps happening, refresh
            the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.85rem 2rem",
              borderRadius: "9999px",
              border: "none",
              background: "#c9977a",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
