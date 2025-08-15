import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useChat } from '../../contexts/ChatContext';
import { Message as MessageType } from '../../types/chat';
import QuizCard from './QuizCard';
import { apiRequest } from '../../lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { Heart, CheckCheck, User, FileText, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface MessageProps {
  message: MessageType;
  currentUserId: string;
  onReply: (message: MessageType) => void;
}

export function Message({ message, currentUserId, onReply }: MessageProps) {
  const { currentRoom } = useChat();
  const [showReactions, setShowReactions] = useState(false);
  const queryClient = useQueryClient();
  const isOwnMessage = message.senderId === currentUserId;

  // Add reaction mutation
  const addReactionMutation = useMutation({
    mutationFn: async ({ emoji }: { emoji: string }) => {
      const response = await apiRequest('POST', '/api/reactions', {
        messageId: message.id,
        userId: currentUserId,
        emoji
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/chatrooms', currentRoom?.id, 'messages']
      });
    }
  });

  const handleReaction = (emoji: string) => {
    addReactionMutation.mutate({ emoji });
    setShowReactions(false);
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'quiz':
        return (
          <QuizCard
            quiz={message.metadata?.quiz}
            messageId={message.id}
            onSubmitAnswer={(answers) => {
              // Handle quiz submission
              console.log('Quiz answers:', answers);
            }}
          />
        );
      
      case 'quiz_result':
        return (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl max-w-md">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCheck className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">Quiz Completed!</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Correct Answers:</span>
                <span className="font-semibold text-green-600">{message.metadata?.score || 0}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Your Score:</span>
                <span className="font-semibold text-green-600">
                  {Math.round(((message.metadata?.score || 0) / 10) * 100)}%
                </span>
              </div>
            </div>
            <Button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white">
              View Detailed Results
            </Button>
          </div>
        );
      
      case 'file':
        return (
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-xl max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {message.metadata?.filename || 'File'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message.metadata?.size || '2.3 MB'}
                </p>
              </div>
              <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      
      case 'system':
        return (
          <div className="flex justify-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full text-sm">
              {message.content}
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`p-3 rounded-xl max-w-lg ${
            isOwnMessage 
              ? 'bg-blue-500 text-white ml-auto rounded-br-md' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
          }`}>
            <p>{message.content}</p>
          </div>
        );
    }
  };

  if (message.type === 'system') {
    return renderMessageContent();
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'items-start space-x-3'} animate-fade-in`}>
      {!isOwnMessage && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar || undefined} />
          <AvatarFallback className="bg-gradient-to-r from-pink-400 to-purple-500 text-white text-sm">
            {message.sender?.username?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 min-w-0 ${isOwnMessage ? 'flex justify-end' : ''}`}>
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {message.sender?.username || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'now'}
            </span>
          </div>
        )}
        
        <div className={isOwnMessage ? 'max-w-lg' : ''}>
          {renderMessageContent()}
        </div>

        {/* Message Actions */}
        <div className={`flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1 ${
          isOwnMessage ? 'justify-end' : ''
        }`}>
          {isOwnMessage ? (
            <div className="flex items-center space-x-2">
              <span className="text-xs">
                {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'now'}
              </span>
              <CheckCheck className="w-4 h-4 text-blue-500" />
            </div>
          ) : (
            <>
              <button 
                onClick={() => handleReaction('❤️')}
                className="hover:text-blue-500 transition-colors flex items-center space-x-1"
              >
                <Heart className="w-4 h-4" />
                <span>{message.reactions?.length || 0}</span>
              </button>
              <button 
                onClick={() => onReply(message)}
                className="hover:text-blue-500 transition-colors"
              >
                Reply
              </button>
              <button className="hover:text-blue-500 transition-colors">
                Forward
              </button>
            </>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex items-center space-x-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {reaction.emoji} {reaction.user?.username || 'User'}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
