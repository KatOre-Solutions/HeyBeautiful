/**
 * Renders a schema.org payload as JSON-LD (#14).
 *
 * Server-rendered on purpose — no `"use client"`. The payload has to be in the initial
 * HTML, because that is what crawlers read; a client-rendered block would be invisible to
 * most of them.
 *
 * NOT nonced, and deliberately so. `src/proxy.ts` sets `script-src 'self' 'nonce-…'`, but
 * a script whose type is not an executable one is a *data block*: the HTML spec bails out
 * of "prepare the script element" before the CSP inline check, so `script-src` never
 * applies here. Noncing it would mean reading `headers()` in the pages that use it, which
 * would demote the prerendered product routes to dynamic rendering for no benefit.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Escaping `<` is load-bearing, not cosmetic. Product descriptions are
      // merchant-controlled free text straight out of Shopify, so one containing
      // `</script>` would otherwise close this tag early and have the rest of the
      // payload parsed as markup. `<` is valid JSON and reads back as `<`.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
