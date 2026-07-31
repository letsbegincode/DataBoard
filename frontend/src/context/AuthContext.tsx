import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import client from "../api/client";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      client
        .get("/auth/me")
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem("access_token");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await client.post("/auth/login", { email, password });
    localStorage.setItem("access_token", res.data.access_token);
    const meRes = await client.get("/auth/me");
    setUser(meRes.data);
  };

  const register = async (email: string, password: string) => {
    await client.post("/auth/register", { email, password });
    // Auto-login after register
    await login(email, password);
  };

  const logout = () => {
    client.post("/auth/logout").catch(() => {});
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
