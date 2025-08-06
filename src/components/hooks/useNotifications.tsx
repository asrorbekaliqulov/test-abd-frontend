import { useState, useEffect, useCallback } from 'react';

interface Notification {
    id: number;
    type: 'follower' | 'coin' | 'admin' | 'system';
    title: string;
    message: string;
    user?: {
        id: number;
        username: string;
        profile_image: string | null;
    };
    coin_amount?: number;
    coin_reason?: string;
    created_at: string;
    is_read: boolean;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<WebSocket | null>(null);

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }, []);

    // Play notification sound
    const playNotificationSound = useCallback(() => {
        try {
            const audio = new Audio('/notification-sound.mp3');
            audio.volume = 0.5;
            audio.play().catch(console.error);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    }, []);

    // Show browser notification
    const showBrowserNotification = useCallback((notification: Notification) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.jpg',
                badge: '/logo.jpg',
                tag: `notification-${notification.id}`,
            });

            browserNotification.onclick = () => {
                window.focus();
                browserNotification.close();
            };

            setTimeout(() => {
                browserNotification.close();
            }, 5000);
        }
    }, []);

    // Add new notification
    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Play sound and show browser notification
        playNotificationSound();
        showBrowserNotification(notification);
    }, [playNotificationSound, showBrowserNotification]);

    // Connect to WebSocket
    const connectWebSocket = useCallback(() => {
        try {
            // Replace with your actual WebSocket URL
            const wsUrl = `ws://localhost:8000/ws/notifications/`;
            const newSocket = new WebSocket(wsUrl);

            newSocket.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
            };

            newSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'notification') {
                        addNotification(data.notification);
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            newSocket.onclose = () => {
                console.log('WebSocket disconnected');
                setIsConnected(false);
                // Reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
            };

            newSocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
            };

            setSocket(newSocket);
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
        }
    }, [addNotification]);

    // Load initial notifications
    const loadNotifications = useCallback(async () => {
        try {
            // Simulate API call - replace with actual API
            const mockNotifications: Notification[] = [
                {
                    id: 1,
                    type: 'follower',
                    title: 'Yangi obunachi!',
                    message: 'john_doe sizga obuna bo\'ldi',
                    user: {
                        id: 1,
                        username: 'john_doe',
                        profile_image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
                    },
                    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    is_read: false
                },
                {
                    id: 2,
                    type: 'coin',
                    title: 'Coin berildi!',
                    message: 'Faol ishtirok uchun sizga coin berildi',
                    coin_amount: 50,
                    coin_reason: 'Kundalik faollik',
                    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    is_read: false
                },
                {
                    id: 3,
                    type: 'admin',
                    title: 'Admin xabari',
                    message: 'Yangi funksiyalar qo\'shildi! Tekshirib ko\'ring.',
                    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    is_read: true
                },
                {
                    id: 4,
                    type: 'system',
                    title: 'Tizim yangilanishi',
                    message: 'TestAbd platformasi yangilandi. Yangi imkoniyatlardan foydalaning!',
                    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    is_read: true
                }
            ];

            setNotifications(mockNotifications);
            setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }, []);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: number) => {
        try {
            // Simulate API call - replace with actual API
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            // Simulate API call - replace with actual API
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, []);

    // Initialize
    useEffect(() => {
        requestNotificationPermission();
        loadNotifications();
        connectWebSocket();

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    return {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        loadNotifications
    };
};