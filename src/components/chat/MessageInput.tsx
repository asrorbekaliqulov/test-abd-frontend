import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useChat } from '../../contexts/ChatContext';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Message } from '../../types/chat';
import { apiRequest } from '../../lib/queryClient';
import { 
  Send, 
  Paperclip, 
  Smile, 
  AtSign, 
  Brain, 
  Mic, 
  Zap, 
  Share, 
  CornerDownRight,
  X,
  Edit
} from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'file' | 'quiz', metadata?: any) => void;
  replyingTo: Message | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

export default function MessageInput({ 
  onSendMessage, 
  replyingTo, 
  onCancelReply, 
  disabled 
}: MessageInputProps) {
  const { currentRoom, currentUser } = useChat();
  const { sendTypingIndicator } = useWebSocket(currentRoom?.id || null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  // Fetch draft for current room
  const { data: draft } = useQuery({
    queryKey: ['/api/drafts', { userId: currentUser?.id, chatRoomId: currentRoom?.id }],
    enabled: !!currentUser?.id && !!currentRoom?.id,
  });

  // Save draft mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!currentUser?.id || !currentRoom?.id) return;
      
      const response = await apiRequest('POST', '/api/drafts', {
        userId: currentUser.id,
        chatRoomId: currentRoom.id,
        content
      });
      return response.json();
    }
  });

  // Load draft on room change
  useEffect(() => {
    if (draft?.content) {
      setMessage(draft.content);
    } else {
      setMessage('');
    }
  }, [draft]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleInputChange = (value: string) => {
    setMessage(value);

    // Handle typing indicator
    if (value && !isTyping && currentUser?.id) {
      setIsTyping(true);
      sendTypingIndicator(true, currentUser.id);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new typing timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && currentUser?.id) {
        setIsTyping(false);
        sendTypingIndicator(false, currentUser.id);
      }
    }, 1000);

    // Save draft after 1 second of no typing
    setTimeout(() => {
      if (value.trim()) {
        saveDraftMutation.mutate(value);
      }
    }, 1000);
  };

  const handleSend = () => {
    if (!message.trim() || disabled) return;

    onSendMessage(message);
    setMessage('');
    
    // Clear typing indicator
    if (isTyping && currentUser?.id) {
      setIsTyping(false);
      sendTypingIndicator(false, currentUser.id);
    }

    // Clear draft
    if (currentUser?.id && currentRoom?.id) {
      saveDraftMutation.mutate('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      {/* Draft notification */}
      {draft?.content && (
        <div className="mb-2 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400">
            <Edit className="w-4 h-4" />
            <span>Draft saved</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMessage('');
              if (currentUser?.id && currentRoom?.id) {
                saveDraftMutation.mutate('');
              }
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Reply context */}
      {replyingTo && (
        <div className="mb-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CornerDownRight className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Replying to {replyingTo.sender?.username || 'Unknown User'}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancelReply}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
            {replyingTo.content}
          </p>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end space-x-3">
        <Button
          variant="ghost"
          size="sm"
          className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... @mention or #hashtag"
            className="min-h-[44px] max-h-[120px] resize-none bg-gray-100 dark:bg-gray-700 border-0 rounded-xl focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              <Smile className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              <AtSign className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-3 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            title="Share Quiz"
          >
            <Brain className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Voice Message"
          >
            <Mic className="w-5 h-5" />
          </Button>

          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="link"
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 p-0 h-auto"
          >
            <Zap className="w-4 h-4 mr-1" />
            Create Live Quiz
          </Button>
          <Button
            variant="link"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto"
          >
            <Share className="w-4 h-4 mr-1" />
            Share Quiz
          </Button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
