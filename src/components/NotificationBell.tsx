import React, { useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, useUserActions } from '@/stores/userStore';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
export const NotificationBell = () => {
  const notifications = useNotifications();
  const { initialize, markAsRead, markAllAsRead } = useUserActions();
  useEffect(() => {
    // call initialize once on mount; avoid depending on function identity to prevent possible re-run loops
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const unreadCount = notifications.filter(n => !n.read).length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
             <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => markAllAsRead()}>
                Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
        ) : (
          notifications.slice(0, 5).map(notification => (
            <DropdownMenuItem key={notification.id} className="flex items-start gap-3" onSelect={(e) => e.preventDefault()}>
              <div className="flex-shrink-0 mt-1">
                {!notification.read ? <div className="h-2 w-2 rounded-full bg-blue-500" /> : <Check className="h-4 w-4 text-muted-foreground" />}
              </div>
              <Link to={notification.link} className="flex-grow" onClick={() => markAsRead(notification.id)}>
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};