import { ClientWrapper } from "@/components/ClientWrapper";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import BrandStory from "@/components/sections/BrandStory";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import Bundles from "@/components/sections/Bundles";
import Benefits from "@/components/sections/Benefits";
import Lifestyle from "@/components/sections/Lifestyle";
import Reviews from "@/components/sections/Reviews";
import Newsletter from "@/components/sections/Newsletter";
import Footer from "@/components/Footer";
import { getFeaturedProducts } from "@/lib/shopify";

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <ClientWrapper>
      <main>
        <Navbar />
        <Hero />
        <BrandStory />
        <FeaturedProducts products={products} />
        <Bundles />
        <Benefits />
        <Lifestyle />
        <Reviews />
        <Newsletter />
        <Footer />
      </main>
    </ClientWrapper>
  );
}
