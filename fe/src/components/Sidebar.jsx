import React, { useEffect, useState } from 'react'
import { useChatStore } from '../store/useChatStore'
import SidebarSkeleton from './skeletons/SidebarSkeleton';
import { User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = () => {
    const { getUsers, getGroups, createGroup, groups, users, selectedUser, setSelectedUser, setSelectedGroup, isUserLoading, unreadCounts, unreadGroupCounts } = useChatStore();
    const { onlineUsers } = useAuthStore();
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        getUsers();
        getGroups();
    }, [getUsers, getGroups])

    const handleCreateGroup = async ({ name, memberIds }) => {
        await createGroup({ name, memberIds });
    }

    if (isUserLoading) return <SidebarSkeleton />
    return (
        <>
        <aside className='h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200'>
            <div className="border-b border-base-300 w-full p-5">
                <div className="flex items-center gap-2">
                    <User className="size-6" />
                    <span className="font-medium hidden lg:block">Contacts</span>
                </div>
                {/* TODO: Online filter toggle */}
            </div>
            <div className="overflow-y-auto w-full py-3">
                <div className="px-3 pb-3">
                    <button className="btn btn-sm btn-primary w-full" onClick={() => setShowCreate(true)}>Create Group</button>
                </div>
                {groups && groups.length > 0 && (
                    <div className="px-3 pb-2 text-xs uppercase text-zinc-400">Groups</div>
                )}
                {groups.map((group) => (
                    <button key={group._id} className="w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors" onClick={() => setSelectedGroup(group)}>
                        <div className="relative mx-auto lg:mx-0">
                            <img src={group.avatar || "avatar-default.svg"} alt={group.name} className="size-12 object-cover rounded-full" />
                            {unreadGroupCounts?.[group._id] && (
                                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 text-[10px] leading-5 rounded-full bg-primary text-white text-center">
                                    {unreadGroupCounts[group._id]}
                                </span>
                            )}
                        </div>
                        <div className="hidden lg:block text-left min-w-0">
                            <div className="font-medium truncate">{group.name}</div>
                            <div className="text-sm text-zinc-400">{group.members?.length || 0} members</div>
                        </div>
                    </button>
                ))}
                {users.map((user) => (
                    <button key={user._id} onClick={() => setSelectedUser(user)} className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors 
                        ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}`}>
                        <div className="relative mx-auto lg:mx-0">
                            <img src={user.profilePicture || "avatar-default.svg"} alt={user.name} className="size-12 object-cover rounded-full" />
                            {onlineUsers.includes(user._id) && (
                                <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                            )}
                            {unreadCounts[user._id] && (
                                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 text-[10px] leading-5 rounded-full bg-primary text-white text-center">
                                    {unreadCounts[user._id]}
                                </span>
                            )}
                        </div>

                        {/* User info - only visible on larger screens */}
                        <div className="hidden lg:block text-left min-w-0">
                            <div className="font-medium truncate">{user.fullName}</div>
                            <div className="text-sm text-zinc-400">
                                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </aside>
        <CreateGroupModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreateGroup} users={users} />
        </>
    )
}

export default Sidebar