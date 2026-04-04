import React, { createContext, useContext, useState, useEffect } from "react";
import { TokenService } from "../api/tokenService";

export type Role = "CUSTOMER" | "ADMIN" | "INVENTORY";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  role: Role | null;
  email: string | null;
  userId: number | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, role: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    role: null,
    email: null,
    userId: null,
  });
  const [loading, setLoading] = useState(true);

  const updateAuthState = (token: string | null, refreshToken: string | null) => {
    // Treat corrupted string tokens as null
    if (token === "undefined" || token === "null") {
      token = null;
    }

    if (token) {
      const payload = TokenService.getPayload(token);
      setAuthState({
        token,
        refreshToken,
        role: payload?.role as Role,
        email: payload?.sub as string,
        userId: payload?.userId as number,
      });
    } else {
      setAuthState({
        token: null,
        refreshToken: null,
        role: null,
        email: null,
        userId: null,
      });
    }
  };

  useEffect(() => {
    const storedToken = TokenService.getAccessToken();
    const storedRefreshToken = TokenService.getRefreshToken();
    updateAuthState(storedToken, storedRefreshToken);
    setLoading(false);

    // Listen for logout events from non-React code (like axios interceptors)
    const handleLogout = () => {
      setAuthState({ token: null, refreshToken: null, role: null, email: null, userId: null });
    };

    window.addEventListener("auth-logout", handleLogout);
    
    // Optional: Also listen for storage changes to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "refreshToken") {
        const token = TokenService.getAccessToken();
        const refresh = TokenService.getRefreshToken();
        updateAuthState(token, refresh);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("auth-logout", handleLogout);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = (token: string, _role: string, refreshToken: string) => {
    TokenService.setTokens(token, refreshToken);
    updateAuthState(token, refreshToken);
  };

  const logout = () => {
    TokenService.clearTokens();
    // updateAuthState(null, null) is handled by the event listener or direct call
    setAuthState({ token: null, refreshToken: null, role: null, email: null, userId: null });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAuthenticated: !!authState.token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
