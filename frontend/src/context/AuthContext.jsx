/**
 * Global auth/session state mirrored to localStorage for page refresh.
 *
 * FIELDS: token, role, userId, userName, userEmail, publicUserId, permissions[], mustChangePassword, ready
 *
 * FLOW:   If token exists on mount → GET /auth/me repopulates permissions (admin may have changed roles).
 *
 * CAUSE:  JWT holds permissions but SPA also stores them for instant UI; /me reconciles after reload.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import API from "../API/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [role, setRole] = useState(() => localStorage.getItem("role"));
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [userName, setUserName] = useState(() => localStorage.getItem("userName"));
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem("userEmail"));
  const [publicUserId, setPublicUserId] = useState(() => localStorage.getItem("publicUserId"));
  const [permissions, setPermissions] = useState(() => readJson("permissions", []));
  const [mustChangePassword, setMustChangePassword] = useState(
    () => localStorage.getItem("mustChangePassword") === "true"
  );
  const [ready, setReady] = useState(!localStorage.getItem("token"));

  const persistSession = useCallback((payload) => {
    const {
      token: t,
      role: r,
      userId: uid,
      name,
      email,
      publicUserId: pid,
      permissions: perms,
      mustChangePassword: mcp,
    } = payload;

    if (t) {
      localStorage.setItem("token", t);
      setToken(t);
    }
    if (r != null) {
      localStorage.setItem("role", r);
      setRole(r);
    }
    if (uid) {
      localStorage.setItem("userId", uid);
      setUserId(uid);
    }
    if (name != null) {
      localStorage.setItem("userName", name);
      setUserName(name);
    }
    if (email != null) {
      localStorage.setItem("userEmail", email);
      setUserEmail(email);
    }
    if (pid != null) {
      localStorage.setItem("publicUserId", pid || "");
      setPublicUserId(pid || "");
    }
    if (Array.isArray(perms)) {
      localStorage.setItem("permissions", JSON.stringify(perms));
      setPermissions(perms);
    }
    const mcpBool = Boolean(mcp);
    localStorage.setItem("mustChangePassword", mcpBool ? "true" : "false");
    setMustChangePassword(mcpBool);
  }, []);

  const login = useCallback(
    (payload) => {
      persistSession(payload);
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    ["token", "role", "userId", "userName", "userEmail", "publicUserId", "permissions", "mustChangePassword"].forEach(
      (k) => localStorage.removeItem(k)
    );
    setToken(null);
    setRole(null);
    setUserId(null);
    setUserName(null);
    setUserEmail(null);
    setPublicUserId(null);
    setPermissions([]);
    setMustChangePassword(false);
    setReady(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setReady(true);
      return;
    }
    try {
      const { data } = await API.get("/auth/me");
      persistSession({
        token: localStorage.getItem("token"),
        role: data.role,
        userId: data.userId,
        name: data.name,
        email: data.email,
        publicUserId: data.publicUserId ?? "",
        permissions: data.permissions ?? [],
        mustChangePassword: data.mustChangePassword,
      });
    } catch {
      logout();
    } finally {
      setReady(true);
    }
  }, [logout, persistSession]);

  useEffect(() => {
    if (token) {
      setReady(false);
      refreshProfile();
    } else {
      setReady(true);
    }
  }, [token, refreshProfile]);

  const value = useMemo(
    () => ({
      token,
      role,
      userId,
      userName,
      userEmail,
      publicUserId,
      permissions,
      mustChangePassword,
      ready,
      login,
      logout,
      refreshProfile,
      persistSession,
    }),
    [
      token,
      role,
      userId,
      userName,
      userEmail,
      publicUserId,
      permissions,
      mustChangePassword,
      ready,
      login,
      logout,
      refreshProfile,
      persistSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
