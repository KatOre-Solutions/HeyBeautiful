import type { Metadata } from "next";
import LoginContent from "./LoginContent";

export const metadata: Metadata = {
  title: "Sign In — Hey Beautiful",
};

export default function LoginPage() {
  return <LoginContent />;
}
