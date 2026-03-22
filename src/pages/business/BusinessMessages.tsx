/**
 * BusinessMessages — messages page for business dashboard.
 *
 * Uses the shared MessageList component for conversation rendering and replies.
 */

import DashboardShell from "@/components/DashboardShell";
import { businessSidebarItems } from "./BusinessOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useTasks";
import MessageList from "@/components/MessageList";

export default function BusinessMessages() {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(user?.id);

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Messages</h1>
      <MessageList
        userId={user?.id ?? ""}
        messages={messages}
        isLoading={isLoading}
        emptyText="No messages yet. Messages with freelancers will appear here once a task is in progress."
      />
    </DashboardShell>
  );
}
