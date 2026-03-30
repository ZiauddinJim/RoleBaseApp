import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const [userId, setUserId] = useState(localStorage.getItem("userId") || null);
  const [userName, setUserName] = useState(localStorage.getItem("userName") || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem("userEmail") || null);

  const login = (newToken, newRole, newUserId, newName, newEmail) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", newRole);
    if (newUserId) localStorage.setItem("userId", newUserId);
    if (newName) localStorage.setItem("userName", newName);
    if (newEmail) localStorage.setItem("userEmail", newEmail);

    setToken(newToken);
    setRole(newRole);
    if (newUserId) setUserId(newUserId);
    if (newName) setUserName(newName);
    if (newEmail) setUserEmail(newEmail);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    
    setToken(null);
    setRole(null);
    setUserId(null);
    setUserName(null);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, userName, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
