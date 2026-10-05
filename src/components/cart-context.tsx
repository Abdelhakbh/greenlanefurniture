"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
export type CartLine = {
  productId: number;
  variantId: number;
  handle: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  optionLabel?: string;
  attributes?: Record<string, string>;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: number, qty: number) => void;
  remove: (variantId: number) => void;
  clearCart: () => void;
  checkoutUrl: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const STORAGE_KEY = "green-lane-cart-v1";

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback(
    (line: Omit<CartLine, "qty">, qty = 1) => {
      setLines((prev) => {
        const i = prev.findIndex((l) => l.variantId === line.variantId);
        if (i >= 0) {
          const next = [...prev];
          next[i] = { ...next[i], qty: next[i].qty + qty };
          return next;
        }
        return [...prev, { ...line, qty }];
      });
      setOpen(true);
    },
    [],
  );

  const setQty = useCallback((variantId: number, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.variantId === variantId ? { ...l, qty } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const remove = useCallback((variantId: number) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const count = useMemo(
    () => lines.reduce((n, l) => n + l.qty, 0),
    [lines],
  );

  const checkoutUrl = useMemo(
    () => (lines.length ? "/checkout" : "/shop"),
    [lines.length],
  );

  const value = useMemo(
    () => ({
      lines,
      count,
      add,
      setQty,
      remove,
      clearCart,
      checkoutUrl,
      open,
      setOpen,
    }),
    [lines, count, add, setQty, remove, clearCart, checkoutUrl, open],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
