import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuth: (auth) => set({ isAuthenticated: auth }),
  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));