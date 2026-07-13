const PRODUCTS_QUERY = `{
  products(first: 5, sortKey: BEST_SELLING) {
    edges {
      node {
        id
        title
        productType
        tags
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
          }
        }
        images(first: 1) {
          edges {
            node {
              url
              altText
            }
          }
        }
      }
    }
  }
}`;

interface ShopifyProductNode {
  id: string;
  title: string;
  productType: string;
  tags: string[];
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  } | null;
  compareAtPriceRange: {
    minVariantPrice: { amount: string };
  } | null;
  images: {
    edges: Array<{ node: { url: string; altText: string | null } }>;
  };
}

export interface ShopifyProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  tags: string[];
  placeholder?: boolean;
  // Optional fields the storefront card renders when present. Not populated by
  // the home/featured query yet; wired up when the store pages migrate onto
  // ShopifyProduct so the shared ProductCard can show detail links + ratings.
  /** Enables the card's stretched link to `/store/<slug>`. */
  slug?: string;
  rating?: number;
  reviews?: number;
  /** Explicit badge label; falls back to a "Sale" badge when `originalPrice` is set. */
  badge?: string;
  badgeColor?: string;
}

const placeholderProducts: ShopifyProduct[] = [
  { id: "product:1", name: "Glow Collagen Blend", category: "Beauty Support", price: 54, originalPrice: 68, image: "", tags: ["Skin", "Hair", "Nails"], placeholder: true },
  { id: "product:2", name: "Plant Protein Luxe", category: "Performance", price: 62, originalPrice: null, image: "", tags: ["Protein", "Recovery", "Clean"], placeholder: true },
  { id: "product:3", name: "Morning Glow Ritual", category: "Wellness", price: 48, originalPrice: 58, image: "", tags: ["Energy", "Mood", "Focus"], placeholder: true },
  { id: "product:4", name: "Recovery Rose Blend", category: "Recovery", price: 44, originalPrice: null, image: "", tags: ["Sleep", "Repair", "Calm"], placeholder: true },
  { id: "product:5", name: "Strength & Radiance", category: "Performance", price: 58, originalPrice: 72, image: "", tags: ["Strength", "Glow", "Vitality"], placeholder: true },
];

export async function getFeaturedProducts(): Promise<ShopifyProduct[]> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    return placeholderProducts;
  }

  try {
    const response = await fetch(`${domain}/api/2026-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY }),
      // Freshness comes from the "products" tag, which Shopify's webhook busts
      // via /api/revalidate. The long window is only a safety net for a missed
      // webhook, so it stays hourly rather than adding origin load.
      next: { revalidate: 3600, tags: ["products"] },
    });

    if (!response.ok) {
      console.error("Shopify fetch error:", response.status);
      return [];
    }

    const json = await response.json();

    if (json.errors || !json.data?.products) {
      console.error("Shopify query errors:", json.errors);
      return [];
    }

    return (json.data.products.edges as Array<{ node: ShopifyProductNode }>).map(
      ({ node }) => {
        const numericId = parseInt(node.id.split("/").pop() ?? "0", 10);
        const compareAmount = parseFloat(
          node.compareAtPriceRange?.minVariantPrice?.amount ?? "0"
        );

        return {
          id: `product:${numericId}`,
          name: node.title,
          category: node.productType || "Product",
          price: parseFloat(node.priceRange?.minVariantPrice?.amount ?? "0"),
          originalPrice: compareAmount > 0 ? compareAmount : null,
          image: node.images.edges[0]?.node.url ?? "/images/item-1.jpeg",
          tags: node.tags.slice(0, 3),
        };
      }
    );
  } catch (err) {
    console.error("Shopify fetch failed:", err);
    return [];
  }
}
