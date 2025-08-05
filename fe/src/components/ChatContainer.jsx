import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../lib/utils';

const ChatContainer = () => {
  const { messages, getMessages, isMessageLoading, selectedUser, subscribeToNewMessage, unsubscribeFromMessage } = useChatStore();
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
          <div key={message._id} className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`} ref={messagesEndRef}>
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img src={message.senderId === authUser._id ? authUser.profilePicture || "avatar-default.svg" : selectedUser.profilePicture || "avatar-default.svg"} alt="ProfilePicture" />
              </div>
            </div>

            <div className="chat-header mb-1">
              <time className='text-sx opacity-50 ml-1'>
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-buble">
              {message.image && (
                <img src={message.image} alt="Image" className='sm:max-w-[200px] rounded-md mb-2' />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  )
}

export default ChatContainer