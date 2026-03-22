import DashboardShell from "@/components/DashboardShell";
import { adminSidebarItems } from "./AdminOverview";
import { Badge } from "@/components/ui/badge";
import { services, categories } from "@/data/mockData";

export default function AdminServices() {
  return (
    <DashboardShell sidebarItems={adminSidebarItems} title="Admin">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Services ({services.length})</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Services are currently platform-defined. Freelancer-managed service listings will be available in a future update.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Delivery</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map(s => (
              <tr key={s.id} className="bg-card">
                <td className="px-4 py-3 font-medium text-foreground">{s.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.category}</td>
                <td className="px-4 py-3 text-foreground">€{s.price}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.deliveryDays}d</td>
                <td className="px-4 py-3"><Badge variant="default">Live</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
