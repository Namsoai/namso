import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardShell from "@/components/DashboardShell";
import ConfirmDialog from "@/components/ConfirmDialog";
import EscrowPanel from "@/components/EscrowPanel";
import { businessSidebarItems } from "./BusinessOverview";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateTask } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/hooks/useNotify";
import { categories } from "@/data/mockData";
import { User, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function DownloadLink({ path, label = "📎 View attached file" }: { path: string, label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!path) return;
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    supabase.storage.from("task-files").createSignedUrl(path, 60 * 60 * 24).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl);
    });
  }, [path]);

  if (!url) return <span className="mt-1 inline-block text-xs text-muted-foreground">Loading attachment link...</span>;
  
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
      {label}
    </a>
  );
}


export default function BusinessTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateTask = useUpdateTask();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTools, setEditTools] = useState("");
  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Query all freelancers to assign
  const { data: freelancers } = useQuery({
    queryKey: ["freelancers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("role", "freelancer");
      if (error) throw error;
      return data;
    },
  });

  const { data: submissions } = useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("task_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: existingReview } = useQuery({
    queryKey: ["review", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("task_id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  // ── Escrow: fetch the payment record for this task ────────────────────────
  const { data: paymentRecord } = useQuery({
    queryKey: ["payments", "task", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, status, escrow_id")
        .eq("task_id", id!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // ── Escrow: fetch the freelancer's profile email ─────────────────────────────
  const { data: freelancerProfile } = useQuery({
    queryKey: ["profile", task?.freelancer_id],
    queryFn: async () => {
      if (!task?.freelancer_id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", task.freelancer_id)
        .maybeSingle();
      return data as { email: string } | null;
    },
    enabled: !!task?.freelancer_id,
  });

  const startEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditBudget(String(task.budget));
    setEditDeadline(task.deadline ?? "");
    setEditCategory(task.category);
    setEditTools(task.tools ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    await updateTask.mutateAsync({
      id: id!,
      title: editTitle,
      description: editDesc,
      budget: Number(editBudget),
      deadline: editDeadline || null,
      category: editCategory,
      tools: editTools || null,
    });
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["task", id] });
  };

  const assignFreelancer = async (freelancerId: string) => {
    await updateTask.mutateAsync({
      id: id!,
      freelancer_id: freelancerId,
      assignment_status: "pending_acceptance",
    });
    const freelancer = freelancers?.find(f => f.id === freelancerId);
    await createNotification({
      userId: freelancerId,
      title: "New Task Assigned",
      message: `You have been assigned to "${task?.title}". Please review and accept.`,
      type: "task_assigned",
      link: `/freelancer/tasks/${id}`,
    });
    toast({ title: `Assigned task to ${freelancer?.full_name ?? "freelancer"}` });
  };

  const approveWork = async () => {
    if (!task) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: paymentId, error } = await (supabase.rpc as any)("approve_task_work", { p_task_id: task.id });
      if (error) throw error;

      // Ensure queries capture the completed state and the new payment row natively
      qc.invalidateQueries({ queryKey: ["task", task.id] });
      
      if (task.freelancer_id) {
        await createNotification({
          userId: task.freelancer_id,
          title: "Work Approved",
          message: `Your work on "${task.title}" has been approved. Payment is being processed.`,
          type: "task_completed",
          link: `/freelancer/earnings`,
        });
      }
      toast({ title: "Work approved — payment secured natively" });
    } catch (err: any) {
      console.error("[approve-work] Error executing RPC", err);
      toast({ title: "Approval Failed", description: err.message, variant: "destructive" });
    }
  };

  const requestRevision = async () => {
    if (!task) return;
    await updateTask.mutateAsync({ id: task.id, status: "revision_requested" });
    if (task.freelancer_id) {
      await createNotification({
        userId: task.freelancer_id,
        title: "Revision Requested",
        message: `The business has requested a revision on "${task.title}".`,
        type: "revision_requested",
        link: `/freelancer/active`,
      });
    }
    toast({ title: "Revision requested" });
  };

  const duplicateTask = () => {
    if (!task) return;
    navigate("/business/post-task", {
      state: {
        prefill: {
          title: task.title,
          description: task.description,
          category: task.category,
          budget: String(task.budget),
          tools: task.tools ?? "",
        },
      },
    });
  };

  const submitReview = async () => {
    if (!task || !task.freelancer_id) return;
    setReviewSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      task_id: task.id,
      freelancer_id: task.freelancer_id,
      client_id: task.client_id,
      rating: reviewRating,
      comment: reviewComment || null,
    });
    if (error) {
      toast({ title: "Error submitting review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted" });
      qc.invalidateQueries({ queryKey: ["review", id] });
    }
    setReviewSubmitting(false);
  };

  if (isLoading) {
    return (
      <DashboardShell sidebarItems={businessSidebarItems} title="Business">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </DashboardShell>
    );
  }

  if (!task) {
    return (
      <DashboardShell sidebarItems={businessSidebarItems} title="Business">
        <p className="text-muted-foreground">Task not found.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <div className="mb-4">
        <Link to="/business/tasks" className="text-sm text-muted-foreground hover:text-foreground">← Back to My Tasks</Link>
      </div>

      {editing ? (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Edit Task</h2>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Budget (€)</Label><Input type="number" value={editBudget} onChange={e => setEditBudget(e.target.value)} /></div>
              <div><Label>Deadline</Label><Input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} /></div>
            </div>
            <div><Label>Tools</Label><Input value={editTools} onChange={e => setEditTools(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button onClick={saveEdit} disabled={updateTask.isPending}>{updateTask.isPending ? "Saving..." : "Save Changes"}</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{task.title}</h1>
              <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{task.category}</span> · <span>€{Number(task.budget).toFixed(0)}</span>
                {task.deadline && <> · <span>Due: {task.deadline}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
              {["open", "draft"].includes(task.status) && (
                <Button size="sm" variant="outline" onClick={startEdit}>Edit</Button>
              )}
              {task.status === "completed" && (
                <Button size="sm" variant="outline" onClick={duplicateTask}>Repost</Button>
              )}
            </div>
          </div>

          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-2 font-display text-sm font-semibold text-foreground">Description</h2>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{task.description}</p>
            {task.tools && (
              <p className="mt-3 text-sm"><span className="font-medium text-foreground">Tools:</span> <span className="text-muted-foreground">{task.tools}</span></p>
            )}
          </div>
        </>
      )}

      {/* Assignment UI */}
      {!task.freelancer_id ? (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Assign Freelancer</h2>
          <p className="mb-4 text-sm text-muted-foreground">Select a verified freelancer directly to assign this task.</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1 max-w-sm">
              <Label className="mb-2 block">Choose Specialist</Label>
              <Select onValueChange={assignFreelancer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select freelancer..." />
                </SelectTrigger>
                <SelectContent>
                  {freelancers?.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.full_name || "Unknown Freelancer"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Freelancer Assigned</h2>
          <div className="flex items-center gap-3">
            <User className="h-10 w-10 text-muted-foreground bg-muted rounded-full p-2" />
            <div>
              <p className="font-medium">{freelancers?.find(f => f.id === task.freelancer_id)?.full_name || "Specialist"}</p>
              <Badge variant="outline" className="mt-1">
                {task.assignment_status === "pending_acceptance" ? "Awaiting Acceptance" : 
                 task.assignment_status === "accepted" ? "Working on Task" : 
                 task.assignment_status}
              </Badge>
            </div>
            {task.assignment_status === "pending_acceptance" && (
              <Button size="sm" variant="outline" className="ml-auto" 
                onClick={() => updateTask.mutateAsync({ id: task.id, freelancer_id: null, assignment_status: "unassigned" as never })}>
                Cancel Assignment
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Submissions */}
      <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Submissions ({submissions?.length ?? 0})</h2>
      {!submissions?.length ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground italic">No submissions yet.</div>
      ) : (
        <div className="space-y-3">
          {submissions.map(s => (
            <div key={s.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{s.message}</p>
              {s.file_url && <DownloadLink path={s.file_url} />}
              <p className="mt-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
            </div>
          ))}
          {/* Escrow panel — shown when a payment record exists */}
          {paymentRecord && user?.email && (freelancerProfile?.email || task.freelancer_id) && (
            <div className="mt-4">
              <EscrowPanel
                taskId={task.id}
                paymentId={paymentRecord.id}
                amount={Number(paymentRecord.amount)}
                buyerEmail={user?.email || ""}
                sellerEmail={(freelancerProfile?.email as string) || ""}
                description={task.title}
                initialEscrowId={paymentRecord.escrow_id ?? null}
              />
            </div>
          )}

          {task.status === "in_progress" && (
            <div className="flex gap-2">
              <ConfirmDialog
                trigger={<Button>Approve Work</Button>}
                title="Approve this work?"
                description="A payment record will be created and the task will be marked as completed."
                confirmLabel="Approve"
                variant="default"
                onConfirm={approveWork}
              />
              <ConfirmDialog
                trigger={<Button variant="outline">Request Revision</Button>}
                title="Request a revision?"
                description="The freelancer will be notified to revise and resubmit their work."
                confirmLabel="Request Revision"
                variant="default"
                onConfirm={requestRevision}
              />
            </div>
          )}
        </div>
      )}

      {/* Review section for completed tasks */}
      {task.status === "completed" && task.freelancer_id && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Freelancer Review</h2>
          {existingReview ? (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < existingReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                ))}
              </div>
              {existingReview.comment && <p className="text-sm text-muted-foreground">{existingReview.comment}</p>}
              <p className="mt-2 text-xs text-muted-foreground">Reviewed {new Date(existingReview.created_at).toLocaleDateString()}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <p className="text-sm text-muted-foreground">Rate the freelancer's work on this task.</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setReviewRating(i + 1)} className="focus:outline-none">
                    <Star className={`h-6 w-6 ${i < reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} hover:text-yellow-400`} />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Optional comment..."
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={2}
              />
              <Button size="sm" onClick={submitReview} disabled={reviewSubmitting}>
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
