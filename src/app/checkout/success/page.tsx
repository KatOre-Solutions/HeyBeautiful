import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessContent from "./SuccessContent";

export const metadata: Metadata = {
  title: "Thank You — Hey Beautiful",
  description: "Your payment is on its way.",
  // A payment landing page has no business in search results.
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <main>
      <Navbar />
      <SuccessContent />
      <Footer />
    </main>
  );
}
