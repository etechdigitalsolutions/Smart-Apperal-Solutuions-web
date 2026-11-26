"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LockKeyhole, LogOut, Trash2 } from "lucide-react";
import AccountPanel from "@/components/account/AccountPanel";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/ui/modal";
import { authService } from "@/services/authService";

export default function UserSettingsPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [deleteError, setDeleteError] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isChangingPassword) return;
    const userId = Number(user?.id);
    if (!Number.isSafeInteger(userId) || userId < 1) {
      setPasswordError("A valid account ID is not available for password changes.");
      return;
    }
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
      const result = await authService.changePassword({ userId, oldPassword, newPassword });
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

  function handleLogout() {
    logout();
    setConfirmLogout(false);
    router.replace("/login");
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
        <section className="account-card settings-card">
          <div className="settings-heading">
            <span className="stat-icon blue" aria-hidden>
              <Bell size={19} />
            </span>
            <div>
              <h2>Notification preferences</h2>
              <p>Notification preferences cannot be loaded or saved because no preference API is implemented.</p>
            </div>
          </div>
        </section>

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
