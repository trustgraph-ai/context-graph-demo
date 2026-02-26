import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  persistent?: boolean;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, persistent?: boolean) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (type, message, persistent = false) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, type, message, persistent }],
    }));

    // Auto-dismiss non-persistent toasts (errors are persistent by default)
    if (!persistent && type !== "error") {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 4000);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Helper functions for easy access outside React
export const toast = {
  success: (message: string) => useToastStore.getState().addToast("success", message),
  error: (message: string) => useToastStore.getState().addToast("error", message, true),
  warning: (message: string) => useToastStore.getState().addToast("warning", message),
  info: (message: string) => useToastStore.getState().addToast("info", message),
};
