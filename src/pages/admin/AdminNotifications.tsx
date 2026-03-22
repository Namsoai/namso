import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Activity, Mail, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";

export default function AdminNotifications() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ pending: 0, processing: 0, sent: 0, delivered: 0, bounced: 0, failed: 0, dead_letter: 0 });

  async function loadDeliveries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notification_deliveries")
      .select(`
        id, status, error, provider_message_id, created_at, updated_at, template_name, template_version, attempt_count, last_attempted_at, dead_letter_reason, next_retry_at,
        notifications (
          id, type, title, created_at, payload, user_id,
          profiles!notifications_user_id_fkey ( first_name, last_name, email )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setDeliveries(data);
      const counts = { pending: 0, processing: 0, sent: 0, delivered: 0, bounced: 0, failed: 0, dead_letter: 0 };
      data.forEach(d => { if (counts[d.status as keyof typeof counts] !== undefined) counts[d.status as keyof typeof counts]++; });
      setMetrics(counts);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadDeliveries();
  }, []);

  const handleManualRetry = async (deliveryId: string) => {
    // Force the ledger back to pending via strict RPC boundaries
    // @ts-ignore: schema mismatch on latest RPC push
    const { error } = await supabase.rpc("retry_notification_delivery", {
      p_delivery_id: deliveryId
    });
    
    if (!error) {
      loadDeliveries();
    } else {
      alert("Retry failed to mount: " + error.message);
    }
  };

  const statusConfig: Record<string, { icon: any, color: string }> = {
    pending: { icon: Clock, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
    processing: { icon: Activity, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    sent: { icon: Mail, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    delivered: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-600/10 border-emerald-600/20" },
    bounced: { icon: AlertTriangle, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
    failed: { icon: XCircle, color: "text-red-700 bg-red-700/10 border-red-700/20" },
    dead_letter: { icon: AlertTriangle, color: "text-purple-600 bg-purple-600/10 border-purple-600/20" }
  };

  const recentFailures = deliveries.filter(d => ['bounced', 'failed', 'dead_letter'].includes(d.status)).slice(0, 5);

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Delivery Logs">
      <div className="mb-8">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold text-foreground">
          <Mail className="h-6 w-6 text-primary" />
          Global Delivery Engine
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time observability matrix tracking outbound transactional payload cycles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-8">
        {Object.entries(metrics).map(([key, val]) => {
          const cfg = statusConfig[key];
          const Icon = cfg?.icon || Mail;
          return (
            <div key={key} className="p-4 rounded-xl border border-border bg-card flex flex-col items-center justify-center text-center">
              <Icon className={`h-6 w-6 mb-2 ${cfg?.color.split(' ')[0]}`} />
              <div className="text-2xl font-bold">{val}</div>
              <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{key}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Failures Deck */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-red-500/20 bg-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-red-500/20 bg-red-500/5 font-semibold text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" /> Top Recent Failures
            </div>
            <div className="p-2 space-y-2">
              {recentFailures.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground opacity-70 border border-dashed rounded-lg">No recent bounces or hard failures recorded.</div>
              ) : (
                recentFailures.map(f => (
                  <div key={f.id} className={`p-3 bg-background border rounded-lg text-xs ${f.status === 'bounced' ? 'border-rose-500/30' : f.status === 'dead_letter' ? 'border-purple-600/30' : 'border-red-700/30'}`}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-semibold text-foreground">{f.notifications?.type}</div>
                      <div className={`px-1 rounded-sm text-[9px] uppercase font-bold ${f.status === 'bounced' ? 'text-rose-600 bg-rose-500/10' : f.status === 'dead_letter' ? 'text-purple-600 bg-purple-600/10' : 'text-red-700 bg-red-700/10'}`}>
                        {f.status}
                      </div>
                    </div>
                    <div className="text-red-500 mb-2 truncate" title={f.error}>{f.error || f.dead_letter_reason || "Unknown Failure"}</div>
                    <div className="flex justify-between items-center text-muted-foreground">
                       <span>{f.notifications?.profiles?.email}</span>
                       {f.status === 'dead_letter' && <span className="font-bold text-purple-600 ml-2">DLQ FATAL</span>}
                       <button onClick={() => handleManualRetry(f.id)} className="text-primary hover:underline font-semibold">Retry Delivery</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Master Flight Ledger */}
        <div className="lg:col-span-2 border border-border bg-card rounded-xl overflow-hidden flex flex-col h-[calc(100vh-320px)]">
          <div className="p-4 border-b border-border bg-muted/30 font-semibold text-sm flex items-center justify-between">
            Live Flight Ledger
            <button onClick={loadDeliveries} className="text-xs text-primary hover:underline">Refresh Matrix</button>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            {loading ? (
               <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Scanning telemetry...</div>
            ) : deliveries.length === 0 ? (
               <div className="p-8 text-center text-sm text-muted-foreground">No outgoing payloads found.</div>
            ) : (
               <table className="w-full text-sm text-left">
                 <thead className="bg-muted/50 text-xs uppercase text-muted-foreground sticky top-0 backdrop-blur-md">
                   <tr>
                     <th className="px-4 py-3 font-semibold">Time</th>
                     <th className="px-4 py-3 font-semibold">Recipient</th>
                     <th className="px-4 py-3 font-semibold">Event Type & Template</th>
                     <th className="px-4 py-3 font-semibold text-right">Flight Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {deliveries.map(d => {
                      const cfg = statusConfig[d.status] || statusConfig.pending;
                      return (
                        <tr key={d.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {format(new Date(d.updated_at), "MMM d, HH:mm:ss")}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{d.notifications?.profiles?.email || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">User: {d.notifications?.profiles?.first_name}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">{d.notifications?.type}</div>
                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{d.template_name || 'raw'} {d.template_version && `v${d.template_version}`}</div>
                            {d.attempt_count > 0 && <div className="text-[10px] text-amber-500 mt-0.5">Retries: {d.attempt_count}</div>}
                            {d.next_retry_at && d.status === 'failed' && <div className="text-[10px] text-muted-foreground mt-0.5">Next poll: {format(new Date(d.next_retry_at), "HH:mm")}</div>}
                          </td>
                          <td className="px-4 py-3 text-right">
                             <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border uppercase tracking-widest ${cfg?.color}`}>
                               {d.status}
                             </span>
                             {['failed', 'bounced', 'dead_letter'].includes(d.status) && (
                               <div className="mt-1.5 flex flex-col items-end">
                                 <button onClick={() => handleManualRetry(d.id)} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded border border-primary/20 hover:bg-primary/20 font-semibold opacity-0 group-hover:opacity-100 transition-all">FORCE PING</button>
                               </div>
                             )}
                          </td>
                        </tr>
                      );
                   })}
                 </tbody>
               </table>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
