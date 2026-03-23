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
import type { FreelancerApplication, AccountStatus, ProfileExtended } from "@/types/entities";

type MergedFreelancer = FreelancerApplication & {
  profile: ProfileExtended | null;
  account_status: AccountStatus;
};

export default function AdminFreelancers() {
  const { toast } = useToast();
  const [freelancers, setFreelancers] = useState<MergedFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function load() {
    const { data: apps } = await supabase
      .from("freelancer_applications")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (!apps?.length) { setFreelancers([]); setLoading(false); return; }

    const emails = apps.map((a) => a.email).filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("email", emails);

    const merged: MergedFreelancer[] = (apps as FreelancerApplication[]).map((a) => {
      const profile = (profiles ?? []).find(
        (p) => p.email?.toLowerCase() === a.email.toLowerCase()
      ) as ProfileExtended | undefined;
      return {
        ...a,
        profile: profile ?? null,
        account_status: profile?.account_status ?? "active",
      };
    });

    setFreelancers(merged);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const updateAccountStatus = async (mf: MergedFreelancer, status: AccountStatus) => {
    if (!mf.profile) {
      toast({ title: "No linked account found for this freelancer", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", mf.profile.id);

    if (error) { toast({ title: "Error updating status", variant: "destructive" }); return; }
    toast({ title: `${mf.first_name}'s account is now ${status}` });
    load();
  };

  const statusBadge = (s: AccountStatus) => {
    if (s === "active") return <Badge variant="default" className="text-[10px]"><ShieldCheck className="mr-1 h-3 w-3" />Active</Badge>;
    if (s === "frozen") return <Badge variant="secondary" className="text-[10px]"><Shield className="mr-1 h-3 w-3" />Frozen</Badge>;
    if (s === "suspended") return <Badge variant="destructive" className="text-[10px]"><ShieldAlert className="mr-1 h-3 w-3" />Suspended</Badge>;
    return <Badge variant="destructive" className="text-[10px]"><ShieldOff className="mr-1 h-3 w-3" />Revoked</Badge>;
  };

  const filtered = freelancers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.university.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Approved Freelancers</h1>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search freelancers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No approved freelancers found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">University</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Major</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="bg-card hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{s.first_name} {s.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.university}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.major}</td>
                  <td className="px-4 py-3">{statusBadge(s.account_status)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {s.account_status === "active" && (
                        <>
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="outline" className="text-xs">Freeze</Button>}
                            title={`Freeze ${s.first_name}'s account?`}
                            description="The freelancer will not be able to access their dashboard."
                            confirmLabel="Freeze"
                            onConfirm={() => updateAccountStatus(s, "frozen")}
                          />
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="outline" className="text-xs">Suspend</Button>}
                            title={`Suspend ${s.first_name}'s account?`}
                            description="The freelancer will be blocked from the platform."
                            confirmLabel="Suspend"
                            onConfirm={() => updateAccountStatus(s, "suspended")}
                          />
                        </>
                      )}
                      {(s.account_status === "frozen" || s.account_status === "suspended") && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateAccountStatus(s, "active")}>
                          Reactivate
                        </Button>
                      )}
                      {s.account_status !== "revoked" && (
                        <ConfirmDialog
                          trigger={<Button size="sm" variant="destructive" className="text-xs">Revoke</Button>}
                          title={`Revoke ${s.first_name}'s access?`}
                          description="The freelancer will completely lose access. This can be reversed."
                          confirmLabel="Revoke"
                          onConfirm={() => updateAccountStatus(s, "revoked")}
                        />
                      )}
                      {s.account_status === "revoked" && (
                        <Button size="sm" variant="outline" className="text-xs" onClick={() => updateAccountStatus(s, "active")}>
                          Restore
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
