"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A small string list persisted to localStorage, shared across tabs of this
 * browser. Used for the copytrade list and the alerts watchlist. Per viewer
 * only; never sent anywhere. Every access is guarded so a private window or
 * blocked storage never breaks the page.
 */
export function useLocalList(key: string): {
  items: string[];
  add: (v: string) => void;
  remove: (v: string) => void;
  has: (v: string) => boolean;
  toggle: (v: string) => void;
} {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, [key]);

  const persist = useCallback(
    (next: string[]) => {
      setItems(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  const norm = (v: string) => v.trim().replace(/^@/, "");

  const add = useCallback(
    (v: string) => {
      const n = norm(v);
      if (!n) return;
      setItems((prev) => {
        if (prev.some((x) => x.toLowerCase() === n.toLowerCase())) return prev;
        const next = [...prev, n];
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );

  const remove = useCallback(
    (v: string) => {
      const n = norm(v);
      setItems((prev) => {
        const next = prev.filter((x) => x.toLowerCase() !== n.toLowerCase());
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key],
  );

  const has = useCallback((v: string) => items.some((x) => x.toLowerCase() === norm(v).toLowerCase()), [items]);

  const toggle = useCallback((v: string) => (has(v) ? remove(v) : add(v)), [has, remove, add]);

  // persist is kept for callers that want to replace wholesale.
  void persist;

  return { items, add, remove, has, toggle };
}
