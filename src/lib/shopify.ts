import { createStorefrontApiClient } from "@shopify/storefront-api-client";

export const shopify = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!,
  apiVersion: "2026-04",
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!,
});

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
  };
  compareAtPriceRange: {
    minVariantPrice: { amount: string };
  };
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
  try {
    const { data, errors } = await shopify.request(PRODUCTS_QUERY, {
      fetchApiOptions: {
        next: { revalidate: 3600 },
      } as RequestInit,
    });

    if (errors || !data?.products) {
      console.error("Shopify query errors:", errors);
      return [];
    }

    return (data.products.edges as Array<{ node: ShopifyProductNode }>).map(
      ({ node }) => {
        const numericId = parseInt(node.id.split("/").pop() ?? "0", 10);
        const compareAmount = parseFloat(
          node.compareAtPriceRange?.minVariantPrice?.amount ?? "0"
        );

        return {
          id: `product:${numericId}`,
          name: node.title,
          category: node.productType || "Product",
          price: parseFloat(node.priceRange.minVariantPrice.amount),
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
