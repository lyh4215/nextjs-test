"use client";

import {useState, createContext, useContext, useEffect, ReactNode} from "react";

type AuthProviderProps = {
  children: ReactNode;
};

type Auth = {
    user : string;
    password : string;
};

type AuthContextType = {
    auth: Auth | null;
    setAuth: (a: Auth | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({children} : AuthProviderProps) {
  const [auth, setAuth] = useState<Auth | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("auth");
        if (saved) setAuth(JSON.parse(saved));
    }, []);

    // ⭐ auth 변경될 때마다 localStorage 저장
    useEffect(() => {
        if (auth) {
        localStorage.setItem("auth", JSON.stringify(auth));
        } else {
        localStorage.removeItem("auth");
        }
    }, [auth]);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}