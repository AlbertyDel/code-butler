// Контекст авторизации
// ⚠️ Бизнес-логика: НЕ ИЗМЕНЯТЬ логику авторизации, переключения ролей

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User, UserRole } from '@/types';
import { mockUser, mockBusinessUser } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('individual');

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // ⚠️ Mock авторизация - не менять логику проверки
    if (email && password.length >= 6) {
      const loggedInUser = email.includes('business') ? mockBusinessUser : mockUser;
      setUser(loggedInUser);
      setUserRole(loggedInUser.role);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setUserRole('individual');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    // ⚠️ Бизнес-логика переключения ролей - не менять
    if (user) {
      setUserRole(role);
      if (role === 'business') {
        setUser({ ...user, role: 'business', organizationId: 'org-1' });
      } else {
        setUser({ ...user, role: 'individual', organizationId: undefined });
      }
    }
  }, [user]);

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    // ⚠️ Mock регистрация - не менять логику
    if (email && password.length >= 6 && name) {
      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: 'individual',
        createdAt: new Date().toISOString(),
      };
      setUser(newUser);
      setUserRole('individual');
      return true;
    }
    return false;
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      userRole,
      login,
      logout,
      switchRole,
      register,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
