import { create } from "zustand";

export const useThemeStore = create((set) => ({
    theme: localStorage.getItem("chat-theme") || "dark",
    setTheme: (theme) => {
        localStorage.setItem("chat-theme", theme);
        set({ theme });
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
    },
    toggleTheme: () => {
        const currentTheme = localStorage.getItem("chat-theme") || "dark";
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        localStorage.setItem("chat-theme", newTheme);
        set({ theme: newTheme });
        document.documentElement.setAttribute('data-theme', newTheme);
    },
}));