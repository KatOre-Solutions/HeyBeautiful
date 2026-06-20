const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const API_URL = `${STORE_DOMAIN}/api/2026-04/graphql.json`;

// Simple query using shorthand syntax for tokenless access
const PRODUCTS_QUERY = `{
  products(first: 5, sortKey: BEST_SELLING) {
    edges {
      node {
        id
        title
        handle
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

export async function getFeaturedProducts() {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: PRODUCTS_QUERY }),
  });

  // Log full error response so we can see what Shopify says
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Shopify fetch error:', response.status, errorText);
    return [];
  }

  const json = await response.json();

  if (json.errors) {
    console.error('Shopify query errors:', json.errors);
    return [];
  }

  return json.data.products.edges.map(({ node }: any) => {
    const compareAt = parseFloat(node.compareAtPriceRange?.minVariantPrice?.amount ?? '0');
    return {
      id: node.id,
      name: node.title,
      handle: node.handle,
      tags: node.tags,
      price: parseFloat(node.priceRange.minVariantPrice.amount),
      currencyCode: node.priceRange.minVariantPrice.currencyCode,
      originalPrice: compareAt > 0 ? compareAt : null,
      image: node.images.edges[0]?.node.url ?? '',
    };
  });
}
