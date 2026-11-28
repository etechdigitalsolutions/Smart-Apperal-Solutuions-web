"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LockKeyhole, LogOut, Trash2 } from "lucide-react";
import AccountPanel from "@/components/account/AccountPanel";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/ui/modal";
import { authService } from "@/services/authService";
import { customerService } from "@/services/customerService";

export default function UserSettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [deleteError, setDeleteError] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState(false);
  const [preferencesError, setPreferencesError] = useState("");
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    let active = true;
    customerService
      .getPreferences()
      .then((result) => {
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load preferences.");
        }
        const preferences = result.data[0];
        if (active && preferences) {
          setEmailUpdates(preferences.email_updates === true);
          setWhatsappUpdates(preferences.whatsapp_updates === true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setPreferencesError(
            error instanceof Error ? error.message : "Unable to load preferences.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  async function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPreferences(true);
    setPreferencesError("");
    setPreferencesSaved(false);
    try {
      const result = await customerService.savePreferences({
        email_updates: emailUpdates,
        whatsapp_updates: whatsappUpdates,
        consent_version: "v1",
      });
      if (!result.success) {
        throw new Error(result.message || "Unable to save preferences.");
      }
      setPreferencesSaved(true);
    } catch (error) {
      setPreferencesError(
        error instanceof Error ? error.message : "Unable to save preferences.",
      );
    } finally {
      setIsSavingPreferences(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChangingPassword) return;
    if (newPassword.length < 8 || newPassword !== confirmPassword) {
      setPasswordError(newPassword.length < 8
        ? "The new password must be at least 8 characters."
        : "The new passwords do not match.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordChanged(false);
    try {
      const result = await authService.changePassword({
        currentPassword: oldPassword,
        newPassword,
      });
      if (!result.success) throw new Error(result.message || "Unable to update the password.");
      setPasswordChanged(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to update the password.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      setConfirmLogout(false);
      router.replace("/login");
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
    }
  }

  function handleDelete() {
    setDeleteError(true);
    setConfirmDelete(false);
  }

  return (
    <AccountPanel
      title="Account settings"
      description="Choose how we keep you informed and manage your account security."
    >
      <div className="settings-stack">
        <form className="account-card settings-card" onSubmit={savePreferences}>
          <div className="settings-heading">
            <span className="stat-icon blue" aria-hidden>
              <Bell size={19} />
            </span>
            <div>
              <h2>Notification preferences</h2>
              <p>Choose how you would like to receive customer updates.</p>
            </div>
          </div>
          <label>
            <input
              type="checkbox"
              checked={emailUpdates}
              onChange={(event) => setEmailUpdates(event.target.checked)}
            />
            Email updates
          </label>
          <label>
            <input
              type="checkbox"
              checked={whatsappUpdates}
              onChange={(event) => setWhatsappUpdates(event.target.checked)}
            />
            WhatsApp updates
          </label>
          {preferencesError ? (
            <p className="form-feedback form-error" role="alert">
              {preferencesError}
            </p>
          ) : null}
          {preferencesSaved ? (
            <p className="form-feedback form-success" role="status">
              Preferences saved.
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary" disabled={isSavingPreferences}>
            {isSavingPreferences ? "Saving..." : "Save preferences"}
          </button>
        </form>

        <form className="account-card settings-card" onSubmit={changePassword}>
          <div className="settings-heading">
            <span className="stat-icon green" aria-hidden>
              <LockKeyhole size={19} />
            </span>
            <div>
              <h2>Password & security</h2>
              <p>Change your password using your current password.</p>
            </div>
          </div>
          <label>Current password<input type="password" autoComplete="current-password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required /></label>
          <label>New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} required /></label>
          <label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required /></label>
          {passwordError ? <p className="form-feedback form-error" role="alert">{passwordError}</p> : null}
          {passwordChanged ? <p className="form-feedback form-success" role="status">Password updated successfully.</p> : null}
          <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
            {isChangingPassword ? "Updating..." : "Change password"}
          </button>
        </form>
      </div>

      <section className="account-card settings-card danger-zone" aria-labelledby="danger-zone-title">
        <div className="settings-heading">
          <span className="stat-icon pink" aria-hidden>
            <Trash2 size={19} />
          </span>
          <div>
            <h2 id="danger-zone-title">Danger zone</h2>
            <p>Sign out of this device or request account deletion from support.</p>
          </div>
        </div>
        <div className="danger-actions">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmLogout(true)}>
            <LogOut size={16} aria-hidden /> Logout
          </button>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={16} aria-hidden /> Request account deletion
          </button>
        </div>
        {logoutError ? (
          <p className="form-feedback form-error" role="alert">
            {logoutError}
          </p>
        ) : null}
      </section>

      {deleteError ? <p className="form-feedback form-error" role="alert">Account deletion is unavailable. No account data was deleted. Please contact support.</p> : null}

      <Modal
        open={confirmLogout}
        title="Sign out?"
        onClose={() => setConfirmLogout(false)}
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setConfirmLogout(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </>
        }
      >
        <p>You will need to sign in again to access your account.</p>
      </Modal>

      <Modal
        open={confirmDelete}
        title="Delete account data?"
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Confirm request
            </button>
          </>
        }
      >
        <p>
          The backend does not provide an account-deletion API. No account data will be removed by this action.
        </p>
      </Modal>
    </AccountPanel>
  );
}
