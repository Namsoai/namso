import { useEffect, useState } from "react";
import { Search, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { adminSidebarItems } from "./AdminOverview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { ProfileExtended, UserRoleInsert } from "@/types/entities";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminAdmins() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<ProfileExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function load() {
    // user_roles holds the admin grants; profiles.id is the canonical auth UID
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!roles?.length) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    const ids = roles.map((r) => r.user_id);
    // profiles.id === auth UID — use .in("id", ...) not .in("user_id", ...)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    setAdmins((profiles ?? []) as ProfileExtended[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const handleInviteAdmin = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);

    // Check if user already exists with this email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", inviteEmail.trim())
      .maybeSingle();

    if (existingProfile) {
      // User exists — add admin role using typed insert
      const roleInsert: UserRoleInsert = { user_id: existingProfile.id, role: "admin" };
      const { error } = await supabase.from("user_roles").insert(roleInsert);
      if (error) {
        if (error.code === "23505") {
          toast({ title: "This user is already an admin" });
        } else {
          toast({ title: "Error adding admin role", description: error.message, variant: "destructive" });
        }
      } else {
        toast({ title: "Admin role added successfully" });
      }
    } else {
      // User doesn't exist — invite via edge function
      const { error } = await supabase.functions.invoke("approve-freelancer", {
        body: { email: inviteEmail.trim(), makeAdmin: true },
      });
      if (error) {
        toast({ title: "Error inviting admin", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Admin invite sent", description: `An invitation email has been sent to ${inviteEmail}` });
      }
    }

    setInviteEmail("");
    setInviting(false);
    setDialogOpen(false);
    load();
  };

  const removeAdminRole = async (adminId: string, name: string) => {
    if (adminId === user?.id) {
      toast({ title: "Cannot remove your own admin role", variant: "destructive" });
      return;
    }
    if (admins.length <= 1) {
      toast({ title: "Cannot remove the last admin", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", adminId)
      .eq("role", "admin");

    if (error) {
      toast({ title: "Error removing admin role", variant: "destructive" });
      return;
    }
    toast({ title: `${name || "User"} is no longer an admin` });
    load();
  };

  const filtered = admins.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.full_name ?? "").toLowerCase().includes(q) ||
      (a.email ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><UserPlus className="mr-2 h-4 w-4" /> Add Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin</DialogTitle>
              <DialogDescription>
                Enter the email of an existing user to grant them admin access, or invite a new admin by email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleInviteAdmin} disabled={inviting || !inviteEmail.trim()}>
                {inviting ? "Adding..." : "Add Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search admins..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No admins found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const isSelf = a.id === user?.id;
                return (
                  <tr key={a.id} className="bg-card hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                      {a.full_name || "—"}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.email || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default" className="text-[10px]">
                        <ShieldCheck className="mr-1 h-3 w-3" />Admin
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {!isSelf && admins.length > 1 ? (
                        <ConfirmDialog
                          trigger={<Button size="sm" variant="destructive" className="text-xs"><ShieldOff className="mr-1 h-3 w-3" />Remove</Button>}
                          title={`Remove admin role from ${a.full_name || "this user"}?`}
                          description="They will lose access to admin pages. This can be reversed."
                          confirmLabel="Remove Admin"
                          onConfirm={() => removeAdminRole(a.id, a.full_name ?? "")}
                        />
                      ) : isSelf ? (
                        <span className="text-xs text-muted-foreground">Protected</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Last admin</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
