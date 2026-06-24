import type { Metadata } from "next";
import VerifyEmailContent from "./VerifyEmailContent";

export const metadata: Metadata = {
  title: "Verify Email — Hey Beautiful",
};

export default function VerifyEmailPage() {
  return <VerifyEmailContent />;
}
