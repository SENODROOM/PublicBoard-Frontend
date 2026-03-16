import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem("pb_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authAPI
      .me()
      .then((r) => setUser(r.data.user))
      .catch(() => {
        localStorage.removeItem("pb_token");
        localStorage.removeItem("pb_refresh");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const r = await authAPI.login({ email, password });
    localStorage.setItem("pb_token", r.data.token);
    localStorage.setItem("pb_refresh", r.data.refreshToken);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const register = useCallback(
    async (name, email, password, neighborhood = "") => {
      const r = await authAPI.register({ name, email, password, neighborhood });
      localStorage.setItem("pb_token", r.data.token);
      localStorage.setItem("pb_refresh", r.data.refreshToken);
      setUser(r.data.user);
      return r.data.user;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem("pb_token");
    localStorage.removeItem("pb_refresh");
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const r = await authAPI.updateProfile(data);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const r = await authAPI.me();
      setUser(r.data.user);
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
