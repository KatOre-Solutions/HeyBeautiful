import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CancelledContent from "./CancelledContent";

export const metadata: Metadata = {
  title: "Payment Cancelled — Hey Beautiful",
  description: "Your payment was cancelled and your bag is untouched.",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelledPage() {
  return (
    <main>
      <Navbar />
      <CancelledContent />
      <Footer />
    </main>
  );
}
