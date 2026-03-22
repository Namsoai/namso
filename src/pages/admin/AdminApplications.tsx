import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Clock, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["freelancer_applications"]["Row"];
type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminApplications() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("freelancer_applications").select("*").order("created_at", { ascending: false });
    setApplications(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleAction = async (id: string, status: "approved" | "rejected" | "pending", email: string) => {
    setActionLoading(id);
    if (status === "approved") {
      const { data, error } = await supabase.functions.invoke("approve-freelancer", { body: { applicationId: id, email } });
      if (error) {
        // Try to extract the real error from the response
        const msg = data?.error || data?.message || error.message || "Failed to approve freelancer.";
        toast({ title: "Approval Failed", description: msg, variant: "destructive" });
        setActionLoading(null);
        return;
      }
      if (data?.error) {
        toast({ title: "Approval Failed", description: data instanceof Error ? data.message : String(data) || data.error, variant: "destructive" });
        setActionLoading(null);
        return;
      }
      toast({ title: "Application approved", description: data?.message || "Invitation email sent." });
    } else {
      const { error } = await supabase.from("freelancer_applications").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) { toast({ title: "Error", description: error instanceof Error ? error.message : String(error), variant: "destructive" }); setActionLoading(null); return; }
      toast({ title: `Application ${status}` });
    }
    setActionLoading(null);
    setSelectedApp(null);
    fetch();
  };

  const filtered = applications
    .filter(a => filter === "all" || a.status === filter)
    .filter(a => {
      if (!search) return true;
      const s = search.toLowerCase();
      return `${a.first_name} ${a.last_name}`.toLowerCase().includes(s) || a.email.toLowerCase().includes(s) || a.university.toLowerCase().includes(s);
    });

  const statusBadge = (s: string) => {
    if (s === "pending") return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    if (s === "approved") return <Badge variant="default"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>;
    return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
  };

  if (selectedApp) {
    return (
      <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
        <div className="mb-4">
          <button onClick={() => setSelectedApp(null)} className="text-sm text-muted-foreground hover:text-foreground">← Back to Applications</button>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-xl font-bold">{selectedApp.first_name} {selectedApp.last_name}</h2>
            {statusBadge(selectedApp.status)}
          </div>
          <div className="space-y-3 text-sm">
            <p><span className="font-medium text-foreground">Email:</span> <span className="text-muted-foreground">{selectedApp.email}</span></p>
            <p><span className="font-medium text-foreground">University:</span> <span className="text-muted-foreground">{selectedApp.university}</span></p>
            <p><span className="font-medium text-foreground">Major:</span> <span className="text-muted-foreground">{selectedApp.major}</span></p>
            {selectedApp.tools && <p><span className="font-medium text-foreground">Tools:</span> <span className="text-muted-foreground">{selectedApp.tools}</span></p>}
            {selectedApp.bio && <p><span className="font-medium text-foreground">Bio:</span> <span className="text-muted-foreground">{selectedApp.bio}</span></p>}
            <p><span className="font-medium text-foreground">Applied:</span> <span className="text-muted-foreground">{new Date(selectedApp.created_at).toLocaleString()}</span></p>
            {selectedApp.reviewed_at && <p><span className="font-medium text-foreground">Reviewed:</span> <span className="text-muted-foreground">{new Date(selectedApp.reviewed_at).toLocaleString()}</span></p>}
          </div>
          <div className="mt-6 flex gap-2">
            {selectedApp.status !== "approved" && (
              <Button size="sm" disabled={actionLoading === selectedApp.id} onClick={() => handleAction(selectedApp.id, "approved", selectedApp.email)}>
                <CheckCircle2 className="mr-1 h-4 w-4" />{actionLoading === selectedApp.id ? "Processing..." : "Approve"}
              </Button>
            )}
            {selectedApp.status !== "rejected" && (
              <Button size="sm" variant="outline" disabled={actionLoading === selectedApp.id} onClick={() => handleAction(selectedApp.id, "rejected", selectedApp.email)}>
                <XCircle className="mr-1 h-4 w-4" />Reject
              </Button>
            )}
            {selectedApp.status !== "pending" && (
              <Button size="sm" variant="secondary" disabled={actionLoading === selectedApp.id} onClick={() => handleAction(selectedApp.id, "pending", selectedApp.email)}>
                <RotateCcw className="mr-1 h-4 w-4" />Move to Pending
              </Button>
            )}
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Freelancer Applications</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, email, or university..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(f => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && ` (${applications.filter(a => a.status === f).length})`}
            </Button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No applications found.</div>
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(app => (
                <tr key={app.id} className="bg-card hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{app.first_name} {app.last_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{app.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{app.university}</td>
                  <td className="px-4 py-3 text-muted-foreground">{app.major}</td>
                  <td className="px-4 py-3">{statusBadge(app.status)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedApp(app)}>View</Button>
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
