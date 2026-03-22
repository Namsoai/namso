import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
  const { data: notifications, isLoading, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (id: string, link: string | null) => {
    markAsRead.mutate(id);
    if (link) {
      navigate(link);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Notifications
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Stay updated on your Escrow, Tasks, and Account security.
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead.mutate()}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden min-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">Loading...</div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground">You're all caught up!</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Any important updates regarding your account or active tasks will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n.id, n.link)}
                  className={`flex items-start gap-4 p-5 sm:p-6 transition-colors cursor-pointer hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className="mt-1 shrink-0">
                    {!n.read ? (
                      <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-muted border border-border" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground">{n.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                    <p className="mt-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {new Date(n.created_at).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {n.link && (
                     <div className="hidden sm:block shrink-0 pt-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors">
                           View details
                        </span>
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
