"use client";

import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] border border-gray-100 rounded-md shadow-sm p-4 ${className}`}
    >
      {children}
    </div>
  );
}

