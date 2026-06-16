"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface WishlistProduct {
  id: number;
  name: string;
  // category: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  items: WishlistProduct[];
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  toggleItem: (product: WishlistProduct) => void;
  isWishlisted: (id: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const toggleItem = (product: WishlistProduct) => {
    setItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const isWishlisted = (id: number) => items.some((p) => p.id === id);

  return (
    <WishlistContext.Provider
      value={{ items, wishlistOpen, setWishlistOpen, toggleItem, isWishlisted }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      items: [] as WishlistProduct[],
      wishlistOpen: false,
      setWishlistOpen: (_: boolean) => {},
      toggleItem: (_: WishlistProduct) => {},
      isWishlisted: (_: number) => false,
    };
  }
  return ctx;
}
