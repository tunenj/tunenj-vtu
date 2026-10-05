import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEMO_NOTIFICATIONS } from '../../data/notifications';
import type { AppNotification } from '../../data/notifications';

type NotificationsValue = {
  items: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  // TODO: load these from your API when the user logs in
  const [items, setItems] = useState<AppNotification[]>(DEMO_NOTIFICATIONS);

  const markRead = useCallback((id: string) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    // TODO: also tell your server, for example PATCH /notifications/:id/read
  }, []);

  const markAllRead = useCallback(() => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    // TODO: also tell your server, for example POST /notifications/read-all
  }, []);

  const refresh = useCallback(async () => {
    // TODO: fetch the latest notifications from your API and call setItems
    await new Promise((r) => setTimeout(r, 800));
  }, []);

  const value = useMemo<NotificationsValue>(
    () => ({
      items,
      unreadCount: items.filter((n) => !n.read).length,
      markRead,
      markAllRead,
      refresh,
    }),
    [items, markRead, markAllRead, refresh]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationsProvider');
  return ctx;
}