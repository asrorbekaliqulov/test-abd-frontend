import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../contexts/ChatContext';
import { ChatRoom } from '../../types/chat';
import { Search, MessageSquare, Sun, Moon, Bell, Users, Plus } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface ChatSidebarProps {
  chatRooms: ChatRoom[];
}

export default function ChatSidebar({ chatRooms }: ChatSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentRoom, setCurrentRoom } = useChat();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoomSelect = (room: ChatRoom) => {
    setCurrentRoom(room);
    navigate(`/chat/${room.id}`);
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">QuizChat</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'light' ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-gray-300" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center text-xs bg-red-500">
                3
              </Badge>
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleRoomSelect(room)}
            className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
              currentRoom?.id === room.id 
                ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                {room.type === 'group' ? (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    room.isLiveQuiz 
                      ? 'bg-gradient-to-r from-green-400 to-blue-500'
                      : 'bg-gradient-to-r from-purple-400 to-pink-400'
                  }`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={room.avatar || undefined} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-400 to-green-500 text-white">
                      {room.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {room.isLiveQuiz && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs">🔴</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {room.name}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">2m</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {room.isLiveQuiz ? '📝 Live Quiz Active' : room.lastMessage?.content || 'No messages'}
                  </p>
                  {room.unreadCount && room.unreadCount > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs px-2 py-1 min-w-[20px]">
                      {room.unreadCount}
                    </Badge>
                  )}
                </div>
                {room.isLiveQuiz && (
                  <div className="flex items-center mt-1 space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Live Quiz Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Chat Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
          <Button className="flex-1 bg-purple-500 hover:bg-purple-600 text-white">
            <Users className="w-4 h-4 mr-2" />
            New Group
          </Button>
        </div>
      </div>
    </div>
  );
}
