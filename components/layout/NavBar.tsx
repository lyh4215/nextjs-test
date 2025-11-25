"use client";
import { useState } from "react";
import Link from "next/link";

interface LinkSetProps {
  className? : string;
}
function LinkSet({className} : LinkSetProps) {
  return (
    <div className = {className}>
      <Link href="/" className="text-gray-700 hover:text-black">Home</Link>
      <Link href="/about" className="text-gray-700 hover:text-black">About</Link>
      <Link href="/blog" className="text-gray-700 hover:text-black">Blog</Link>
      <Link href="/contact" className="text-gray-700 hover:text-black">Contact</Link>
    </div>
  );
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className = "w-full border-b bg-white">
      <div className = "mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <div className = "text-xl font-bold">MyLogo</div>

        {/* Menu */}
        <LinkSet className = "hidden md:flex gap-6"/>

        {/* Mobile Button */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <LinkSet
        className={`
          md:hidden flex flex-col gap-4 px-6 transition-all overflow-hidden
          ${open ? "max-h-50 opacity-100 py-4" : "max-h-0 opacity-0 py-0"}
        `}
      />
    </nav>
  );
}
