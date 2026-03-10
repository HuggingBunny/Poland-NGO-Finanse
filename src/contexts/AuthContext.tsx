import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
  allUsers: User[];
  updateUsers: (users: User[]) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock password map
const PASSWORDS: Record<string, string> = {
  admin: 'admin',
  ksiegowa: 'pass',
  dyrektor: 'pass',
  wolontariusz: 'pass',
  'piotr.maj': 'pass',
  'anna.z': 'pass',
};

function generateMockToken(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  }));
  const signature = btoa('mock-signature-' + user.id);
  return `${header}.${payload}.${signature}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(mockUsers);

  // Restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('auth_session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
          setUser(session.user);
        } else {
          localStorage.removeItem('auth_session');
        }
      } catch {
        localStorage.removeItem('auth_session');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const foundUser = allUsers.find(u => u.username === username && u.active);
    const expectedPassword = PASSWORDS[username] || 'password';

    if (!foundUser || password !== expectedPassword) {
      return false;
    }

    const updatedUser = { ...foundUser, lastLogin: new Date().toISOString() };
    const token = generateMockToken(updatedUser);
    const expiresAt = new Date(Date.now() + 86400000).toISOString();

    const session = { token, user: updatedUser, expiresAt };
    localStorage.setItem('auth_session', JSON.stringify(session));
    setUser(updatedUser);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('auth_session');
    setUser(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const updateUsers = (users: User[]) => {
    setAllUsers(users);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole, allUsers, updateUsers }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
