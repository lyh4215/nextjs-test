"use client";
import {useAuth} from "@/app/providers/auth-context";

export default function Home() {
  const {auth, setAuth} = useAuth();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      {auth && <h1 className="text-5xl font-bold">Hello {auth.user} ✨</h1>}
      {!auth &&  <h1 className="text-5xl font-bold">Hello Codespaces ✨</h1>}
    </main>
  );
}
