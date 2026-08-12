// One currency formatter for the whole storefront (#4). Shopify returns prices as
// decimal strings, so most SKUs are whole rands: "R 54,00" on every card is noise,
// but silently dropping the cents on "R 54,99" is a lie. Before this there were
// three copies of this formatter with two different rounding rules, so a product
// detail page could print "R 75,00" beside a related card reading "R 68".
//
// Rule: cents only when there are cents. Round to cents FIRST, so a float sum like
// 19.99 * 3 = 59.97000000000001 isn't misread as "has sub-cent digits", and a
// 100.00000000001 total still prints "R 100".
const ZAR_WHOLE = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ZAR_CENTS = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * The storefront money format: "R 54" for whole amounts, "R 54,99" when there
 * are cents. Use this everywhere a price is shown — never construct an
 * `Intl.NumberFormat` in a component, or the same product ends up rendering two
 * different ways on one screen.
 */
export function formatPrice(amount: number): string {
  const cents = Math.round(amount * 100);
  return (cents % 100 === 0 ? ZAR_WHOLE : ZAR_CENTS).format(cents / 100);
}
