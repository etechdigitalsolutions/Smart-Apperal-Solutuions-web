"use client";

import { FormEvent, useEffect, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import AccountPanel from "@/components/account/AccountPanel";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [initialName, setInitialName] = useState(user?.name ?? "");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setName(user?.name ?? "");
      setInitialName(user?.name ?? "");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [user?.name]);

  function save(event: FormEvent) {
    event.preventDefault();
    setSubmitError(true);
  }

  function cancel() {
    setName(initialName);
    setPhone("");
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

  const dirty = name !== initialName || phone !== "";

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
            <p>Profile changes cannot be saved because the backend profile API is unavailable.</p>
          </div>
        </div>

        <div className="account-form-grid">
          <label htmlFor="profile-name">
            Full name
            <input
              id="profile-name"
              name="name"
              value={name}
              onChange={(event) => { setName(event.target.value); setSubmitError(false); }}
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
              onChange={(event) => { setPhone(event.target.value); setSubmitError(false); }}
              autoComplete="tel"
            />
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save changes
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={cancel}
            disabled={!dirty}
          >
            Cancel
          </button>
          {submitError ? <p className="form-feedback form-error" role="alert">Your profile was not saved. The backend does not provide a profile update or image upload API.</p> : null}
        </div>
      </form>
    </AccountPanel>
  );
}
