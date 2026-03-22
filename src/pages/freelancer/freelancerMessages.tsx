/**
 * FreelancerMessages — messages page for freelancer dashboard.
 *
 * Uses the shared MessageList component for conversation rendering and replies.
 */

import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useTasks";
import MessageList from "@/components/MessageList";

export default function FreelancerMessages() {
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(user?.id);

  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Messages</h1>
      <MessageList
        userId={user?.id ?? ""}
        messages={messages}
        isLoading={isLoading}
        emptyText="No messages yet. Messages with businesses will appear here once you're working on a task."
      />
    </DashboardShell>
  );
}
