import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getProducts, getProductBySlug, getRelatedProducts } from "@/lib/shopify";
import ProductDetailContent from "./ProductDetailContent";

export async function generateStaticParams() {
  const products = await getProducts();
  // Placeholders have no Shopify handle, so they get no detail page.
  return products.filter((p) => p.slug).map((p) => ({ slug: p.slug! }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Hey Beautiful" };
  return {
    title: `${product.name} — Hey Beautiful`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, all] = await Promise.all([getProductBySlug(slug), getProducts()]);
  if (!product) notFound();

  const related = getRelatedProducts(product, all);

  return (
    <main>
      <Navbar />
      <ProductDetailContent product={product} related={related} />
      <Footer />
    </main>
  );
}
