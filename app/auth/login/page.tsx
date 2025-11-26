"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/auth-context";

export default function Login() {
  const { setAuth } = useAuth();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Provider 상태 업데이트
    setAuth({
      user: id,
      password: pw,
    });
  }

  return (
    <div className = "flex justify-center items-center py-6">
      <form onSubmit={handleLogin} className = "flex flex-col justify-center items-center gap-6">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          className= "border-1"
          placeholder="ID"
        />
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className= "border-1"
          type="password"
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
