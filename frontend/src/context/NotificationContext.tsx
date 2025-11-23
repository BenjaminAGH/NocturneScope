"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    timestamp: number;
    read: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    notify: (message: string, type?: NotificationType) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearHistory: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((message: string, type: NotificationType = 'info') => {
        // Trigger Toast
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'warning':
                toast.warning(message);
                break;
            default:
                toast.info(message);
        }

        // Add to History
        const newNotification: Notification = {
            id: crypto.randomUUID(),
            type,
            message,
            timestamp: Date.now(),
            read: false,
        };

        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearHistory = useCallback(() => {
        setNotifications([]);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, notify, markAsRead, markAllAsRead, clearHistory }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
