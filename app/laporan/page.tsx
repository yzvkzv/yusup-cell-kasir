"use client";

import { useMemo, useState } from "react";
import { formatIDR, useStore } from "../../lib/store";
import { PageHeader } from "../../components/ui";

type Range = "hari" | "minggu" | "bulan";

function startOf(range: Range): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === "minggu") d.setDate(d.getDate() - 6);
  if (range === "bulan") d.setDate(d.getDate() - 29);
  return d;
}

function Bar({ label, value, max, money }: { label: string; value: number; max: number; money?: boolean }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">
          {money ? formatIDR(value) : value}
        </span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  );
}

export default function Laporan() {
  const { transactions, products } = useStore();
  const [range, setRange] = useState<Range>("minggu");

  const data = useMemo(() => {
    const start = startOf(range);
    const txs = transactions.filter((t) => new Date(t.date) >= start);
    const revenue = txs.reduce((s, t) => s + t.total, 0);
    const itemsSold = txs.reduce(
      (s, t) => s + t.items.reduce((a, i) => a + i.qty, 0),
      0
    );

    const byProduct = new Map<string, { name: string; qty: number; total: number }>();
    const byCategory = new Map<string, number>();
    const byPayment = new Map<string, number>();
    for (const t of txs) {
      byPayment.set(t.paymentMethod, (byPayment.get(t.paymentMethod) ?? 0) + t.total);
      for (const it of t.items) {
        const cur = byProduct.get(it.name) ?? { name: it.name, qty: 0, total: 0 };
        cur.qty += it.qty;
        cur.total += it.price * it.qty;
        byProduct.set(it.name, cur);
        const p = products.find((x) => x.id === it.productId);
        const cat = p?.category ?? "Lainnya";
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.price * it.qty);
      }
    }
    const best = [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 8);
    const cats = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const pays = [...byPayment.entries()].sort((a, b) => b[1] - a[1]);

    // Omzet per hari
    const perDay = new Map<string, number>();
    for (const t of txs) {
      const key = t.date.slice(0, 10);
      perDay.set(key, (perDay.get(key) ?? 0) + t.total);
    }
    const days = [...perDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    return { txs, revenue, itemsSold, best, cats, pays, days };
  }, [transactions, products, range]);

  const rangeLabel =
    range === "hari" ? "Hari Ini" : range === "minggu" ? "7 Hari Terakhir" : "30 Hari Terakhir";
  const maxBest = Math.max(0, ...data.best.map((b) => b.qty));
  const maxCat = Math.max(0, ...data.cats.map((c) => c[1]));
  const maxPay = Math.max(0, ...data.pays.map((p) => p[1]));
  const maxDay = Math.max(0, ...data.days.map((d) => d[1]));

  return (
    <div>
      <PageHeader
        title="Laporan Penjualan"
        subtitle={`Periode: ${rangeLabel}`}
        actions={
          <div className="flex gap-1">
            {(["hari", "minggu", "bulan"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${
                  range === r
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {r === "hari" ? "Hari Ini" : r === "minggu" ? "7 Hari" : "30 Hari"}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total Omzet
          </p>
          <p className="mt-1 text-2xl font-bold">{formatIDR(data.revenue)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Jumlah Transaksi
          </p>
          <p className="mt-1 text-2xl font-bold">{data.txs.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Item Terjual
          </p>
          <p className="mt-1 text-2xl font-bold">{data.itemsSold}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 font-bold text-slate-800">Produk Terlaris</h2>
          {data.best.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            data.best.map((b) => (
              <Bar key={b.name} label={`${b.name} (x${b.qty})`} value={b.qty} max={maxBest} />
            ))
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 font-bold text-slate-800">Penjualan per Kategori</h2>
          {data.cats.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            data.cats.map(([cat, val]) => (
              <Bar key={cat} label={cat} value={val} max={maxCat} money />
            ))
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 font-bold text-slate-800">Penjualan per Metode Bayar</h2>
          {data.pays.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            data.pays.map(([m, val]) => (
              <Bar key={m} label={m} value={val} max={maxPay} money />
            ))
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 font-bold text-slate-800">Omzet per Hari</h2>
          {data.days.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Belum ada penjualan pada periode ini.
            </p>
          ) : (
            data.days.map(([day, val]) => (
              <Bar
                key={day}
                label={new Date(day + "T00:00:00").toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                })}
                value={val}
                max={maxDay}
                money
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
