// store/useWarehouseStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWarehouseStore = create(
    // persist(
        (set) => ({
            mainWarehouseId: null,
            cafeWarehouseId: null,
            locationName: null,
            
            setMainWarehouseId: (id) => set({ mainWarehouseId: id }),
            setCafeWarehouseId: (id) => set({ cafeWarehouseId: id }),
            setLocationName: (name) => set({ locationName: name }),
            clearWarehouseIds: () => set({ mainWarehouseId: null, cafeWarehouseId: null, locationName: null }),
        }),
        {
            name: 'warehouse-storage',
            partialize: (state) => ({
                mainWarehouseId: state.mainWarehouseId,
                cafeWarehouseId: state.cafeWarehouseId,
                locationName: state.locationName,
            }),
        }
    // )
);