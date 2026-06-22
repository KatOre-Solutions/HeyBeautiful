const API_URL = `${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;

const PRODUCTS_QUERY = `
  {
    products(first: 5) {
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
  }
`;

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
  id: number;
  name: string;
  category: string;
  price: number;
  currencyCode: string;
  originalPrice: number | null;
  image: string;
  tags: string[];
}

export async function getFeaturedProducts(): Promise<ShopifyProduct[]> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: PRODUCTS_QUERY }),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error('Shopify fetch error:', response.status, await response.text());
      return [];
    }

    const json = await response.json();
    if (json.errors || !json.data?.products) {
      console.error('Shopify query errors:', json.errors);
      return [];
    }

    return json.data.products.edges.map(({ node }: { node: ShopifyProductNode }) => {
      const numericId = parseInt(node.id.split('/').pop() ?? '0', 10);
      const compareAmount = parseFloat(node.compareAtPriceRange?.minVariantPrice?.amount ?? '0');

      return {
        id: numericId,
        name: node.title,
        category: node.productType || 'Product',
        price: parseFloat(node.priceRange.minVariantPrice.amount),
        currencyCode: node.priceRange.minVariantPrice.currencyCode,
        originalPrice: compareAmount > 0 ? compareAmount : null,
        image: node.images.edges[0]?.node.url ?? '/images/item-1.jpeg',
        tags: node.tags.slice(0, 3),
      };
    });
  } catch (err) {
    console.error('Shopify fetch failed:', err);
    return [];
  }
}
