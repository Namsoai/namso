import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import DashboardShell from "@/components/DashboardShell";
import { businessSidebarItems } from "./BusinessOverview";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTask } from "@/hooks/useTasks";
import { categories } from "@/data/mockData";

export default function BusinessPostTask() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const createTask = useCreateTask();
  const prefill = (location.state as any)?.prefill;
  const [submitted, setSubmitted] = useState(false);
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [category, setCategory] = useState(prefill?.category ?? "");
  const [description, setDescription] = useState(prefill?.description ?? "");
  const [budget, setBudget] = useState(prefill?.budget ?? "");
  const [deadline, setDeadline] = useState("");
  const [tools, setTools] = useState(prefill?.tools ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createTask.mutateAsync({
      title,
      description,
      category,
      budget: Number(budget),
      deadline: deadline || undefined,
      tools: tools || undefined,
      client_id: user.id,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <DashboardShell sidebarItems={businessSidebarItems} title="Business">
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div className="max-w-md text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Task Posted Successfully</h1>
            <p className="mb-4 text-muted-foreground">You can now browse verified freelancers and assign this task to them directly.</p>
            <div className="flex justify-center gap-3">
              <Link to="/business/tasks"><Button>View My Tasks</Button></Link>
            </div>
          </motion.div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Post a Task</h1>
        <p className="mb-6 text-muted-foreground">Describe what you need and assign it to a verified freelancer.</p>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
          <div>
            <Label>Task Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={5} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Budget (€)</Label>
              <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="10" required />
            </div>
            <div>
              <Label>Preferred Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Tools (optional)</Label>
            <Input value={tools} onChange={e => setTools(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={createTask.isPending}>
            {createTask.isPending ? "Posting..." : "Post Task"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Shield className="mr-1 inline h-3 w-3" />
            Posting is free. You only pay after you approve the work.
          </p>
        </form>
      </div>
    </DashboardShell>
  );
}
