import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  // profile.username is now typed from the updated profiles schema
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    // Use profiles.id (auth UID) as the canonical lookup key
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, username })
      .eq("id", user.id);
    if (error) toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); await refreshProfile(); }
    setSaving(false);
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) { toast({ title: "Min 6 characters", variant: "destructive" }); return; }
    if (newPw !== confirmPw) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setSavingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    if (error) toast({ title: error.message, variant: "destructive" });
    else { toast({ title: "Password updated" }); setNewPw(""); setConfirmPw(""); }
    setSavingPw(false);
  };

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Admin Settings</h1>
      <div className="max-w-lg space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div><Label>Email</Label><p className="text-sm text-muted-foreground">{user?.email}</p></div>
            <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </form>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Change Password</h2>
          <form onSubmit={changePw} className="space-y-4">
            <div><Label>New Password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 6 characters" /></div>
            <div><Label>Confirm</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
            <Button type="submit" variant="outline" disabled={savingPw}>{savingPw ? "Updating..." : "Update Password"}</Button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
