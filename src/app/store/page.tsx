import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProducts } from "@/lib/shopify";
import StoreContent from "./StoreContent";

export const metadata: Metadata = {
  title: "Store — Hey Beautiful",
  description:
    "Shop the full Hey Beautiful collection — premium feminine wellness supplements and curated bundles.",
};

export default async function StorePage() {
  const products = await getProducts();

  return (
    <main>
      <Navbar />
      <StoreContent products={products} />
      <Footer />
    </main>
  );
}
