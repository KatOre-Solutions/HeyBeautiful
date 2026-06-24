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
}

export async function getFeaturedProducts(): Promise<ShopifyProduct[]> {
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    return [];
  }

  try {
    const response = await fetch(`${domain}/api/2026-04/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY }),
      next: { revalidate: 3600 },
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
