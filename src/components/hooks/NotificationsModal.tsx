import React, { useState } from 'react';
import { Bell, X, Gift, MessageSquare, UserPlus } from 'lucide-react';

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

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  notifications: Notification[];
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: number) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  theme,
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAsRead,
}) => {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follower':
        return <UserPlus size={20} className="text-blue-500" />;
      case 'coin':
        return <Gift size={20} className="text-yellow-500" />;
      case 'admin':
        return <MessageSquare size={20} className="text-purple-500" />;
      case 'system':
        return <Bell size={20} className="text-green-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getNotificationTypeText = (type: string) => {
    switch (type) {
      case 'follower':
        return 'Yangi obunachi';
      case 'coin':
        return 'Coin berildi';
      case 'admin':
        return 'Admin xabari';
      case 'system':
        return 'Tizim xabari';
      default:
        return 'Bildirishnoma';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    setSelectedNotification(notification);
    onNotificationClick(notification);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Hozir';
    if (diffInMinutes < 60) return `${diffInMinutes} daqiqa oldin`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} soat oldin`;
    return `${Math.floor(diffInMinutes / 1440)} kun oldin`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl border max-h-[80vh] overflow-hidden ${theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
        }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
          <div className="flex items-center space-x-2">
            <Bell size={24} className="text-blue-500" />
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
              Bildirishnomalar
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-96">
          {notifications.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>Hozircha bildirishnomalar yo'q</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-opacity-50 ${!notification.is_read
                      ? theme === 'dark'
                        ? 'bg-blue-900/20 hover:bg-blue-900/30'
                        : 'bg-blue-50 hover:bg-blue-100'
                      : theme === 'dark'
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        {notification.message}
                      </p>
                      {notification.coin_amount && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Gift size={16} className="text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-600">
                            +{notification.coin_amount} coin
                          </span>
                          {notification.coin_reason && (
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                              ({notification.coin_reason})
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {formatTime(notification.created_at)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${notification.type === 'follower'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                            : notification.type === 'coin'
                              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : notification.type === 'admin'
                                ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
                          {getNotificationTypeText(notification.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detailed View */}
        {selectedNotification && (
          <div className={`border-t p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                To'liq ma'lumot
              </h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Yopish
              </button>
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
              <p className="mb-2">{selectedNotification.message}</p>
              {selectedNotification.user && (
                <div className="flex items-center space-x-2 mt-3 p-2 rounded-lg bg-opacity-50 bg-gray-200 dark:bg-gray-600">
                  <img
                    src={selectedNotification.user.profile_image || '/media/defaultuseravatar.png'}
                    alt={selectedNotification.user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{selectedNotification.user.username}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;