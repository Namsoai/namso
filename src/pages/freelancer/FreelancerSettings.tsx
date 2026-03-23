/**
 * FreelancerSettings — settings page for freelancer dashboard.
 *
 * Uses the shared SettingsForm component for profile and password management.
 */

import DashboardShell from "@/components/DashboardShell";
import { freelancerSidebarItems } from "./FreelancerOverview";
import SettingsForm from "@/components/SettingsForm";
import NotificationSettings from "@/components/notifications/NotificationSettings";

export default function FreelancerSettings() {
  return (
    <DashboardShell sidebarItems={freelancerSidebarItems} title="Freelancer">
      <h1 className="mb-6 font-display text-2xl font-bold text-foreground">Settings</h1>
      <SettingsForm nameLabel="Full Name" />
      <div className="mt-6">
        <NotificationSettings />
      </div>
    </DashboardShell>
  );
}
