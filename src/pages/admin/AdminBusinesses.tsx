import { useEffect, useState } from "react";
import { Search, Shield, ShieldOff, ShieldAlert, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import { adminSidebarItems } from "./AdminOverview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ProfileExtended, AccountStatus } from "@/types/entities";

export default function AdminBusinesses() {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<ProfileExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    // user_roles holds role grants; use profiles.id (auth UID) for lookups
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "business");

    if (!roles?.length) { setLoading(false); return; }

    const ids = roles.map((r) => r.user_id);
    // profiles.id is the canonical PK (= auth UID); NOT a separate user_id column
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", ids);

    setBusinesses((profiles ?? []) as ProfileExtended[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const updateAccountStatus = async (profileId: string, status: AccountStatus, name: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", profileId);
    if (error) { toast({ title: "Error updating status", variant: "destructive" }); return; }
    toast({ title: `${name || "Account"} is now ${status}` });
    load();
  };

  const statusBadge = (s: AccountStatus | null) => {
    if (!s || s === "active") return <Badge variant="default" className="text-[10px]"><ShieldCheck className="mr-1 h-3 w-3" />Active</Badge>;
    if (s === "frozen") return <Badge variant="secondary" className="text-[10px]"><Shield className="mr-1 h-3 w-3" />Frozen</Badge>;
    if (s === "suspended") return <Badge variant="destructive" className="text-[10px]"><ShieldAlert className="mr-1 h-3 w-3" />Suspended</Badge>;
    return <Badge variant="destructive" className="text-[10px]"><ShieldOff className="mr-1 h-3 w-3" />Revoked</Badge>;
  };

  const filtered = businesses.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (b.full_name ?? "").toLowerCase().includes(q) ||
      (b.email ?? "").toLowerCase().includes(q) ||
      (b.username ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Businesses</h1>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search businesses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No businesses found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Username</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((b) => {
                const s = b.account_status ?? "active";
                return (
                  <tr key={b.id} className="bg-card hover:bg-muted/30">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{b.full_name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.email || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.username || "—"}</td>
                    <td className="px-4 py-3">{statusBadge(s)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {s === "active" && (
                          <>
                            <ConfirmDialog
                              trigger={<Button size="sm" variant="outline" className="text-xs">Freeze</Button>}
                              title={`Freeze ${b.full_name || "this account"}?`}
                              description="This business will not be able to access their dashboard."
                              confirmLabel="Freeze"
                              onConfirm={() => updateAccountStatus(b.id, "frozen", b.full_name ?? "")}
                            />
                            <ConfirmDialog
                              trigger={<Button size="sm" variant="outline" className="text-xs">Suspend</Button>}
                              title={`Suspend ${b.full_name || "this account"}?`}
                              description="This business will be blocked from the platform."
                              confirmLabel="Suspend"
                              onConfirm={() => updateAccountStatus(b.id, "suspended", b.full_name ?? "")}
                            />
                          </>
                        )}
                        {(s === "frozen" || s === "suspended") && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => updateAccountStatus(b.id, "active", b.full_name ?? "")}>
                            Reactivate
                          </Button>
                        )}
                        {s !== "revoked" && (
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="destructive" className="text-xs">Revoke</Button>}
                            title={`Revoke ${b.full_name || "this account"}'s access?`}
                            description="Access will be completely removed. This can be reversed."
                            confirmLabel="Revoke"
                            onConfirm={() => updateAccountStatus(b.id, "revoked", b.full_name ?? "")}
                          />
                        )}
                        {s === "revoked" && (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => updateAccountStatus(b.id, "active", b.full_name ?? "")}>
                            Restore
                          </Button>
                        )}
                      </div>
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
