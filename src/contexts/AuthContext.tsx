import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value: AuthContextValue = {
    status: "anonymous",
    user: null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
