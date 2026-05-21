import React, { createContext, useEffect, useState } from "react";
import {
  getToken,
  getUser,
  removeToken,
  removeUser,
  saveToken,
  saveUser
} from "../storage/tokenStorage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = async () => {
    const token = await getToken();
    const storedUser = await getUser();

    if (token && storedUser) {
      setUser(storedUser);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (token, userData) => {
    await saveToken(token);
    await saveUser(userData);
    setUser(userData);
  };

  const logout = async () => {
    await removeToken();
    await removeUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}