import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Scale, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, FileText, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AdminDisputes() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  // Filters (Persisted)
  const [filterAge, setFilterAge] = useState<"all" | "older_than_3_days">(() => {
    return (localStorage.getItem("admin_disputes_filterAge") as any) || "all";
  });
  const [filterAmount, setFilterAmount] = useState<"all" | "gt_500">(() => {
    return (localStorage.getItem("admin_disputes_filterAmount") as any) || "all";
  });

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // SLA Calculation Helper
  const isSlaBreached = (ticket: any) => {
    // If ticket is terminal, SLA doesn't apply (but our query only pulls non-terminals anyway)
    let lastActivityTime = new Date(ticket.created_at).getTime();
    if (ticket.escrow_audit_logs && ticket.escrow_audit_logs.length > 0) {
      // Find the most recent chronologcial audit action (they might not be sorted cleanly)
      const auditTimes = ticket.escrow_audit_logs.map((log: any) => new Date(log.created_at).getTime());
      lastActivityTime = Math.max(...auditTimes);
    }
    const hoursSinceActivity = (Date.now() - lastActivityTime) / (1000 * 60 * 60);
    return hoursSinceActivity > 48; // 48 Hour SLA limit
  };

  // Private Operator Notes
  const [operatorNote, setOperatorNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Resolution Form State
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolvingStatus, setResolvingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function loadTickets() {
    setLoading(true);

    // ── Diagnostic: confirm base query sees disputed payments at all ──────────
    const { data: _diag, error: _diagErr } = await supabase
      .from("payments")
      .select("id, status")
      .in("status", ["disputed", "refund_requested"]);
    console.log("[AdminDisputes] minimal payments", { data: _diag, error: _diagErr });

    // ── Stage 1: fetch disputed payments with task basics + audit logs ───────
    // Deliberately NO profile FK joins here — those are the ones that can fail
    // silently when task data is stale or the FK can't resolve, zeroing out the list.
    const { data: paymentRows, error: paymentError } = await supabase
      .from("payments")
      .select(`
        id, amount, status, escrow_id, task_id, created_at, updated_at,
        tasks ( id, title ),
        escrow_audit_logs ( id, created_at, action, metadata, actor:profiles!escrow_audit_logs_actor_id_fkey(full_name) )
      `)
      .in("status", ["disputed", "refund_requested" as any])
      .order("updated_at", { ascending: false });

    if (paymentError || !paymentRows) {
      console.error("[AdminDisputes] Stage 1 payment fetch failed:", paymentError);
      setLoading(false);
      return;
    }

    // ── Stage 2: enrich with client/freelancer profiles ──────────────────────
    // Collect unique task IDs from the fetched payments, then fetch profiles
    // in a single query. Merge results back by task ID.
    const taskIds = [...new Set(paymentRows.map((p: any) => p.task_id).filter(Boolean))];
    let taskProfiles: Record<string, { client: any; freelancer: any }> = {};

    if (taskIds.length > 0) {
      const { data: taskData } = await supabase
        .from("tasks")
        .select(`
          id,
          client:profiles!tasks_client_id_fkey(id, full_name, email),
          freelancer:profiles!tasks_freelancer_id_fkey(id, full_name, email)
        `)
        .in("id", taskIds);

      if (taskData) {
        for (const t of taskData) {
          taskProfiles[t.id] = { client: t.client, freelancer: t.freelancer };
        }
      }
    }

    // Merge profile data into the payment rows
    const enriched = paymentRows.map((p: any) => ({
      ...p,
      tasks: p.tasks
        ? { ...p.tasks, ...(taskProfiles[p.task_id] ?? {}) }
        : null,
    }));

    setTickets(enriched);
    setLoading(false);
  }

  useEffect(() => {
    localStorage.setItem("admin_disputes_filterAge", filterAge);
  }, [filterAge]);

  useEffect(() => {
    localStorage.setItem("admin_disputes_filterAmount", filterAmount);
  }, [filterAmount]);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!selectedTicket) {
      setDeliveries([]);
      return;
    }
    async function loadDeliveries() {
      setLoadingDeliveries(true);
      const { data, error } = await supabase
        .from("notification_deliveries")
        .select(`
          id, status, error, updated_at, template_name, template_version,
          notifications!inner (
            id, type, title, created_at, payload
          )
        `)
        .eq("notifications.payload->>payment_id", selectedTicket.id)
        .order("updated_at", { ascending: false });
      
      if (!error && data) {
        setDeliveries(data);
      }
      setLoadingDeliveries(false);
    }
    loadDeliveries();
  }, [selectedTicket]);

   // Apply UI filters
   const filteredTickets = tickets.filter(t => {
     let match = true;
     if (filterAmount === "gt_500" && t.amount <= 500) match = false;
     if (filterAge === "older_than_3_days") {
       const threeDaysAgo = new Date();
       threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
       if (new Date(t.created_at) >= threeDaysAgo) match = false;
     }
     return match;
   });

   const handleAddOperatorNote = async () => {
     if (!selectedTicket || !operatorNote.trim()) return;
     setSubmittingNote(true);
     // @ts-ignore
     const { error } = await supabase.rpc("add_operator_note", {
       p_payment_id: selectedTicket.id,
       p_note: operatorNote
     });
     
     if (!error) {
       setOperatorNote("");
       loadTickets(); // Refresh audit logs
     } else {
       alert("Failed to save note: " + error.message);
     }
     setSubmittingNote(false);
   };

  const handleResolveDispute = async (outcome: 'release' | 'refund') => {
    if (!selectedTicket || !resolutionNote.trim()) return;
    setResolvingStatus("loading");
    // @ts-ignore: Schema not regenerated for recent migrations
    const { error } = await supabase.rpc("resolve_dispute", {
      p_payment_id: selectedTicket.id,
      p_outcome: outcome,
      p_resolution: resolutionNote
    });

    if (error) {
      alert("Failed to resolve: " + error.message);
      setResolvingStatus("error");
    } else {
      setResolvingStatus("success");
      setSelectedTicket(null);
      setResolutionNote("");
      loadTickets();
    }
  };

  const handleMarkRefunded = async () => {
    if (!selectedTicket || !resolutionNote.trim()) return;
    setResolvingStatus("loading");
    // @ts-ignore: Schema not regenerated for recent migrations
    const { error } = await supabase.rpc("mark_refund_completed", {
      p_payment_id: selectedTicket.id,
      p_note: resolutionNote
    });

    if (error) {
      alert("Failed to mark refunded: " + error.message);
      setResolvingStatus("error");
    } else {
      setResolvingStatus("success");
      setSelectedTicket(null);
      setResolutionNote("");
      loadTickets();
    }
  };

  const statusColors: Record<string, string> = {
    disputed: "bg-red-500/10 text-red-500 border-red-500/20",
    refund_requested: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Disputes">
      <div className="mb-8">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold text-foreground">
          <Scale className="h-6 w-6 text-primary" />
          Dispute Resolution
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage active escrow disputes and refund requests securely.
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 border border-border p-4 rounded-xl bg-card">
        <div className="text-sm font-semibold text-muted-foreground">Filters:</div>
        <select 
          value={filterAge} 
          onChange={e => setFilterAge(e.target.value as any)}
          className="bg-background border border-border text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Ages</option>
          <option value="older_than_3_days">Older than 3 days</option>
        </select>
        <select 
          value={filterAmount} 
          onChange={e => setFilterAmount(e.target.value as any)}
          className="bg-background border border-border text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Amounts</option>
          <option value="gt_500">Amount &gt; €500</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Ticket List */}
        <div className="lg:col-span-1 border border-border bg-card rounded-xl overflow-hidden flex flex-col h-[calc(100vh-250px)]">
          <div className="p-4 border-b border-border bg-muted/30 font-semibold text-sm flex items-center justify-between">
            Active Tickets
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{filteredTickets.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                No active disputes.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const breached = isSlaBreached(t);
                return (
                <button
                  key={t.id}
                  onClick={() => { setSelectedTicket(t); setResolutionNote(""); setResolvingStatus("idle"); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedTicket?.id === t.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : "bg-background border-border hover:border-primary/50"
                  } ${breached ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColors[t.status] || "bg-muted text-muted-foreground"}`}>
                      {t.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{format(new Date(t.updated_at), "MMM d")}</span>
                  </div>
                  <div className="font-semibold text-sm text-foreground truncate">{t.tasks?.title || "Unknown Task"}</div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                    <span>€{t.amount}</span>
                    <span className="truncate max-w-[120px]">
                      {t.tasks?.client?.full_name?.split(' ')[0] ?? '—'} vs {t.tasks?.freelancer?.full_name?.split(' ')[0] ?? 'Unknown'}
                    </span>
                  </div>
                  {breached && <div className="text-[10px] font-bold text-rose-600 mt-2 uppercase tracking-widest animate-pulse">⚠️ SLA Breached</div>}
                </button>
              )})
            )}
          </div>
        </div>

        {/* Ticket Detail Drawer */}
        <div className="lg:col-span-2 border border-border bg-card rounded-xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          {!selectedTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
              <p>Select a ticket from the left to resolve it.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-border bg-muted/10 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-display font-bold text-foreground hover:underline cursor-pointer">
                    <a href={`/admin/tasks/${selectedTicket.tasks?.id}`}>{selectedTicket.tasks?.title} ↗</a>
                  </h2>
                  <div className="text-xl font-bold">€{selectedTicket.amount}</div>
                </div>

                {/* Primary Dispute Reason Surfaced */}
                {selectedTicket.status === 'disputed' && selectedTicket.escrow_audit_logs.some((l:any) => l.action === 'open_dispute') && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-start gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Dispute Initiated</h4>
                      <p className="text-sm mt-1">{selectedTicket.escrow_audit_logs.find((l:any) => l.action === 'open_dispute')?.metadata?.reason}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-background border border-border rounded-lg group">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Payer (Client)</div>
                      <a href={`/admin/users/${selectedTicket.tasks?.client?.id}`} className="text-xs text-primary hidden group-hover:block transition-all hover:underline">View ↗</a>
                    </div>
                    <div className="font-medium">{selectedTicket.tasks?.client?.full_name ?? '—'}</div>
                    <div className="text-muted-foreground text-xs">{selectedTicket.tasks?.client?.email}</div>
                  </div>
                  <div className="p-3 bg-background border border-border rounded-lg group">
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Payee (Freelancer)</div>
                      <a href={`/admin/users/${selectedTicket.tasks?.freelancer?.id}`} className="text-xs text-primary hidden group-hover:block transition-all hover:underline">View ↗</a>
                    </div>
                    <div className="font-medium">{selectedTicket.tasks?.freelancer?.full_name ?? '—'}</div>
                    <div className="text-muted-foreground text-xs">{selectedTicket.tasks?.freelancer?.email}</div>
                  </div>
                </div>
              </div>

              {/* Delivery Matrix */}
              <div className="p-6 border-b border-border bg-card">
                <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Warning & Email Deliveries
                </h3>
                {loadingDeliveries ? (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading email logs...</div>
                ) : deliveries.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-lg text-center">No emails tied to this escrow.</div>
                ) : (
                  <div className="space-y-3">
                    {deliveries.map(d => (
                       <div key={d.id} className="text-sm border border-border rounded-lg p-3 bg-muted/20 flex flex-col sm:flex-row justify-between gap-3">
                         <div>
                           <div className="font-semibold text-foreground flex items-center gap-2">
                             {d.notifications?.type}
                             <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${d.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : d.status === 'bounced' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                               {d.status}
                             </span>
                           </div>
                           <div className="text-xs text-muted-foreground mt-1">Template: <span className="font-mono bg-background px-1 rounded border">{d.template_name}</span> {d.template_version}</div>
                         </div>
                         <div className="text-right flex flex-col justify-center">
                           <div className="text-xs text-muted-foreground">{format(new Date(d.updated_at), "MMM d, h:mm a")}</div>
                           {d.error && <div className="text-xs text-red-500 mt-1 max-w-[200px] truncate" title={d.error}>Error: {d.error}</div>}
                         </div>
                       </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Banner */}
              <div className={`col-span-1 border rounded-xl overflow-hidden shadow-sm flex flex-col justify-center items-center py-6 ${
                isSlaBreached(selectedTicket) ? 'border-rose-500/30 bg-rose-500/10' : 'bg-background border-border'
              }`}>
                {isSlaBreached(selectedTicket) && (
                  <div className="text-xs font-black uppercase text-rose-600 mb-2 tracking-widest bg-rose-500/20 px-3 py-1 rounded shadow-sm animate-pulse">SLA Breached (&gt;48h)</div>
                )}
                <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Current State</div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider border ${statusColors[selectedTicket.status] || "bg-muted text-muted-foreground"}`}>
                  {selectedTicket.status.replace("_", " ")}
                </div>
              </div>

              {/* Audit Logs Timeline */}
              <div className="p-6 bg-background relative flex-1">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Audit History
                  </h3>
                </div>

                {/* Operator Note Input */}
                <div className="mb-6 flex gap-2">
                  <Textarea 
                    placeholder="Add a private operator note..." 
                    value={operatorNote}
                    onChange={(e) => setOperatorNote(e.target.value)}
                    className="min-h-[40px] text-sm bg-muted/20"
                    disabled={submittingNote}
                  />
                  <Button 
                    onClick={handleAddOperatorNote} 
                    disabled={submittingNote || !operatorNote.trim()}
                    variant="secondary"
                    className="shrink-0"
                  >
                    Save Note
                  </Button>
                </div>

                <div className="space-y-4 pl-3 border-l-2 border-border/50 ml-2">
                  {[...selectedTicket.escrow_audit_logs].reverse().map((log: any) => (
                    <div key={log.id} className="relative pl-4">
                      <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="text-xs text-muted-foreground mb-0.5 flex items-center gap-2">
                        <span className="font-semibold text-foreground">{log.action || "State Transition"}</span>
                        <span>•</span>
                        {format(new Date(log.created_at), "MMM d, h:mm a")}
                        {log.actor && (
                          <><span>•</span> by {log.actor.first_name} {log.actor.last_name}</>
                        )}
                      </div>
                      {log.metadata?.reason && (
                        <div className="mt-1 text-sm bg-muted/50 p-2 rounded border border-border text-foreground">
                          "{log.metadata.reason}"
                        </div>
                      )}
                      {log.metadata?.note && (
                        <div className="mt-1 text-sm bg-primary/5 p-2 rounded border border-primary/20 text-foreground">
                          Note: "{log.metadata.note}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Action Bar */}
              <div className="p-6 border-t border-border bg-card">
                <h3 className="text-sm font-semibold mb-3">Admin Resolution</h3>
                <Textarea 
                  placeholder="Enter official resolution note or reason for refund..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="mb-4 bg-background"
                  disabled={resolvingStatus === "loading"}
                />
                <div className="flex gap-3">
                  {selectedTicket.status === "disputed" ? (
                     <>
                       <Button 
                         onClick={() => handleResolveDispute('release')} 
                         className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                         disabled={!resolutionNote.trim() || resolvingStatus === "loading"}
                       >
                         Release to Freelancer
                       </Button>
                       <Button 
                         onClick={() => handleResolveDispute('refund')} 
                         variant="destructive"
                         className="flex-1"
                         disabled={!resolutionNote.trim() || resolvingStatus === "loading"}
                       >
                         Refund to Client
                       </Button>
                     </>
                  ) : selectedTicket.status === "refund_requested" ? (
                     <Button 
                       onClick={handleMarkRefunded} 
                       className="w-full bg-amber-600 hover:bg-amber-700"
                       disabled={!resolutionNote.trim() || resolvingStatus === "loading"}
                     >
                       Mark Refund Completed
                     </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
