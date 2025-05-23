import { createContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { LoginCredentials } from "@shared/schema";

interface User {
  id: number;
  username: string;
  name: string;
  role: "teacher" | "student";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: LoginCredentials & { name: string }) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on component mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => {
      return apiRequest("POST", "/api/auth/login", credentials);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: LoginCredentials & { name: string }) => {
      return apiRequest("POST", "/api/auth/register", userData);
    },
  });

  const login = async (credentials: LoginCredentials) => {
    const response = await loginMutation.mutateAsync(credentials);
    const userData = await response.json();
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const register = async (userData: LoginCredentials & { name: string }) => {
    const response = await registerMutation.mutateAsync(userData);
    // We don't automatically log in the user after registration, 
    // they will need to login with their credentials
    return response.json();
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
