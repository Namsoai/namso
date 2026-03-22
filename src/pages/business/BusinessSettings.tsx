/**
 * BusinessSettings — settings page for business dashboard.
 *
 * Uses the shared SettingsForm component for profile and password management.
 */

import DashboardShell from "@/components/DashboardShell";
import { businessSidebarItems } from "./BusinessOverview";
import SettingsForm from "@/components/SettingsForm";
import NotificationSettings from "@/components/notifications/NotificationSettings";

export default function BusinessSettings() {
  return (
    <DashboardShell sidebarItems={businessSidebarItems} title="Business">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Business Settings</h1>
      <SettingsForm nameLabel="Business / Contact Name" />
      <div className="mt-6">
        <NotificationSettings />
      </div>
    </DashboardShell>
  );
}
