import type { Metadata } from "next";
import SignupContent from "./SignupContent";

export const metadata: Metadata = {
  title: "Create Account — Hey Beautiful",
};

export default function SignupPage() {
  return <SignupContent />;
}
