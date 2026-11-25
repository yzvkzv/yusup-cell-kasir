"use client";

import { useMemo, useState } from "react";
import { formatDateTime, formatIDR, Transaction, useStore } from "../../lib/store";
import { Btn, Modal, PageHeader } from "../../components/ui";
import Receipt from "../../components/Receipt";

export default function Transaksi() {
  const { transactions, deleteTransaction } = useStore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"Semua" | "penjualan" | "pulsa" | "servis">("Semua");
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (type !== "Semua" && t.type !== type) return false;
      const d = t.date.slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [transactions, from, to, type]);

  const total = filtered.reduce((s, t) => s + t.total, 0);

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        subtitle={`${filtered.length} transaksi · total ${formatIDR(total)}`}
      />

      <div className="mb-4 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Dari</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">Sampai</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
        </label>
        <div className="flex gap-1">
          {(["Semua", "penjualan", "pulsa", "servis"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-2 text-xs font-semibold capitalize ${
                type === t
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(from || to || type !== "Semua") && (
          <button
            onClick={() => {
              setFrom("");
              setTo("");
              setType("Semua");
            }}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Kode / Waktu</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Jenis</th>
              <th className="px-4 py-3">Bayar</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{t.code}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(t.date)}</p>
                </td>
                <td className="max-w-[260px] px-4 py-3">
                  <p className="truncate text-slate-600">
                    {t.items.map((i) => `${i.name} x${i.qty}`).join(", ")}
                  </p>
                  {t.phoneNumber && (
                    <p className="text-xs text-slate-400">
                      {t.phoneNumber}
                      {t.operator ? ` · ${t.operator}` : ""}
                    </p>
                  )}
                  {t.customerName && (
                    <p className="text-xs text-slate-400">{t.customerName}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold capitalize text-slate-600">
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3">{t.paymentMethod}</td>
                <td className="px-4 py-3 text-right font-bold">
                  {formatIDR(t.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setDetail(t)}
                    className="mr-2 font-semibold text-emerald-600 hover:text-emerald-800"
                  >
                    Detail
                  </button>
                  <button
                    onClick={() => setDeleteId(t.id)}
                    className="font-semibold text-red-500 hover:text-red-700"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                  Tidak ada transaksi pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <Modal title={`Detail — ${detail.code}`} onClose={() => setDetail(null)} wide>
          <div className="flex flex-col items-center">
            <div className="print-area">
              <Receipt tx={detail} />
            </div>
            <div className="mt-4 flex gap-2">
              <Btn onClick={() => window.print()}>🖨️ Cetak Ulang Struk</Btn>
              <Btn variant="secondary" onClick={() => setDetail(null)}>
                Tutup
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Hapus Transaksi?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600">
            Transaksi{" "}
            <strong>
              {transactions.find((t) => t.id === deleteId)?.code}
            </strong>{" "}
            akan dihapus dari riwayat. Stok produk tidak dikembalikan.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setDeleteId(null)}>
              Batal
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                deleteTransaction(deleteId);
                setDeleteId(null);
              }}
            >
              Ya, Hapus
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
