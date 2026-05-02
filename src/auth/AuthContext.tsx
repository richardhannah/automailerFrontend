import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_URL } from '../config';

interface User {
  token: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<string | null>;
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

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        return err.error || 'Login failed';
      }

      const data = await res.json();
      const userData: User = { token: data.token, username: data.username, role: data.role };
      setUser(userData);
      localStorage.setItem('automailer_auth', JSON.stringify(userData));
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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
