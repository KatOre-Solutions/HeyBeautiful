import type { Metadata } from "next";
import ForgotPasswordContent from "./ForgotPasswordContent";

export const metadata: Metadata = {
  title: "Reset Password — Hey Beautiful",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
