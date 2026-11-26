"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

interface WishlistContextType {
  wishlist: string[];
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);
const serverWishlist: string[] = [];
const subscribers = new Set<() => void>();
let cachedWishlist: string[] | undefined;

function getWishlistSnapshot() {
  if (typeof window === "undefined") return serverWishlist;
  if (cachedWishlist) return cachedWishlist;

  const saved = localStorage.getItem("wishlist");
  if (!saved) {
    cachedWishlist = serverWishlist;
    return cachedWishlist;
  }

  try {
    const parsed: unknown = JSON.parse(saved);
    cachedWishlist = Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
      ? parsed
      : serverWishlist;
  } catch {
    cachedWishlist = serverWishlist;
  }
  return cachedWishlist;
}

function notifyStorageChange() {
  cachedWishlist = undefined;
  subscribers.forEach((subscriber) => subscriber());
}

function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  window.addEventListener("storage", notifyStorageChange);
  return () => {
    subscribers.delete(subscriber);
    window.removeEventListener("storage", notifyStorageChange);
  };
}

function saveWishlist(wishlist: string[]) {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  cachedWishlist = wishlist;
  subscribers.forEach((subscriber) => subscriber());
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlist = useSyncExternalStore(
    subscribe,
    getWishlistSnapshot,
    () => serverWishlist
  );

  function toggle(id: string) {
    saveWishlist(
      wishlist.includes(id)
        ? wishlist.filter((item) => item !== id)
        : [...wishlist, id]
    );
  }

  function add(id: string) {
    if (!wishlist.includes(id)) saveWishlist([...wishlist, id]);
  }

  function remove(id: string) {
    saveWishlist(wishlist.filter((item) => item !== id));
  }

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, add, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
