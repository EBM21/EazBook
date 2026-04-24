import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  Loader2,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/src/lib/auth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeIcons = {
    info: <Info className="w-4 h-4 text-blue-500" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    error: <X className="w-4 h-4 text-red-500" />,
  };

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background"></span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 md:w-96 z-50 origin-top-right"
            >
              <Card className="border-border shadow-2xl rounded-2xl overflow-hidden bg-card">
                <CardHeader className="p-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold text-foreground">Notifications</CardTitle>
                    {unreadCount > 0 && (
                      <Badge className="bg-primary text-primary-foreground border-none text-[10px] px-2 py-0.5">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="text-[10px] h-7 px-2 font-bold text-primary hover:text-primary hover:bg-primary/10"
                    >
                      Mark all as read
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No notifications yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 flex gap-3 transition-colors hover:bg-muted/30 cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          <div className="shrink-0 mt-1">
                            {typeIcons[notification.type]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-bold text-foreground ${!notification.is_read ? 'pr-6' : ''}`}>
                              {notification.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <span className="text-[10px] text-muted-foreground/60 mt-2 block">
                              {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <div className="p-3 border-t border-border bg-muted/30 text-center">
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-transparent">
                    View All Notifications
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
