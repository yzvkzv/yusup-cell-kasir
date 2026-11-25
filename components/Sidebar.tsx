"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "../lib/store";

const MENU: Array<{ href: string; label: string; icon: string }> = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/kasir", label: "Kasir", icon: "🧾" },
  { href: "/pulsa", label: "Pulsa & Data", icon: "📱" },
  { href: "/produk", label: "Produk", icon: "📦" },
  { href: "/servis", label: "Servis", icon: "🔧" },
  { href: "/transaksi", label: "Transaksi", icon: "📋" },
  { href: "/laporan", label: "Laporan", icon: "📊" },
  { href: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

export default function Sidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { settings, products, services, syncStatus } = useStore();
  const lowStock = products.filter(
    (p) => p.stock >= 0 && p.stock <= (p.minStock || settings.lowStockDefault)
  ).length;
  const activeService = services.filter(
    (s) => s.status === "Diterima" || s.status === "Dikerjakan"
  ).length;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 lg:translate-x-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-xl font-bold text-white">
          YC
        </div>
        <div>
          <p className="text-base font-bold leading-tight text-white">
            {settings.shopName}
          </p>
          <p className="text-xs text-slate-400">Kasir Konter HP</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {MENU.map((m) => {
          const active =
            m.href === "/"
              ? pathname === "/"
              : pathname === m.href || pathname.startsWith(m.href + "/");
          const badge =
            m.href === "/produk" && lowStock > 0
              ? lowStock
              : m.href === "/servis" && activeService > 0
                ? activeService
                : null;
          return (
            <Link
              key={m.href}
              href={m.href}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-base">{m.icon}</span>
                {m.label}
              </span>
              {badge !== null && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 text-xs leading-relaxed text-slate-400">
        <p className="font-semibold text-slate-300">Yusup Cell</p>
        <p
          className={
            syncStatus === "cloud"
              ? "text-emerald-400"
              : syncStatus === "error"
                ? "text-amber-400"
                : undefined
          }
        >
          {syncStatus === "cloud"
            ? "● Data tersinkron ke cloud (Vercel KV)"
            : syncStatus === "saving"
              ? "Menyimpan ke cloud…"
              : syncStatus === "error"
                ? "● Gagal sinkron — data aman di perangkat ini"
                : "Data tersimpan di perangkat ini (localStorage)."}
        </p>
      </div>
    </aside>
  );
}
