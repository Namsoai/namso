import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const { data: notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNotificationClick = (id: string, link: string | null) => {
    markAsRead.mutate(id);
    setOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[25rem] overflow-y-auto">
          {!notifications?.length ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <Bell className="h-6 w-6 opacity-20" />
              <span>You're all caught up.</span>
            </p>
          ) : (
            notifications.slice(0, 20).map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n.id, n.link)}
                className={`border-b border-border px-4 py-3 last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                   <p className="text-sm font-semibold text-foreground leading-tight">{n.title}</p>
                   {!n.read && <div className="h-2 w-2 mt-1 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-3">{n.message}</p>
                <p className="mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            ))
          )}
        </div>
        {notifications && notifications.length > 0 && (
          <div className="border-t border-border p-2 bg-muted/20">
             <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); navigate('/notifications'); }}>
                View all notifications
             </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
