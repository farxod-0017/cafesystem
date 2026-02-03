import { create } from "zustand";

function safeParse(key, defaultValue) {
    try {
        const value = sessionStorage.getItem(key);
        return value === null ? defaultValue : JSON.parse(value);
    } catch {
        return defaultValue;
    }
}

export const useUIStore = create((set) => ({
    collapsed: (() => {
        try {
            const value = localStorage.getItem("collapsed");
            return value === null ? false : JSON.parse(value);
        } catch {
            return false;
        }
    }),

    toggleSidebar: () =>
        set((state) => {
            const next = !state.collapsed;
            localStorage.setItem("collapsed", JSON.stringify(next));
            return { collapsed: next };
        }),

    fixedMode: safeParse("fixedMode", false),

    toggleFixed: () =>
        set((state) => {
            const newState = !state.fixedMode;
            sessionStorage.setItem("fixedMode", JSON.stringify(newState));
            return { fixedMode: newState };
        }),
}));
