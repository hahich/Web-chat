import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { useAuthStore } from '../store/useAuthStore';
import MessageItem from './MessageItem';

const ChatContainer = () => {
  const { messages, getMessages, isMessageLoading, selectedUser, subscribeToNewMessage, unsubscribeFromMessage, typingUsers } = useChatStore();
  const { authUser } = useAuthStore();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToNewMessage();
    return () => unsubscribeFromMessage();
  }, [getMessages, selectedUser._id, subscribeToNewMessage, unsubscribeFromMessage])

  useEffect(() => {
    if (messagesEndRef.current && messages) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages])

  if (isMessageLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    )
  }

  return (
    <div className='flex-1 flex flex-col overflow-auto'>
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message._id} ref={messagesEndRef}>
            <MessageItem 
              message={message} 
              selectedUser={selectedUser} 
              authUser={authUser} 
            />
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.has(selectedUser._id) && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img src={selectedUser.profilePicture || "avatar-default.svg"} alt="ProfilePicture" />
              </div>
            </div>
            <div className="chat-bubble">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  )
}

export default ChatContainer