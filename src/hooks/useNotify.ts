import { supabase } from "@/integrations/supabase/client";
import type { NotificationType } from "@/types/entities";

interface NotifyParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Creates a generic notification for a user.
 * The notifications table is not yet in the generated types, so we use
 * a typed cast. Replace with the generated type once the migration runs.
 */
export async function createNotification({ userId, title, message, type, link }: NotifyParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    link: link ?? null,
  });
  if (error) {
    console.error("[createNotification] Failed to insert notification:", error.message);
  }
}
