import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as api from '@/utils/api';
export interface Notification {
  id: string;
  message: string;
  repo: string;
  link: string;
  read: boolean;
  createdAt: string;
}
interface UserState {
  starredRepos: Set<string>;
  notifications: Notification[];
  initialized: boolean;
}
interface UserActions {
  initialize: () => Promise<void>;
  toggleStar: (repoFullName: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}
const useUserStore = create<UserState & { actions: UserActions }>()(
  immer((set, get) => ({
    starredRepos: new Set(),
    notifications: [],
    initialized: false,
    actions: {
      initialize: async () => {
        if (get().initialized) return;
        try {
          const [stars, notifications] = await Promise.all([
            api.listStars(),
            api.listNotifications(),
          ]);
          set((state) => {
            state.starredRepos = new Set(stars);
            state.notifications = notifications || [];
            state.initialized = true;
          });
        } catch (error) {
          console.error("Failed to initialize user store:", error);
          set(state => {
            state.initialized = true; // Mark as initialized even on failure to prevent retries
          });
        }
      },
      toggleStar: async (repoFullName: string) => {
        const prevSet = new Set(get().starredRepos);
        const isStarred = prevSet.has(repoFullName);
        const nextSet = new Set(prevSet);
        if (isStarred) {
          nextSet.delete(repoFullName);
        } else {
          nextSet.add(repoFullName);
        }
        set((state) => {
          state.starredRepos = nextSet;
        });
        try {
          if (isStarred) {
            await api.unstarRepo(repoFullName);
          } else {
            await api.starRepo(repoFullName);
          }
        } catch (error) {
          console.error("Failed to toggle star:", error);
          set((state) => {
            state.starredRepos = prevSet;
          });
        }
      },
      addNotification: async (notificationData) => {
        try {
          const newNotification = await api.createNotification(notificationData);
          set((state) => {
            state.notifications.unshift(newNotification);
          });
        } catch (error) {
          console.error("Failed to add notification:", error);
        }
      },
      markAsRead: async (notificationId: string) => {
        const originalNotifications = get().notifications;
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.read = true;
          }
        });
        try {
          await api.markNotificationRead(notificationId);
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
          set((state) => {
            state.notifications = originalNotifications;
          });
        }
      },
      markAllAsRead: async () => {
        const originalNotifications = get().notifications;
        const unreadIds = originalNotifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;
        set(state => {
            state.notifications.forEach(n => { n.read = true; });
        });
        try {
            await Promise.all(unreadIds.map(id => api.markNotificationRead(id)));
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            set(state => {
                state.notifications = originalNotifications;
            });
        }
      },
    },
  }))
);
export const useUserActions = () => useUserStore((state) => state.actions);
export const useStarredRepos = () => useUserStore((state) => state.starredRepos);
export const useNotifications = () => useUserStore((state) => state.notifications);