import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  pricingModalOpen: boolean;
  setPricingModalOpen: (open: boolean) => void;
  openPricingModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  pricingModalOpen: false,
  setPricingModalOpen: (open: boolean) => set({ pricingModalOpen: open }),
  openPricingModal: () => set({ pricingModalOpen: true }),
}));
