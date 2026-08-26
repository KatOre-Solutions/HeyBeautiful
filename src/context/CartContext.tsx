"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import { toAnalyticsItem, trackEcommerce } from "@/lib/analytics";
import { CART_STORAGE_KEY as STORAGE_KEY, MAX_CART_QUANTITY } from "@/lib/constants";

export interface CartProduct {
  /**
   * Namespaced key, e.g. "product:1" — never a bare number. Variant-specific
   * lines append `#<variantId>` so two sizes are distinct rows. Bundles no
   * longer enter the bag (#92): they have no Shopify variant, so they could
   * never be checked out.
   */
  id: string;
  /**
   * Numeric Shopify variant id, mirroring `CartLine.variantId` (#92). `null`
   * means the line cannot be purchased. See the restore filter below for how
   * entries persisted before this field are handled.
   */
  variantId: string | null;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  items: CartProduct[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addItem: (product: Omit<CartProduct, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  isInCart: (id: string) => boolean;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
  /** The most recently added product — drives the "Added to bag" notification. */
  lastAdded: { product: CartProduct; key: number } | null;
  clearLastAdded: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartProduct[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartContextType["lastAdded"]>(null);
  // Gate persistence until the stored cart has loaded, so the initial empty
  // state doesn't overwrite it. Starting empty also keeps SSR/first-render in
  // sync (no hydration mismatch) — the restored cart applies after mount.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Drop legacy entries with numeric ids (pre-#20): they no longer map to
          // any product and could collide with the new namespaced keys.
          //
          // Also drop anything saved before `variantId` existed (#92), mirroring
          // what the wishlist does for `cartLine`. A stored line cannot be
          // repaired — the variant list isn't in it — so falling back would put
          // an unbuyable line in front of the checkout handoff. Two things make
          // dropping safe: `clearLocalUserState()` already wipes this key on
          // sign-out, and nothing is in production yet, so no real bag is lost.
          // Positive check rather than `!== undefined`: the parsed value is
          // untrusted JSON, so anything that isn't a well-formed variantId —
          // absent, or a number from a hand-edited store — is treated as legacy.
          const restored = parsed.filter(
            (p) =>
              typeof p.id === "string" &&
              (typeof p.variantId === "string" || p.variantId === null)
          );
          // One-time hydrate from localStorage on mount; can't read storage
          // during SSR/render without a hydration mismatch, so restore here.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setItems(restored);
        }
      }
    } catch {
      // Corrupt/unavailable storage — start with an empty cart.
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

  const addItem = useCallback((product: Omit<CartProduct, "quantity">) => {
    // Fired outside the state updater on purpose: React may invoke an updater twice in
    // development StrictMode, which would double-count the event.
    trackEcommerce("add_to_cart", [toAnalyticsItem(product, 1)]);

    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // `key` forces the toast to re-fire even when the same product is re-added.
    setLastAdded({ product: { ...product, quantity: 1 }, key: Date.now() });
  }, []);

  const removeItem = useCallback((id: string) => {
    const going = items.find((p) => p.id === id);
    if (going) {
      trackEcommerce("remove_from_cart", [
        toAnalyticsItem(going, going.quantity),
      ]);
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
    // `items` in the deps is free here: the provider's value is an inline object, so it is
    // rebuilt on every render anyway and no consumer was relying on a stable identity.
  }, [items]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    // Clamped to the same ceiling the checkout endpoint enforces (#31), so the
    // control simply stops rather than letting a shopper build a bag that is
    // rejected at the last step.
    const capped = Math.min(quantity, MAX_CART_QUANTITY);

    // Stepping a line down to zero is a removal, and reads as one in the funnel.
    if (capped <= 0) {
      const going = items.find((p) => p.id === id);
      if (going) {
        trackEcommerce("remove_from_cart", [
          toAnalyticsItem(going, going.quantity),
        ]);
      }
    }

    setItems((prev) =>
      capped <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) => (p.id === id ? { ...p, quantity: capped } : p))
    );
  }, [items]);

  const isInCart = useCallback(
    (id: string) => items.some((p) => p.id === id),
    [items]
  );

  const clearCart = useCallback(() => setItems([]), []);

  const clearLastAdded = useCallback(() => setLastAdded(null), []);

  const itemCount = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, p) => sum + p.price * p.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cartOpen,
        setCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        isInCart,
        clearCart,
        itemCount,
        totalPrice,
        lastAdded,
        clearLastAdded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [] as CartProduct[],
      cartOpen: false,
      setCartOpen: (_: boolean) => {},
      addItem: (_: Omit<CartProduct, "quantity">) => {},
      removeItem: (_: string) => {},
      updateQuantity: (_: string, __: number) => {},
      isInCart: (_: string) => false,
      clearCart: () => {},
      itemCount: 0,
      totalPrice: 0,
      lastAdded: null,
      clearLastAdded: () => {},
    } satisfies CartContextType;
  }
  return ctx;
}
