"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { customerService } from "@/services/customerService";

interface WishlistContextType {
  wishlist: string[];
  error: string;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

function readGuestWishlist() {
  const saved = localStorage.getItem("wishlist");
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved);
  return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
    ? parsed
    : [];
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isHydrated } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isHydrated) return;
    let active = true;

    if (!user) {
      Promise.resolve()
        .then(readGuestWishlist)
        .then((items) => {
          if (!active) return;
          setWishlist(items);
          setError("");
        })
        .catch(() => {
          if (active) {
            setError("Unable to read the saved guest wishlist from this browser.");
          }
        });
      return () => {
        active = false;
      };
    }

    customerService
      .getWishlist()
      .then(async (result) => {
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load your wishlist.");
        }

        const ids = new Set(
          result.data
            .map((row) => row.item_id)
            .filter(
              (id): id is string | number =>
                typeof id === "string" || typeof id === "number",
            )
            .map(String),
        );
        const guestIds = readGuestWishlist();
        for (const id of guestIds) {
          const itemId = Number(id);
          if (!Number.isSafeInteger(itemId) || itemId < 1 || ids.has(id)) continue;
          const added = await customerService.addWishlistItem(itemId);
          if (!added.success) {
            throw new Error(added.message || "Unable to save a wishlist item.");
          }
          ids.add(id);
        }
        if (!active) return;
        localStorage.removeItem("wishlist");
        setWishlist([...ids]);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (active) {
          const message =
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your wishlist.";
          setError(message);
          console.error(message);
        }
      });

    return () => {
      active = false;
    };
  }, [isHydrated, user]);

  const save = useCallback(
    async (id: string, shouldAdd: boolean) => {
      const itemId = Number(id);
      if (!Number.isSafeInteger(itemId) || itemId < 1) {
        setError("This product cannot be saved to your wishlist.");
        return;
      }

      if (user) {
        const result = shouldAdd
          ? await customerService.addWishlistItem(itemId)
          : await customerService.removeWishlistItem(itemId);
        if (!result.success) {
          throw new Error(result.message || "Unable to update your wishlist.");
        }
        setWishlist((current) =>
          shouldAdd
            ? current.includes(id)
              ? current
              : [...current, id]
            : current.filter((entry) => entry !== id),
        );
        return;
      }

      const next = shouldAdd
        ? wishlist.includes(id)
          ? wishlist
          : [...wishlist, id]
        : wishlist.filter((entry) => entry !== id);
      try {
        localStorage.setItem("wishlist", JSON.stringify(next));
      } catch {
        throw new Error("Unable to save the wishlist in this browser.");
      }
      setWishlist(next);
    },
    [user, wishlist],
  );

  const update = useCallback(
    (id: string, shouldAdd: boolean) => {
      setError("");
      void save(id, shouldAdd).catch((saveError: unknown) => {
        const message =
          saveError instanceof Error
            ? saveError.message
            : "Unable to update your wishlist.";
        setError(message);
        console.error(message);
      });
    },
    [save],
  );

  const toggle = useCallback(
    (id: string) => update(id, !wishlist.includes(id)),
    [update, wishlist],
  );
  const add = useCallback((id: string) => update(id, true), [update]);
  const remove = useCallback((id: string) => update(id, false), [update]);

  return (
    <WishlistContext.Provider value={{ wishlist, error, toggle, add, remove }}>
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
