"use client";

import React from "react";
import Navbar from "@/components/ui/navbar";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="px-6 py-8 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
import React from "react";
import Navbar from "@/components/ui/navbar";
import styles from "./Layout.module.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <Navbar />
      <div className="container">
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
