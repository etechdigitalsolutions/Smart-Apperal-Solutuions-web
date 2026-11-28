"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import AccountPanel from "@/components/account/AccountPanel";
import { useAuth } from "@/hooks/useAuth";
import { customerService } from "@/services/customerService";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [initialName, setInitialName] = useState(user?.name ?? "");
  const [initialPhone, setInitialPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    customerService
      .getProfile()
      .then((result) => {
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load your profile.");
        }
        const profile = result.data[0];
        if (!active || !profile) return;
        const profileName = String(profile.full_name ?? user.name);
        const profilePhone = String(profile.phone ?? "");
        setName(profileName);
        setInitialName(profileName);
        setPhone(profilePhone);
        setInitialPhone(profilePhone);
      })
      .catch((error: unknown) => {
        if (active) {
          setSubmitError(
            error instanceof Error ? error.message : "Unable to load your profile.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSubmitError("");
    try {
      const result = await customerService.updateProfile({
        full_name: name.trim(),
        phone: phone.trim(),
      });
      if (!result.success) {
        throw new Error(result.message || "Unable to save your profile.");
      }
      setInitialName(name.trim());
      setInitialPhone(phone.trim());
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Unable to save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function cancel() {
    setName(initialName);
    setPhone(initialPhone);
  }

  function onAvatarChange(file: File | null) {
    if (!file) return;
    setAvatarError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("The image must be 5 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setAvatar(null);
  }

  const dirty = name !== initialName || phone !== initialPhone;

  return (
    <AccountPanel
      title="My profile"
      description="Keep your contact details current for faster quotations and delivery updates."
    >
      <form className="account-card account-form" onSubmit={save}>
        <div className="profile-hero">
          <div className="profile-avatar-wrap">
            <div className="account-avatar large" aria-hidden>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" />
              ) : (
                <UserRound size={25} />
              )}
            </div>
            <label className="profile-avatar-action" title="Change photo">
              <Camera size={14} aria-hidden />
              <span className="sr-only">Upload profile photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => onAvatarChange(event.target.files?.[0] ?? null)}
              />
            </label>
            <small>Preview only; profile photo upload is unavailable.</small>
            {avatarError ? <p className="form-error-text" role="alert">{avatarError}</p> : null}
            {avatar ? (
              <button type="button" className="profile-avatar-remove" onClick={removeAvatar}>
                Remove photo
              </button>
            ) : null}
          </div>
          <div>
            <h2>Personal information</h2>
            <p>Your profile is loaded and saved securely to your customer account.</p>
          </div>
        </div>

        <div className="account-form-grid">
          <label htmlFor="profile-name">
            Full name
            <input
              id="profile-name"
              name="name"
              value={name}
              onChange={(event) => { setName(event.target.value); setSubmitError(""); }}
              autoComplete="name"
              required
            />
          </label>
          <label htmlFor="profile-email">
            Email address
            <input
              id="profile-email"
              name="email"
              value={user?.email ?? ""}
              readOnly
              autoComplete="email"
            />
          </label>
          <label htmlFor="profile-phone">
            Phone number
            <input
              id="profile-phone"
              name="phone"
              value={phone}
              onChange={(event) => { setPhone(event.target.value); setSubmitError(""); }}
              autoComplete="tel"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={cancel}
            disabled={!dirty}
          >
            Cancel
          </button>
          {submitError ? <p className="form-feedback form-error" role="alert">{submitError}</p> : null}
        </div>
      </form>
    </AccountPanel>
  );
}
