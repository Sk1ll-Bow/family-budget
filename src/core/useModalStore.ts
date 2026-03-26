import { create } from 'zustand'

interface IModal {
  id: string
  props?: Record<string, unknown>
  payload?: Record<string, unknown>; // Data passed to the modal
}

interface IModalStore {
  stack: IModal[]
  openModal: (id: string, props?: Record<string, unknown>) => void
  closeModal: () => void
  closeAll: () => void
}

export const useModalStore = create<IModalStore>((set) => ({
  stack: [],
  openModal: (id, props) => set((state) => ({ 
    stack: [...state.stack, { id, props }] 
  })),
  closeModal: () => set((state) => ({ 
    stack: state.stack.slice(0, -1) 
  })),
  closeAll: () => set({ stack: [] }),
}))
