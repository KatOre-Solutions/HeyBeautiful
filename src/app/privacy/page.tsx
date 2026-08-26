import type { Metadata } from "next";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PrivacyContent from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy — Hey Beautiful",
  description:
    "How Hey Beautiful collects, uses and stores your personal information, and the choices you have.",
};

export default function PrivacyPage() {
  return (
    <main>
      <Navbar />
      <PrivacyContent />
      <Footer />
    </main>
  );
}
