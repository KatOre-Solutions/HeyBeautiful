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
import { getFeaturedProducts } from "@/lib/shopify";

export default async function Home() {
  const products = await getFeaturedProducts(); 
  return (
    <ClientWrapper>
      <main data-site-root>
        <Navbar />
        <HomeHero />
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
