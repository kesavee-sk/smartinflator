// context/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
  user: string | null;
  isLoading: boolean;
  login: (username: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = (username: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setUser(username);
      setIsLoading(false);
    }, 1000); // simulate async login
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
