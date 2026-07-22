import { ClientWrapper } from "@/components/ClientWrapper";
import Navbar from "@/components/Navbar";
import HomeHero from "@/components/sections/HomeHero";
import BrandStory from "@/components/sections/BrandStory";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import Bundles from "@/components/sections/Bundles";
import Benefits from "@/components/sections/Benefits";
import Lifestyle from "@/components/sections/Lifestyle";
import Testimonials from "@/components/sections/Testimonials";
import Reviews from "@/components/sections/Reviews";
import Newsletter from "@/components/sections/Newsletter";
import Footer from "@/components/Footer";
import { headers } from "next/headers";
import { getFeaturedProducts } from "@/lib/shopify";

export default async function Home() {
  const products = await getFeaturedProducts();
  // #46: nonce minted per request in proxy.ts, threaded into HomeHero's inline
  // loader script. Reading it opts this page into dynamic rendering — inherent to
  // per-request nonces.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <ClientWrapper>
      <main data-site-root>
        <Navbar />
        <HomeHero nonce={nonce} />
        <BrandStory />
        <FeaturedProducts products={products} />
        <Bundles />
        <Benefits />
        <Lifestyle />
        <Testimonials />
        <Reviews />
        <Newsletter />
        <Footer />
      </main>
    </ClientWrapper>
  );
}
