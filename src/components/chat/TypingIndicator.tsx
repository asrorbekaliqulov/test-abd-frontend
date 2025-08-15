import { Avatar, AvatarFallback } from '../ui/avatar';

interface TypingIndicatorProps {
  users: string[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center space-x-3 animate-pulse">
      <Avatar className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500">
        <AvatarFallback className="text-white text-sm">
          {users[0]?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
      
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {users.length === 1 ? `${users[0]} is typing...` : `${users.length} people are typing...`}
      </span>
    </div>
  );
}
