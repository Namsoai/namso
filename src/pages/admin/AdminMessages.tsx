import { useEffect, useState } from "react";
import { Search, Archive, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { ContactMessage } from "@/types/entities";

export default function AdminMessages() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "archived">("all");

  const load = async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading messages", description: error.message, variant: "destructive" });
    }

    setMessages((data ?? []) as ContactMessage[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ read: true })
      .eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Marked as read" });
    load();
  };

  const archive = async (id: string) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ archived: true })
      .eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Archived" });
    load();
  };

  const filtered = messages
    .filter((m) => {
      if (filter === "unread") return !m.read && !m.archived;
      if (filter === "read") return m.read && !m.archived;
      if (filter === "archived") return m.archived;
      return !m.archived; // "all" hides archived by default
    })
    .filter((m) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    });

  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Contact Messages</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search messages..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "read", "archived"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No messages found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{m.name}</span>
                    <span className="text-sm text-muted-foreground">{m.email}</span>
                    {!m.read && <Badge variant="default" className="text-[10px]">New</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">{m.subject}</p>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{m.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1">
                  {!m.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(m.id)} title="Mark as read">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {!m.archived && (
                    <Button size="sm" variant="ghost" onClick={() => archive(m.id)} title="Archive">
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
