import { create } from 'zustand';
import type { AuthPayload, Role } from './types';

interface AuthState {
  user: AuthPayload | null;
  isAuthenticated: boolean;
  setUser: (user: AuthPayload | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    set({ user: null, isAuthenticated: false });
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  },
}));

interface ThemeState {
  isDark: boolean;
  toggle: (cx?: number, cy?: number) => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  init: () => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
    set({ isDark });
  },
  toggle: (cx?: number, cy?: number) => {
    const { isDark } = get();
    const newDark = !isDark;

    // Circle reveal effect
    if (cx !== undefined && cy !== undefined) {
      const overlay = document.createElement('div');
      overlay.className = 'theme-transition-overlay';
      overlay.style.setProperty('--cx', `${cx}px`);
      overlay.style.setProperty('--cy', `${cy}px`);
      overlay.style.backgroundColor = newDark ? '#0b172b' : '#f0f3ff';
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        overlay.classList.add('expanding');
        setTimeout(() => {
          if (newDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('theme', newDark ? 'dark' : 'light');
          set({ isDark: newDark });
          setTimeout(() => overlay.remove(), 100);
        }, 500);
      });
    } else {
      if (newDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', newDark ? 'dark' : 'light');
      set({ isDark: newDark });
    }
  },
}));

