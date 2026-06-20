import { createStorefrontApiClient } from "@shopify/storefront-api-client";

export const shopify = createStorefrontApiClient({
    storeDomain : process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!,
    apiVersion : '2026-04',
     publicAccessToken : process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!,
});