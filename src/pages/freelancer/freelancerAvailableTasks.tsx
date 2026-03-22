import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import { useTasks } from "@/hooks/useTasks";
import { categories } from "@/data/mockData";

export default function FreelancerAvailableTasks() {
  const { data: tasks, isLoading } = useTasks({ status: "open" });
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const filtered = (tasks ?? [])
    .filter(t => catFilter === "all" || t.category === catFilter)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Available Tasks</h1>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : !filtered.length ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground italic">No open tasks available right now. Check back soon!</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <Link key={t.id} to={`/freelancer/tasks/${t.id}`} className="block rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/30">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{t.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{t.category}</Badge>
                    {t.deadline && <span>Due: {t.deadline}</span>}
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display text-lg font-bold text-foreground">€{Number(t.budget).toFixed(0)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
