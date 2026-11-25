"use client";

import Link from "next/link";
import {
  formatIDR,
  formatDateTime,
  isSameDay,
  useStore,
} from "../lib/store";
import { PageHeader } from "../components/ui";

export default function Dashboard() {
  const { transactions, products, services, settings } = useStore();
  const today = new Date();

  const todayTx = transactions.filter((t) =>
    isSameDay(new Date(t.date), today)
  );
  const revenueToday = todayTx.reduce((s, t) => s + t.total, 0);
  const itemsToday = todayTx.reduce(
    (s, t) => s + t.items.reduce((a, i) => a + i.qty, 0),
    0
  );
  const lowStock = products.filter(
    (p) => p.stock >= 0 && p.stock <= (p.minStock || settings.lowStockDefault)
  );
  const activeServices = services.filter(
    (s) => s.status === "Diterima" || s.status === "Dikerjakan"
  );
  const readyServices = services.filter((s) => s.status === "Selesai");

  const topToday = new Map<string, { name: string; qty: number; total: number }>();
  for (const t of todayTx) {
    for (const it of t.items) {
      const cur = topToday.get(it.name) ?? { name: it.name, qty: 0, total: 0 };
      cur.qty += it.qty;
      cur.total += it.price * it.qty;
      topToday.set(it.name, cur);
    }
  }
  const topList = [...topToday.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const stats = [
    {
      label: "Omzet Hari Ini",
      value: formatIDR(revenueToday),
      sub: `${todayTx.length} transaksi`,
      icon: "💰",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Transaksi Hari Ini",
      value: String(todayTx.length),
      sub: `${itemsToday} item terjual`,
      icon: "🧾",
      color: "bg-sky-50 text-sky-600",
    },
    {
      label: "Servis Aktif",
      value: String(activeServices.length),
      sub: `${readyServices.length} selesai, menunggu diambil`,
      icon: "🔧",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Stok Menipis",
      value: String(lowStock.length),
      sub: "produk perlu restock",
      icon: "⚠️",
      color: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Selamat datang di ${settings.shopName}`}
        subtitle={today.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        actions={
          <Link
            href="/kasir"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Transaksi Baru
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${s.color}`}
            >
              {s.icon}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Terlaris Hari Ini</h2>
            <Link href="/laporan" className="text-sm font-semibold text-emerald-600">
              Lihat laporan →
            </Link>
          </div>
          {topList.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada penjualan hari ini.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {topList.map((t, i) => (
                <li key={t.name} className="flex items-center justify-between py-2.5">
                  <span className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    {t.name}
                    <span className="text-xs text-slate-400">x{t.qty}</span>
                  </span>
                  <span className="text-sm font-semibold">{formatIDR(t.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Transaksi Terakhir</h2>
            <Link href="/transaksi" className="text-sm font-semibold text-emerald-600">
              Semua transaksi →
            </Link>
          </div>
          {transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada transaksi.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.slice(0, 6).map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      {t.code}
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        {t.paymentMethod}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(t.date)} ·{" "}
                      {t.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {formatIDR(t.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-red-700">
            ⚠️ Stok menipis ({lowStock.length} produk)
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <Link
                key={p.id}
                href="/produk"
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200"
              >
                {p.name} — sisa {p.stock}
              </Link>
            ))}
          </div>
        </div>
      )}

      {readyServices.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-700">
            🔧 Servis selesai, menunggu diambil ({readyServices.length})
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {readyServices.map((s) => (
              <li key={s.id}>
                {s.code} — {s.customerName} · {s.device} ·{" "}
                <span className="font-semibold">{formatIDR(s.price)}</span>
                {s.paid ? " (sudah dibayar)" : " (belum dibayar)"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
