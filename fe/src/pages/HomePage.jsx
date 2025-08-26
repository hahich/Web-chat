import React, { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore'
import Sidebar from '../components/Sidebar'
import NoChatSelected from '../components/NoChatSelected'
import ChatContainer from '../components/ChatContainer'
import { useAuthStore } from '../store/useAuthStore'

const HomePage = () => {
  const { selectedUser, selectedGroup, subscribeToNewMessage, unsubscribeFromMessage } = useChatStore();
  const { socket } = useAuthStore();
  
  useEffect(() => {
    if (!socket) return;
    subscribeToNewMessage();
    return () => unsubscribeFromMessage();
  }, [socket, subscribeToNewMessage, unsubscribeFromMessage])
  
  return (
    <div className='h-screen bg-base-200'>
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {!(selectedUser || selectedGroup) ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage