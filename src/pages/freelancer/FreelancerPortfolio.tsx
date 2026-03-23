import { useState, useEffect } from "react";
import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTasks";
import { Link } from "react-router-dom";

export default function FreelancerPortfolio() {
  const { profile, user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const { data: tasks } = useTasks({ assignedTo: user?.id });
  const completedTasks = tasks?.filter((t) => t.status === "completed") ?? [];

  // profile.username / .bio / .tools are now typed columns in the updated types.ts
  const [headline, setHeadline] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [tools, setTools] = useState(profile?.tools ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.username ?? "");
      setBio(profile.bio ?? "");
      setTools(profile.tools ?? "");
    }
  }, [profile]);

  const savePortfolio = async () => {
    if (!user) return;
    setSaving(true);
    // Use profiles.id (= auth UID) as the canonical key
    const { error } = await supabase
      .from("profiles")
      .update({ username: headline, bio, tools })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Error saving portfolio", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Portfolio saved" });
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Portfolio</h1>
      <div className="max-w-lg space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Your Profile</h2>
          <div className="space-y-4">
            <div>
              <Label>Headline / Title</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g., AI Automation Specialist" />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell businesses about yourself, your experience, and what you specialize in..."
                rows={4}
              />
            </div>
            <div>
              <Label>AI Tools &amp; Skills</Label>
              <Input value={tools} onChange={(e) => setTools(e.target.value)} placeholder="e.g., ChatGPT, Zapier, Make, Notion AI" />
            </div>
            <Button onClick={savePortfolio} disabled={saving}>
              {saving ? "Saving..." : "Save Portfolio"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Completed Work ({completedTasks.length})</h2>
          {completedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Complete tasks to build your portfolio.{" "}
              <Link to="/freelancer/available-tasks" className="text-primary hover:underline">Browse available tasks</Link>.
            </p>
          ) : (
            <div className="space-y-2">
              {completedTasks.map((t) => (
                <div key={t.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category} · €{Number(t.budget ?? 0).toFixed(0)} · {new Date(t.updated_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
