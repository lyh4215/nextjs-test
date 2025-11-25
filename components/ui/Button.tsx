"use client";

import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const base =
    "px-4 py-2 rounded-md font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-700 text-white hover:bg-gray-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    outline:
      "border border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-black",
    ghost: "text-gray-700 hover:bg-gray-100",
  };

  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    />
  );
}
