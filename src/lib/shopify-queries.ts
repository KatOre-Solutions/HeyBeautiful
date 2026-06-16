import {shopify} from './shopify';

const PRODUCTS_QUERY = `#graphql
    query FeaturedProducts {
     # Fetch the first 5 products, sorted by best selling
    products (first: 5, sortKey: BEST_SELLING) {
      edges{
        node {
            id              # Unique product ID from Shopify
          title             # Product name e.g. "Glow Collagen Blend"
          handle            # URL-friendly name e.g. "glow-collagen-blend"
          tags              # Tags added in Shopify admin e.g. ["Skin", "Hair"]
              # The current selling price
 priceRange {
            minVariantPrice {
              amount        # Price as a string e.g. "54.00"
              currencyCode  # e.g. "USD" or "ZAR"
            }
          }
        # The original price (only exists if the product is on sale)
          compareAtPriceRange {
            minVariantPrice {
              amount
            }
          }

          # Fetch just the first image of the product
          images(first: 1) {
            edges {
              node {
                url         # Direct image URL from Shopify CDN
                altText     # Accessibility description of the image
              }
            }
          }
        }
      }
    }
  }
`;

// This function is what your app will call to get products.
// It sends the query to Shopify and returns a clean, simple array.
export async function getFeaturedProducts() {
  // Send the query to Shopify and wait for the response
  const { data, errors } = await shopify.request(PRODUCTS_QUERY);

    // If Shopify returns any errors, log them and return an empty array
  // so the page doesn't crash — it just shows no products
  if (errors) {
    console.error('Shopify query errors:', errors);
    return [];
  }
  // Transform the raw Shopify response into a simple, clean format
  // that your FeaturedProducts component can easily use
  return data.products.edges.map(({ node }: any) => ({
    id: node.id,
    name: node.title,
    handle: node.handle,
    tags: node.tags,

    // Convert price from string "54.00" to number 54
      price: parseFloat(node.priceRange.minVariantPrice.amount),

    // Only include originalPrice if the product is on sale, otherwise null
    originalPrice: node.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
      : null,

    // Get the first image URL, or empty string if no image exists
    image: node.images.edges[0]?.node.url ?? '',

 }));
}