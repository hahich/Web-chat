import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
    authUser: null,
    isSigningUo: false,
    isLoggingIn: false,
    isUpdatingProfile: false,

    isCheckingAuth: true,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("http://localhost:3001/api/auth/check")
            set({ authUser: res.data })
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
            toast.success("Account created successfully")
            set({ authUser: res.data })
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
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            set({ isLoggingIn: false })
        }
    },

    logout:async () => {
        try {
            await axiosInstance.post("http://localhost:3001/api/auth/logout")
            set({ authUser: null })
            toast.success("Logged out successfully")
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        }
    }

}))