"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { WISHLIST_STORAGE_KEY as STORAGE_KEY } from "@/lib/constants";
import type { CartLine } from "@/lib/product";

export interface WishlistProduct {
  /**
   * Namespaced PRODUCT key, e.g. "product:1" — never variant-keyed. A wishlist
   * entry is a product, not a variant: `isWishlisted(product.id)` is what fills
   * the heart on both the card and the detail page, so this has to stay the id
   * those callers already hold.
   */
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  /**
   * The bag line this entry becomes when moved to the cart, captured at wish
   * time via `toCartItem()` (#63).
   *
   * The cart keys lines by variant (`product:1#4567`) while the wishlist keys by
   * product, so the two cannot share one id. Without this the wishlist handed
   * the cart a bare `product:1` and a product added from both surfaces opened
   * two rows with independent quantities.
   *
   * Optional because entries persisted before this existed — and bundles, which
   * have no variants — legitimately have none; those fall back to the product
   * fields, which is the old behaviour and correct for them.
   */
  cartLine?: CartLine;
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
        // One-time hydrate from localStorage on mount; can't read storage
        // during SSR/render without a hydration mismatch, so restore here.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
