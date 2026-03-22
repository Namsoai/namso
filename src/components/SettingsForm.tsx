/**
 * SettingsForm — shared profile edit + password change component.
 *
 * Used by both BusinessSettings and FreelancerSettings. These two pages
 * had nearly identical logic and UI for updating profile fields and
 * changing passwords.
 *
 * Props:
 *   nameLabel – label for the name field (e.g. "Full Name" vs "Business / Contact Name")
 */

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsFormProps {
  /** Label shown above the name input field */
  nameLabel?: string;
}

export default function SettingsForm({ nameLabel = "Full Name" }: SettingsFormProps) {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();

  // ── Profile form state ──────────────────────────────────────────────────
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);

  // ── Password form state ─────────────────────────────────────────────────
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  /** Save profile changes (full_name + username). */
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, username })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
      await refreshProfile();
    }
    setSaving(false);
  };

  /** Change password with validation. */
  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) {
      toast({ title: "Min 6 characters", variant: "destructive" });
      return;
    }
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
      setNewPw("");
      setConfirmPw("");
    }
    setSavingPw(false);
  };

  return (
    <div className="max-w-lg space-y-8">
      {/* Profile section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div>
            <Label>{nameLabel}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </form>
      </div>

      {/* Password section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Change Password</h2>
        <form onSubmit={changePw} className="space-y-4">
          <div>
            <Label>New Password</Label>
            <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div>
            <Label>Confirm</Label>
            <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={savingPw}>
            {savingPw ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
