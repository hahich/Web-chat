import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { notificationService } from "../lib/notificationService";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,
    notificationsEnabled: false,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check-auth")
            set({ authUser: res.data })
            get().connectSocket()
        } catch (error) {
            console.log(error)
            set({ authUser: null })

        }
        finally {
            set({ isCheckingAuth: false })
        }
    },

    signUp: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/signup", data)
            set({ authUser: res.data })
            toast.success("Account created successfully")
            get().connectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            set({ isSigningUp: false })
        }
    },

    login: async (data) => {
        try {
            const res = await axiosInstance.post("/auth/login", data)
            set({ authUser: res.data })
            toast.success("Logged in successfully")
            get().connectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            set({ isLoggingIn: false })
        }
    },

    logout: async () => {
        try {
            await axiosInstance.post("/auth/logout")
            set({ authUser: null })
            toast.success("Logged out successfully")
            get().disconnectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        }
    },

    updateProfile: async (data) => {
        set({ isUpdatingProfile: true })
        try {
            const res = await axiosInstance.put("/auth/update-profile", data)
            set({ authUser: res.data })
            toast.success("Profile updated successfully")
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            set({ isUpdatingProfile: false })
        }
    },

    connectSocket: () => {
        const { authUser } = get()
        if (!authUser || get().socket?.connected) return;

        const socket = io("http://localhost:5000", {
            query: {
                userId: authUser._id
            }
        })
        socket.connect()

        set({ socket: socket })

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds })
        })

        // Typing indicators
        socket.on("userTyping", ({ userId, isTyping }) => {
            // This will be handled by chat store
        })

        socket.on("userStopTyping", ({ userId }) => {
            // This will be handled by chat store
        })

        // New message notifications
        socket.on("newMessage", (message) => {
            if (get().notificationsEnabled && document.hidden) {
                notificationService.showNotification(
                    `New message from ${message.senderName || 'Someone'}`,
                    {
                        body: message.text || 'Sent you a message',
                        tag: 'new-message'
                    }
                );
            }
        })
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect()
    },

    // Notification functions
    setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    enableNotifications: async () => {
        const permission = await notificationService.requestPermission();
        if (permission) {
            const subscription = await notificationService.subscribeToPushNotifications();
            if (subscription) {
                set({ notificationsEnabled: true });
                toast.success("Notifications enabled");
            }
        } else {
            toast.error("Notification permission denied");
        }
    },

    disableNotifications: async () => {
        await notificationService.unsubscribeFromPushNotifications();
        set({ notificationsEnabled: false });
        toast.success("Notifications disabled");
    }
}))