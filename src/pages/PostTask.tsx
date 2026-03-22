import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Building2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/data/mockData";

export default function PostTask() {
  const { user, roles, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Not logged in or not a business → show gated message
  if (!user || !roles.includes("business")) {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Business Account Required</h1>
            <p className="mb-6 text-muted-foreground">
              You need a business account to post a task. Create one for free and start getting matched directly with verified freelancers.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/signup/business">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/85">
                  Join as a Business <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Log In</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              <Shield className="mr-1 inline h-3 w-3" />
              Posting is free · Pay only after approval
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <motion.div className="max-w-md text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Task Posted Successfully</h1>
            <p className="mb-4 text-muted-foreground">You can now assign this task directly to verified freelancers. You'll be notified by email when they accept.</p>
            <Link to="/business-dashboard">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/85">Back to Dashboard</Button>
            </Link>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2">
            <Link to="/business-dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Post a Task</h1>
          <p className="mb-8 text-muted-foreground">Describe what you need and assign it directly to verified, AI-skilled freelancers.</p>

          <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5 rounded-xl border border-border bg-card p-6 md:p-8">
            <div>
              <Label>Task Title</Label>
              <Input placeholder="e.g., Set up automated email follow-ups for new leads" required />
              <p className="mt-1.5 text-xs text-muted-foreground">Give your task a clear, descriptive title.</p>
            </div>
            <div>
              <Label>Category</Label>
              <Select required>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>What do you need help with?</Label>
              <Textarea placeholder="Describe the task in detail — what's the goal, what tools are involved, and what the final deliverable should look like." rows={5} required />
              <p className="mt-1.5 text-xs text-muted-foreground">Include your goal, tools involved, and what success looks like.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Budget (€)</Label>
                <Input type="number" placeholder="100" min="10" required />
                <p className="mt-1.5 text-xs text-muted-foreground">Estimated budget. Final price is agreed with the freelancer.</p>
              </div>
              <div>
                <Label>Preferred Deadline</Label>
                <Input type="date" required />
              </div>
            </div>

            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/85" size="lg">
              Post Task <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground">
                <Shield className="mr-1 inline h-3 w-3" />
                Posting is free. You only pay after you choose a freelancer and approve the completed work.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Secure checkout</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Protected payments</span>
            </div>
          </form>

          <div className="mt-8 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-2 font-display text-base font-semibold text-foreground">What happens next?</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              After you post your task, you can assign it directly to verified freelancers. You choose who to work with, and you only pay after approving the completed work.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
