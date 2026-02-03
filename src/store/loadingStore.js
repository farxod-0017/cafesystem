import { create } from "zustand";

export const useLoadingStore = create((set) => ({
    table: false,         // table skeleton
    modalSubmit: false,   // modal save button

    action: {
        create: false,
        update: false,
        delete: false,
    },

    // TABLE
    setTableLoading: (v) => set({ table: v }),

    // MODAL
    setModalSubmit: (v) => set({ modalSubmit: v }),

    // ACTIONS
    startAction: (type) =>
        set((state) => ({
            action: { ...state.action, [type]: true }
        })),

    stopAction: (type) =>
        set((state) => ({
            action: { ...state.action, [type]: false }
        })),
}));
