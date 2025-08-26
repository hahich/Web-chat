import { create } from "zustand";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUserLoading: false,
    isMessageLoading: false,
    typingUsers: new Set(), // Track who is typing

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

    getMessages: async (userId) => {
        set({ isMessageLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/user/${userId}`);
            set({ messages: res.data });
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

    subscribeToNewMessage: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            set({ messages: [...get().messages, newMessage] });
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

    setSelectedUser: (selectedUser) => set({ selectedUser }),

}))
