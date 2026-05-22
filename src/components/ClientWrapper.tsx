"use client";

import { WishlistProvider } from "@/context/WishlistContext";
import WishlistSidebar from "@/components/WishlistSidebar";
import type { ReactNode } from "react";

export function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <WishlistProvider>
      {children}
      <WishlistSidebar />
    </WishlistProvider>
  );
}
