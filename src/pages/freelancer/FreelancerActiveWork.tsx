import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { createNotification } from "@/hooks/useNotify";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";

export default function FreelancerActiveWork() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useTasks({ assignedTo: user?.id });
  const active = tasks?.filter(t => t.status === "in_progress") ?? [];
  const updateTask = useUpdateTask();
  const [submissionMsg, setSubmissionMsg] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileUpload = async (taskId: string, file: File) => {
    if (!user) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowed = ["application/pdf", "application/zip", "image/png", "image/jpeg"];
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Maximum 10MB allowed.", variant: "destructive" });
      return;
    }
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Only PDF, ZIP, PNG, JPG allowed.", variant: "destructive" });
      return;
    }
    setUploadingFile(taskId);
    const path = `${user.id}/${taskId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("task-files").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
      setUploadingFile(null);
      return;
    }
    setFileUrls(prev => ({ ...prev, [taskId]: path }));
    setUploadingFile(null);
    toast({ title: "File uploaded" });
  };

  const submitWork = async (taskId: string) => {
    if (!user) return;
    const task = active.find(t => t.id === taskId);
    setSubmitting(taskId);
    const { error } = await supabase.from("task_submissions").insert({
      task_id: taskId,
      freelancer_id: user.id,
      message: submissionMsg[taskId] || "Work submitted",
      file_url: fileUrls[taskId] || null,
    });
    if (error) { toast({ title: "Error submitting work", description: error.message, variant: "destructive" }); setSubmitting(null); return; }
    // notify business
    if (task?.client_id) {
      await createNotification({
        userId: task.client_id,
        title: "Work Submitted",
        message: `A freelancer has submitted work for "${task.title}". Review it now.`,
        type: "work_submitted",
        link: `/business/tasks/${taskId}`,
      });
    }
    toast({ title: "Work submitted for review" });
    setSubmissionMsg(prev => ({ ...prev, [taskId]: "" }));
    setFileUrls(prev => { const n = { ...prev }; delete n[taskId]; return n; });
    setSubmitting(null);
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Active Work</h1>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !active.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">
          No active work. <Link to="/freelancer/available-tasks" className="text-primary hover:underline">Browse tasks</Link> to see what's available. You will see tasks here when businesses assign them to you.
        </div>
      ) : (
        <div className="space-y-4">
          {active.map(t => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{t.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.category} · €{Number(t.budget).toFixed(0)}{t.deadline ? ` · Due: ${t.deadline}` : ""}</p>
                </div>
                <Badge variant="secondary">
                  {t.status.replace("_", " ")}
                </Badge>
              </div>
              {t.status === "in_progress" && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Describe your submission..."
                    value={submissionMsg[t.id] || ""}
                    onChange={e => setSubmissionMsg(prev => ({ ...prev, [t.id]: e.target.value }))}
                    rows={3}
                  />
                  <div>
                    <Label className="text-xs">Attach file (PDF, ZIP, PNG, JPG — max 10MB)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.zip,.png,.jpg,.jpeg"
                        ref={el => { fileInputRefs.current[t.id] = el; }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(t.id, f);
                        }}
                        className="text-xs"
                      />
                      {uploadingFile === t.id && <span className="text-xs text-muted-foreground">Uploading...</span>}
                      {fileUrls[t.id] && <span className="text-xs text-primary">✓ File ready</span>}
                    </div>
                  </div>
                  <Button size="sm" disabled={submitting === t.id} onClick={() => submitWork(t.id)}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    {submitting === t.id ? "Submitting..." : "Submit Work"}
                  </Button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
