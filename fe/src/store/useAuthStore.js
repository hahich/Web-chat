import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUo: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("http://localhost:3001/api/auth/check")
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
            const res = await axiosInstance.post("http://localhost:3001/api/auth/signup", data)
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
            const res = await axiosInstance.post("http://localhost:3001/api/auth/login", data)
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
            await axiosInstance.post("http://localhost:3001/api/auth/logout")
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
            const res = await axiosInstance.put("http://localhost:3001/api/auth/update-profile", data)
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

        const socket = io("http://localhost:3001", {
            query: {
                userId: authUser._id
            }
        })
        socket.connect()

        set({ socket: socket })

        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds })
        })
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect()
    }
}))