import { useChat } from '../../contexts/ChatContext';
import { 
  Zap, 
  Share, 
  UserPlus, 
  Settings, 
  Users, 
  Trophy, 
  Clock,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface ChatDetailsProps {
  onClose: () => void;
}

export default function ChatDetails({ onClose }: ChatDetailsProps) {
  const { currentRoom } = useChat();

  if (!currentRoom) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Chat Info Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Chat Details</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {currentRoom.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created by Sarah Chen • Dec 15, 2023
          </p>
          <div className="flex items-center justify-center space-x-4 mt-3">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">12</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Members</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">8</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Online</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">24</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Quizzes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="ghost"
            className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 flex flex-col items-center space-y-1"
          >
            <Zap className="w-5 h-5" />
            <span className="text-xs font-medium">Live Quiz</span>
          </Button>
          <Button
            variant="ghost"
            className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 flex flex-col items-center space-y-1"
          >
            <Share className="w-5 h-5" />
            <span className="text-xs font-medium">Share</span>
          </Button>
          <Button
            variant="ghost"
            className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 flex flex-col items-center space-y-1"
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-xs font-medium">Add Member</span>
          </Button>
          <Button
            variant="ghost"
            className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex flex-col items-center space-y-1"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">Settings</span>
          </Button>
        </div>
      </div>

      {/* Online Members */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Online (8)
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-pink-400 to-purple-500 text-white text-sm">
                    S
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">Sarah Chen</span>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 text-xs">
                    Admin
                  </Badge>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">Creating quiz...</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-blue-400 to-green-500 text-white text-sm">
                    A
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-white text-sm">Alex Rodriguez</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm">
                    M
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-white text-sm">Mike Johnson</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
              </div>
            </div>
          </div>

          {/* Offline Members */}
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 mt-6 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Offline (4)
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-60">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-cyan-500 text-white text-sm">
                    E
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gray-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-white text-sm">Emma Wilson</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last seen 2 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Quiz Activity */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Quiz Activity</h4>
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Trophy className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Quiz Completed</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">React Hooks - Average: 78%</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Quiz Starting</span>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">State Management in 5 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
