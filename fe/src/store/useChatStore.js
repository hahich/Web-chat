import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { notificationService } from "../lib/notificationService";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    groups: [],
    selectedUser: null,
    selectedGroup: null,
    isUserLoading: false,
    isMessageLoading: false,
    typingUsers: new Set(), // Track who is typing
    unreadCounts: {}, // userId -> count of unread incoming messages
    unreadGroupCounts: {}, // groupId -> count of unread incoming group messages

    getUsers: async () => {
        set({ isUserLoading: true });
        try {
            const res = await axiosInstance.get("/messages/users");
            set({ users: res.data.users });
        } catch (error) {
            toast.error("Failed to fetch users");
        } finally {
            set({ isUserLoading: false });
        }
    },

    getGroups: async () => {
        try {
            const res = await axiosInstance.get("/groups");
            set({ groups: res.data.groups || [] });
        } catch (error) {
            toast.error("Failed to fetch groups");
        }
    },

    getGroupMessages: async (groupId) => {
        set({ isMessageLoading: true });
        try {
            const res = await axiosInstance.get(`/groups/${groupId}/messages`);
            set({ messages: res.data.messages || [] });
        } catch (error) {
            toast.error("Failed to fetch group messages");
        } finally {
            set({ isMessageLoading: false });
        }
    },

    createGroup: async ({ name, memberIds }) => {
        try {
            const res = await axiosInstance.post("/groups", { name, memberIds });
            set({ groups: [res.data, ...get().groups] });
            toast.success("Group created");
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
            throw error;
        }
    },

    getMessages: async (userId) => {
        set({ isMessageLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/user/${userId}`);
            set({ messages: res.data });
            // Reset unread count when opening the conversation
            const currentUnread = { ...get().unreadCounts };
            if (currentUnread[userId]) {
                delete currentUnread[userId];
                set({ unreadCounts: currentUnread });
            }
        } catch (error) {
            toast.error("Failed to fetch messages");
        } finally {
            set({ isMessageLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get();
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error("Failed to send message");
        }
    },

    sendGroupMessage: async (messageData) => {
        const { selectedGroup, messages } = get();
        try {
            const res = await axiosInstance.post(`/groups/${selectedGroup._id}/messages`, messageData);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            toast.error("Failed to send group message");
        }
    },

    subscribeToNewMessage: () => {
        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const state = get();
            const { selectedUser } = state;
            const authUser = useAuthStore.getState().authUser;

            const isIncoming = newMessage.senderId !== authUser._id;
            const isOpenWithSender = selectedUser && selectedUser._id === newMessage.senderId;
            const isOpenWithReceiver = selectedUser && selectedUser._id === newMessage.receiverId;

            // Only append to current messages if it belongs to the open conversation
            if (selectedUser && (isOpenWithSender || isOpenWithReceiver)) {
                set({ messages: [...state.messages, newMessage] });
            }

            // Increment unread if incoming and not for the open conversation
            if (isIncoming && !(isOpenWithSender || isOpenWithReceiver)) {
                const current = { ...state.unreadCounts };
                const senderId = newMessage.senderId;
                current[senderId] = (current[senderId] || 0) + 1;
                set({ unreadCounts: current });

                // Fire browser notification when app is backgrounded or chat not open
                const sender = state.users.find(u => u._id === newMessage.senderId);
                const title = sender ? sender.fullName : "New message";
                const body = newMessage.text ? newMessage.text : (newMessage.image ? "Sent an image" : "New message");
                try {
                    if (document.visibilityState !== "visible") {
                        notificationService.showNotification(title, { body });
                    }
                } catch (e) {
                    // noop
                }
            }
        })

        socket.on("newGroupMessage", (newMessage) => {
            const state = get();
            const { selectedGroup } = state;

            // Append to current thread if this group is open
            if (selectedGroup && newMessage.groupId && selectedGroup._id === newMessage.groupId) {
                set({ messages: [...state.messages, newMessage] });
                return;
            }

            // Otherwise increment unread count for that group
            if (newMessage.groupId) {
                const current = { ...state.unreadGroupCounts };
                current[newMessage.groupId] = (current[newMessage.groupId] || 0) + 1;
                set({ unreadGroupCounts: current });
            }
        })

        // Typing indicators
        socket.on("userTyping", ({ userId }) => {
            set({ typingUsers: new Set([...get().typingUsers, userId]) });
        })

        socket.on("userStopTyping", ({ userId }) => {
            const newTypingUsers = new Set(get().typingUsers);
            newTypingUsers.delete(userId);
            set({ typingUsers: newTypingUsers });
        })

        // Message reactions
        socket.on("messageReaction", (updatedMessage) => {
            set({ 
                messages: get().messages.map(msg => 
                    msg._id === updatedMessage._id ? updatedMessage : msg
                ) 
            });

            // Increment unread badge for reactions when the related chat is not open
            const state = get();
            const authUser = useAuthStore.getState().authUser;
            const otherUserId = updatedMessage.senderId === authUser._id
                ? updatedMessage.receiverId
                : updatedMessage.senderId;
            const isOpenWithOther = state.selectedUser && state.selectedUser._id === otherUserId;
            if (!isOpenWithOther) {
                const current = { ...state.unreadCounts };
                current[otherUserId] = (current[otherUserId] || 0) + 1;
                set({ unreadCounts: current });
            }
        })

        // Message editing
        socket.on("messageEdited", (updatedMessage) => {
            set({ 
                messages: get().messages.map(msg => 
                    msg._id === updatedMessage._id ? updatedMessage : msg
                ) 
            });
        })

        // Message deletion
        socket.on("messageDeleted", ({ messageId }) => {
            set({ 
                messages: get().messages.filter(msg => msg._id !== messageId)
            });
        })
    },

    unsubscribeFromMessage: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage");
        socket.off("newGroupMessage");
        socket.off("userTyping");
        socket.off("userStopTyping");
        socket.off("messageReaction");
        socket.off("messageEdited");
        socket.off("messageDeleted");
    },

    // Typing functions
    startTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        socket.emit("typing", { receiverId, isTyping: true });
    },

    stopTyping: (receiverId) => {
        const socket = useAuthStore.getState().socket;
        socket.emit("stopTyping", { receiverId });
    },

    // Message reactions
    addReaction: async (messageId, emoji) => {
        try {
            const res = await axiosInstance.post(`/messages/reaction/${messageId}`, { emoji });
            // Update will be handled by socket
        } catch (error) {
            toast.error("Failed to add reaction");
        }
    },

    // Message editing
    editMessage: async (messageId, text) => {
        try {
            const res = await axiosInstance.put(`/messages/edit/${messageId}`, { text });
            // Optimistically update for the sender
            const updatedMessage = res.data;
            set({
                messages: get().messages.map((msg) =>
                    msg._id === updatedMessage._id ? updatedMessage : msg
                ),
            });
        } catch (error) {
            toast.error("Failed to edit message");
        }
    },

    // Message deletion
    deleteMessage: async (messageId) => {
        try {
            await axiosInstance.delete(`/messages/delete/${messageId}`);
            // Optimistically remove for the sender
            set({
                messages: get().messages.filter((msg) => msg._id !== messageId),
            });
        } catch (error) {
            toast.error("Failed to delete message");
        }
    },

    setSelectedUser: (selectedUser) => {
        // Mark conversation as read when selecting
        const currentUnread = { ...get().unreadCounts };
        if (selectedUser && currentUnread[selectedUser._id]) {
            delete currentUnread[selectedUser._id];
        }
        set({ selectedUser, selectedGroup: null, unreadCounts: currentUnread, messages: [] });
    },

    setSelectedGroup: async (selectedGroup) => {
        // Clear unread badge for this group when opening
        const currentUnreadGroups = { ...get().unreadGroupCounts };
        if (selectedGroup && currentUnreadGroups[selectedGroup._id]) {
            delete currentUnreadGroups[selectedGroup._id];
        }
        set({ selectedGroup, selectedUser: null, messages: [], unreadGroupCounts: currentUnreadGroups });
        if (selectedGroup?._id) {
            await get().getGroupMessages(selectedGroup._id);
        }
    },

}))
