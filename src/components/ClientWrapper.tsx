"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import WishlistSidebar from "@/components/WishlistSidebar";
import CartSidebar from "@/components/CartSidebar";
import CartNotification from "@/components/CartNotification";
import Analytics from "@/components/Analytics";
import ConsentBanner from "@/components/ConsentBanner";
import type { ReactNode } from "react";

export function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {children}
          <WishlistSidebar />
          <CartSidebar />
          <CartNotification />
          <Analytics />
          <ConsentBanner />
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
