"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-slate-900 px-4 py-3 text-white lg:hidden">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Buka menu"
          className="rounded-lg px-2 py-1 text-xl leading-none hover:bg-slate-800"
        >
          ☰
        </button>
        <span className="font-bold">Yusup Cell</span>
        <span className="text-xs text-slate-400">Kasir Konter HP</span>
      </header>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <Sidebar mobileOpen={menuOpen} onNavigate={() => setMenuOpen(false)} />

      <main className="min-h-screen p-4 sm:p-6 lg:ml-60">{children}</main>
    </>
  );
}
