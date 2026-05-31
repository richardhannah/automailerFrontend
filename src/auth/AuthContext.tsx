import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_URL } from '../config';

interface User {
  token: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ error?: string; emailVerified?: boolean }>;
  register: (username: string, password: string, email: string, phone?: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('automailer_auth');
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (!user) return;

    const validate = async () => {
      try {
        const res = await fetch(`${API_URL}/api/login/me`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (!res.ok) {
          setUser(null);
          localStorage.removeItem('automailer_auth');
        }
      } catch {
        // network error, keep current state
      }
    };

    validate();
  }, []);

  const login = async (username: string, password: string): Promise<{ error?: string; emailVerified?: boolean }> => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { error: err.error || 'Login failed' };
      }

      const data = await res.json();

      if (data.emailVerified === false) {
        return { emailVerified: false };
      }

      const userData: User = { token: data.token, username: data.username, role: data.role };
      setUser(userData);
      localStorage.setItem('automailer_auth', JSON.stringify(userData));
      return {};
    } catch {
      return { error: 'Network error' };
    }
  };

  const register = async (username: string, password: string, email: string, phone?: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/api/login/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email, phone: phone || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        return err.error || 'Registration failed';
      }

      // Registration no longer auto-logs in — user must verify email first
      return null;
    } catch {
      return 'Network error';
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('automailer_auth');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
