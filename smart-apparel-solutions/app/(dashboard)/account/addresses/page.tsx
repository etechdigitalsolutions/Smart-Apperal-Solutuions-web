"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AccountPanel from "@/components/account/AccountPanel";
import { customerService } from "@/services/customerService";

type SavedAddress = Record<string, unknown>;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("LK");

  const loadAddresses = useCallback(async () => {
    const result = await customerService.getAddresses();
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.message || "Unable to load saved addresses.");
    }
    setAddresses(result.data);
  }, []);

  useEffect(() => {
    let active = true;
    customerService
      .getAddresses()
      .then((result) => {
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load saved addresses.");
        }
        if (active) setAddresses(result.data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load saved addresses.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const result = await customerService.createAddress({
        label: "Saved address",
        recipient_name: recipientName.trim(),
        phone: phone.trim(),
        address_line1: line1.trim(),
        city: city.trim(),
        postal_code: postalCode.trim(),
        country,
        is_default: addresses.length === 0,
      });
      if (!result.success) {
        throw new Error(result.message || "Unable to save this address.");
      }
      await loadAddresses();
      setRecipientName("");
      setPhone("");
      setLine1("");
      setCity("");
      setPostalCode("");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save this address.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeAddress(address: SavedAddress) {
    const id = address.address_id;
    if (typeof id !== "string" && typeof id !== "number") return;
    setError("");
    try {
      const result = await customerService.deleteAddress(String(id));
      if (!result.success) {
        throw new Error(result.message || "Unable to remove this address.");
      }
      setAddresses((current) =>
        current.filter((entry) => entry.address_id !== id),
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove this address.",
      );
    }
  }

  return (
    <AccountPanel
      title="Saved addresses"
      description="Manage the places where your equipment and parts should arrive."
    >
      {error ? (
        <p className="form-feedback form-error" role="alert">
          {error}
        </p>
      ) : null}
      {isLoading ? <p role="status">Loading saved addresses...</p> : null}
      {!isLoading && addresses.length ? (
        <div className="account-card">
          {addresses.map((address) => (
            <article key={String(address.address_id)} className="account-form-grid">
              <div>
                <h2>{String(address.label ?? "Saved address")}</h2>
                <p>{String(address.recipient_name ?? "")}</p>
                <p>{String(address.address_line1 ?? "")}</p>
                <p>
                  {[address.city, address.postal_code, address.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>{String(address.phone ?? "")}</p>
                {address.is_default === true ? <strong>Default address</strong> : null}
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => void removeAddress(address)}
              >
                Remove
              </button>
            </article>
          ))}
        </div>
      ) : null}
      {!isLoading && !addresses.length ? (
        <div className="empty-state" role="status">
          <h2>No saved addresses yet</h2>
          <p>Add an address to speed up future checkouts.</p>
        </div>
      ) : null}

      <form className="account-card account-form" onSubmit={addAddress}>
        <h2>Add an address</h2>
        <div className="account-form-grid">
          <label>
            Recipient name
            <input
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            Phone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={25}
              required
            />
          </label>
          <label>
            Address
            <input
              value={line1}
              onChange={(event) => setLine1(event.target.value)}
              maxLength={200}
              required
            />
          </label>
          <label>
            City
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            Postal code
            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              maxLength={20}
              required
            />
          </label>
          <label>
            Country code
            <input
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              maxLength={2}
              required
            />
          </label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save address"}
        </button>
      </form>
    </AccountPanel>
  );
}
