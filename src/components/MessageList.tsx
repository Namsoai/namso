/**
 * MessageList — shared conversation list + reply component.
 *
 * Used by both BusinessMessages and FreelancerMessages. Extracts the
 * duplicated message grouping, rendering, and reply logic into a
 * reusable component.
 *
 * Behavior preserved exactly: messages grouped by other party,
 * latest 3 shown per conversation, reply with textarea, send via
 * direct Supabase insert, invalidate react-query cache.
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface MessageListProps {
  /** Current user ID */
  userId: string;
  /** Messages array from useMessages hook */
  messages: { id: string; sender_id: string; receiver_id: string; read_at: string | null; content: string; created_at: string; task_id?: string | null; }[] | undefined;
  /** Whether the messages query is loading */
  isLoading: boolean;
  /** Empty state message shown when no messages exist */
  emptyText?: string;
}

export default function MessageList({
  userId,
  messages,
  isLoading,
  emptyText = "No messages yet.",
}: MessageListProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyMsg, setReplyMsg] = useState("");
  const [sending, setSending] = useState(false);

  /** Send a reply message to the other party. */
  const sendReply = async (receiverId: string, taskId?: string | null) => {
    if (!replyMsg.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: receiverId,
      content: replyMsg.trim(),
      task_id: taskId ?? null,
    });
    if (error) {
      toast({ title: "Error sending message", variant: "destructive" });
    } else {
      toast({ title: "Message sent" });
      setReplyMsg("");
      setReplyTo(null);
      qc.invalidateQueries({ queryKey: ["messages"] });
    }
    setSending(false);
  };

  // Group messages by the other party's ID
  const grouped = new Map<string, typeof messages>();
  messages?.forEach((m) => {
    const otherId = m.sender_id === userId ? m.receiver_id : m.sender_id;
    if (!grouped.has(otherId)) grouped.set(otherId, []);
    grouped.get(otherId)!.push(m);
  });

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (!messages?.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">
        {emptyText}
      </div>
    );
  }

  // ── Conversation list ───────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([otherId, msgs]) => (
        <div key={otherId} className="rounded-xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Conversation</span>
            {msgs!.some((m) => !m.read_at && m.receiver_id === userId) && (
              <Badge variant="default" className="text-[10px]">New</Badge>
            )}
          </div>
          {msgs!.slice(0, 3).map((m) => (
            <div
              key={m.id}
              className={`mb-1 rounded-lg p-2 text-sm ${
                m.sender_id === userId ? "bg-primary/5 text-foreground" : "text-muted-foreground"
              }`}
            >
              <p>{m.content}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {replyTo === otherId ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={replyMsg}
                onChange={(e) => setReplyMsg(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={sending || !replyMsg.trim()}
                  onClick={() => sendReply(otherId, msgs![0]?.task_id)}
                >
                  {sending ? "Sending..." : "Send"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setReplyTo(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="mt-2" onClick={() => setReplyTo(otherId)}>
              Reply
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
