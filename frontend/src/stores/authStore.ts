import { create } from 'zustand';
import { setAccessToken } from '../lib/api';

interface AuthState {
  accessToken: string | null;
  user: { id: string; email: string; name: string } | null;
  company: { id: string; name: string; slug: string } | null;
  systemRole: string | null;
  jobRole: string | null;
  setAuth: (data: {
    accessToken: string;
    user: { id: string; email: string; name: string };
    company: { id: string; name: string; slug: string };
    systemRole?: string;
    jobRole?: string;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  company: null,
  systemRole: null,
  jobRole: null,
  setAuth: (data) => {
    setAccessToken(data.accessToken);
    set({
      accessToken: data.accessToken,
      user: data.user,
      company: data.company,
      systemRole: data.systemRole ?? null,
      jobRole: data.jobRole ?? null,
    });
  },
  clearAuth: () => {
    setAccessToken(null);
    set({
      accessToken: null,
      user: null,
      company: null,
      systemRole: null,
      jobRole: null,
    });
  },
}));
