
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginService,
  logout as logoutService,
} from "../services/auth.service";

import api from "../services/api";

const AuthContext = createContext(null);

// Chỉ cho phép Mock Login trong môi trường development
const USE_MOCK_AUTH =
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_MOCK_AUTH === "true";

const MOCK_USER = {
  id: "mock-user-001",
  name: "LOOKFIT Demo",
  email: "demo@lookfit.local",
  role: "USER",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (USE_MOCK_AUTH) {
        const mockLoggedIn =
          sessionStorage.getItem("lookfit_mock_login") === "true";

        if (!cancelled) {
          setUser(mockLoggedIn ? MOCK_USER : null);
          setLoading(false);
        }

        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");

        if (!cancelled) {
          setUser(response.data?.user ?? null);
        }
      } catch {
        localStorage.removeItem("token");

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (credentials) => {
    if (USE_MOCK_AUTH) {
      const mockUser = {
        ...MOCK_USER,
        email: credentials.email || MOCK_USER.email,
      };

      sessionStorage.setItem("lookfit_mock_login", "true");
      setUser(mockUser);

      return {
        token: "mock-development-token",
        user: mockUser,
      };
    }

    const result = await loginService(credentials);

    if (!result?.token || !result?.user) {
      localStorage.removeItem("token");
      throw new Error("Invalid login response from server");
    }

    setUser(result.user);
    return result;
  };

  const logout = async () => {
    if (USE_MOCK_AUTH) {
      sessionStorage.removeItem("lookfit_mock_login");
      setUser(null);
      return;
    }

    try {
      await logoutService();
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "ADMIN",
    login,
    logout,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
