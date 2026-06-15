"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "hb-wishlist";

export interface WishlistProduct {
  /** Namespaced key, e.g. "product:1" — matches the cart's id scheme. */
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface WishlistContextType {
  items: WishlistProduct[];
  wishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;
  toggleItem: (product: WishlistProduct) => void;
  isWishlisted: (id: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  // Gate persistence until the stored wishlist has loaded, so the initial empty
  // state doesn't overwrite it. Starting empty also keeps SSR/first render in
  // sync (no hydration mismatch) — the restored wishlist applies after mount.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Keep only string-id entries (guards against legacy/corrupt data).
        const restored = (JSON.parse(raw) as WishlistProduct[]).filter(
          (p) => typeof p.id === "string"
        );
        setItems(restored);
      }
    } catch {
      // Corrupt/unavailable storage — start with an empty wishlist.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full / unavailable — non-fatal.
    }
  }, [items, loaded]);

  const toggleItem = (product: WishlistProduct) => {
    setItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const isWishlisted = (id: string) => items.some((p) => p.id === id);

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider
      value={{ items, wishlistOpen, setWishlistOpen, toggleItem, isWishlisted, clearWishlist }}
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
      isWishlisted: (_: string) => false,
      clearWishlist: () => {},
    };
  }
  return ctx;
}
