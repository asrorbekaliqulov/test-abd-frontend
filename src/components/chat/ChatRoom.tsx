import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useChat } from '../../contexts/ChatContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { apiRequest } from '../../lib/queryClient';
import { Message as MessageComponent } from './Message';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { Message } from '../../types/chat';
import { Phone, Video, MoreVertical, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export default function ChatRoom() {
  const { currentRoom, currentUser, typingUsers } = useChat();
  const { sendMessage, isConnected } = useWebSocket(currentRoom?.id || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Fetch messages for current room
  const { data: messages, isLoading } = useQuery({
    queryKey: ['/api/chatrooms', currentRoom?.id, 'messages'],
    enabled: !!currentRoom?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response.json();
    },
    onSuccess: (newMessage) => {
      // Send via WebSocket for real-time delivery
      sendMessage({
        type: 'chat_message',
        data: newMessage
      });
      
      // Invalidate messages query to refresh
      queryClient.invalidateQueries({
        queryKey: ['/api/chatrooms', currentRoom?.id, 'messages']
      });
    }
  });

  // Handle new messages from WebSocket
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/chatrooms', currentRoom?.id, 'messages']
      });
    };

    window.addEventListener('newMessage', handleNewMessage as EventListener);
    return () => window.removeEventListener('newMessage', handleNewMessage as EventListener);
  }, [currentRoom?.id, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string, type: 'text' | 'file' | 'quiz' = 'text', metadata?: any) => {
    if (!currentRoom || !currentUser || !content.trim()) return;

    sendMessageMutation.mutate({
      chatRoomId: currentRoom.id,
      senderId: currentUser.id,
      content: content.trim(),
      type,
      metadata,
      replyToId: replyingTo?.id
    });

    setReplyingTo(null);
  };

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Welcome to QuizChat
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Select a chat to start messaging and sharing quizzes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {currentRoom.type === 'group' ? (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentRoom.isLiveQuiz 
                    ? 'bg-gradient-to-r from-green-400 to-blue-500'
                    : 'bg-gradient-to-r from-purple-400 to-pink-400'
                }`}>
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentRoom.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-400 to-green-500 text-white">
                    {currentRoom.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              {currentRoom.isLiveQuiz && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {currentRoom.name}
              </h2>
              <div className="flex items-center space-x-2">
                {currentRoom.isLiveQuiz && (
                  <>
                    <span className="text-sm text-green-600 dark:text-green-400">🔴 Live Quiz Active</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">•</span>
                  </>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentRoom.type === 'group' ? '12 members, 8 online' : 'Online'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse text-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {messages?.map((message: Message) => (
              <MessageComponent
                key={message.id}
                message={message}
                currentUserId={currentUser?.id || ''}
                onReply={setReplyingTo}
              />
            ))}
            {typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers} />
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        disabled={!isConnected || sendMessageMutation.isPending}
      />
    </div>
  );
}
