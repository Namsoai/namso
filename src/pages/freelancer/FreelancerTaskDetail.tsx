import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateTask } from "@/hooks/useTasks";
import { createNotification } from "@/hooks/useNotify";
import { useToast } from "@/hooks/use-toast";

export default function FreelancerTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const updateTask = useUpdateTask();
  const { toast } = useToast();

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const acceptAssignment = async () => {
    if (!user || !id || !task) return;
    await updateTask.mutateAsync({
      id,
      assignment_status: "accepted" as never,
      status: "in_progress" as never
    });
    await createNotification({
      userId: task.client_id,
      title: "Assignment Accepted",
      message: `The freelancer accepted your assignment for "${task.title}".`,
      type: "proposal_accepted",
      link: `/business/tasks/${id}`,
    });
    toast({ title: "Assignment accepted" });
  };

  const rejectAssignment = async () => {
    if (!user || !id || !task) return;
    await updateTask.mutateAsync({
      id,
      freelancer_id: null,
      assignment_status: "unassigned" as never,
      status: "open" as never
    });
    await createNotification({
      userId: task.client_id,
      title: "Assignment Declined",
      message: `The freelancer declined your assignment for "${task.title}".`,
      type: "proposal_rejected",
      link: `/business/tasks/${id}`,
    });
    toast({ title: "Assignment declined" });
  };

  if (isLoading) {
    return <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer"><div className="h-64 animate-pulse rounded-xl bg-muted" /></DashboardShell>;
  }

  if (!task) {
    return <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer"><p className="text-muted-foreground">Task not found.</p></DashboardShell>;
  }


  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <div className="mb-4">
        <Link to="/freelancer/available-tasks" className="text-sm text-muted-foreground hover:text-foreground">← Back to Available Tasks</Link>
      </div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">{task.title}</h1>
          <span className="font-display text-2xl font-bold text-foreground">€{Number(task.budget).toFixed(0)}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{task.category}</Badge>
          {task.deadline && <span>Due: {task.deadline}</span>}
        </div>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-sm font-semibold text-foreground">Description</h2>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{task.description}</p>
        {task.tools && <p className="mt-3 text-sm"><span className="font-medium text-foreground">Tools:</span> <span className="text-muted-foreground">{task.tools}</span></p>}
      </div>

      {task.freelancer_id === user?.id && task.assignment_status === "pending_acceptance" ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">You've been assigned this task!</h2>
          <p className="mb-6 text-sm text-muted-foreground">The business has selected you. Please accept or decline this assignment.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={acceptAssignment} disabled={updateTask.isPending}>Accept Assignment</Button>
            <Button variant="outline" onClick={rejectAssignment} disabled={updateTask.isPending}>Decline</Button>
          </div>
        </div>
      ) : task.freelancer_id === user?.id && (task.assignment_status === "accepted" || task.status === "in_progress") ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-foreground">✓ You are working on this task</p>
          <Link to="/freelancer/active" className="mt-3 inline-block text-sm text-primary hover:underline">Go to Active Work →</Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground italic">
          Waiting for business to assign a freelancer.
        </div>
      )}
    </DashboardShell>
  );
}
