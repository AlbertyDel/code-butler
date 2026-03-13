// Контекст авторизации
// ⚠️ Бизнес-логика: НЕ ИЗМЕНЯТЬ логику авторизации, переключения ролей

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { api } from '@/lib/api';
import { mockUser } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  isLoading: boolean;
  setAuthUser: (user: User) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('individual');
  const [isLoading, setIsLoading] = useState(true);

  // Check auth status on mount — fallback to mock if API unavailable
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('[AuthContext] Checking auth status...');
        const response = await api.get('/auth/me', { timeout: 3000 });
        const userData = response.data?.data?.user || response.data?.user;
        if (userData) {
          setUser(userData);
          setUserRole(userData.role || 'individual');
        } else {
          throw new Error('No user in response');
        }
      } catch (error) {
        console.log('[AuthContext] API unavailable, using mock user');
        setUser(mockUser);
        setUserRole(mockUser.role || 'individual');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Auth is handled by useLogin hook via phone/code
    // This is for demo purposes
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data) {
        setUser(response.data);
        setUserRole(response.data.role || 'individual');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.delete('/auth');
    } catch (error) {
      // Ignore logout errors
    } finally {
      setUser(null);
      setUserRole('individual');
    }
  }, []);

  const setAuthUser = useCallback((user: User) => {
    setUser(user);
    setUserRole(user.role || 'individual');
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
    try {
      const response = await api.post('/auth/register', { email, password, name });
      if (response.data) {
        setUser(response.data);
        setUserRole('individual');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      userRole,
      isLoading,
      setAuthUser,
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
