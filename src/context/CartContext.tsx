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

const STORAGE_KEY = "hb-cart";

export interface CartProduct {
  /** Namespaced key, e.g. "product:1" or "bundle:glow" — never a bare number. */
  id: string;
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
        // Drop legacy entries with numeric ids (pre-#20): they no longer map to
        // any product and could collide with the new namespaced keys.
        const restored = (JSON.parse(raw) as CartProduct[]).filter(
          (p) => typeof p.id === "string"
        );
        setItems(restored);
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
    setItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // The notification only shows name/price/image, so quantity here is nominal.
    // `key` forces the toast to re-fire even when the same product is re-added.
    setLastAdded({ product: { ...product, quantity: 1 }, key: Date.now() });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) => (p.id === id ? { ...p, quantity } : p))
    );
  }, []);

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
