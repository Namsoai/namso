import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2 } from "lucide-react";

export default function NotificationSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification_preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data as { user_id: string; email_enabled: boolean } | null;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (enabled: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("notification_preferences")
        .update({ email_enabled: enabled, updated_at: new Date().toISOString() })
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification_preferences", user?.id] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Email Communications
        </CardTitle>
        <CardDescription>
          Manage how and when you receive critical system updates to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2 border border-border p-4 rounded-lg bg-card/50">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="email-notifications" className="text-base font-semibold">
              Transactional Emails
            </Label>
            <span className="text-sm text-muted-foreground max-w-[280px] sm:max-w-none">
              Receive alerts for Escrow payments, task assignments, and application updates.
            </span>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences?.email_enabled ?? true}
            onCheckedChange={(val) => updatePreferences.mutate(val)}
            disabled={updatePreferences.isPending}
          />
        </div>
        {updatePreferences.isPending && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving changes...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
