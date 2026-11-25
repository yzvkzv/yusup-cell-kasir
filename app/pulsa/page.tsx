"use client";

import { useMemo, useState } from "react";
import {
  formatIDR,
  OPERATORS,
  PaymentMethod,
  Transaction,
  useStore,
} from "../../lib/store";
import { Btn, Modal, PageHeader } from "../../components/ui";
import Receipt from "../../components/Receipt";

export default function Pulsa() {
  const { products, completeSale } = useStore();
  const [operator, setOperator] = useState("Telkomsel");
  const [tab, setTab] = useState<"Pulsa" | "Paket Data">("Pulsa");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("Tunai");
  const [cash, setCash] = useState("");
  const [notice, setNotice] = useState("");
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  const list = useMemo(
    () =>
      products.filter(
        (p) => p.category === tab && (tab === "Paket Data" ? p.operator === operator : p.operator === operator)
      ),
    [products, operator, tab]
  );

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const cashNum = parseInt(cash.replace(/[^0-9]/g, ""), 10) || 0;
  const total = selected ? selected.sellPrice : 0;

  function handleSell() {
    if (!selected) {
      setNotice("Pilih nominal dulu.");
      return;
    }
    if (phone.replace(/[^0-9]/g, "").length < 10) {
      setNotice("Masukkan nomor HP yang valid (minimal 10 digit).");
      return;
    }
    if (payment === "Tunai" && cashNum < total) {
      setNotice("Uang tunai kurang dari harga.");
      return;
    }
    const tx = completeSale({
      items: [
        {
          productId: selected.id,
          name: selected.name,
          price: selected.sellPrice,
          qty: 1,
          meta: phone,
        },
      ],
      discount: 0,
      paymentMethod: payment,
      cashPaid: payment === "Tunai" ? cashNum : total,
      type: "pulsa",
      phoneNumber: phone,
      operator,
    });
    setLastTx(tx);
    setSelectedId(null);
    setPhone("");
    setCash("");
    setNotice("");
  }

  return (
    <div>
      <PageHeader
        title="Pulsa & Paket Data"
        subtitle="Pilih operator, nominal, isi nomor HP, lalu jual."
      />
      {notice && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {notice}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {(["Pulsa", "Paket Data"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedId(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              tab === t
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {OPERATORS.map((op) => (
          <button
            key={op}
            onClick={() => {
              setOperator(op);
              setSelectedId(null);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              operator === op
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {op}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`rounded-2xl p-4 text-left shadow-sm ring-1 transition ${
                  selectedId === p.id
                    ? "bg-emerald-600 text-white ring-emerald-600"
                    : "bg-white ring-slate-200 hover:ring-emerald-400"
                }`}
              >
                <p className="text-sm font-semibold">{p.name}</p>
                <p
                  className={`mt-1 text-lg font-bold ${
                    selectedId === p.id ? "text-white" : "text-slate-900"
                  }`}
                >
                  {formatIDR(p.sellPrice)}
                </p>
                <p
                  className={`text-xs ${
                    selectedId === p.id ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  Modal {formatIDR(p.buyPrice)}
                </p>
              </button>
            ))}
            {list.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">
                Belum ada {tab.toLowerCase()} untuk {operator}.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-bold text-slate-800">Penjualan</h2>
          <label className="mb-1 block text-xs font-semibold text-slate-500">
            Nomor HP Tujuan
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="08xxxxxxxxxx"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base font-semibold outline-none focus:border-emerald-500"
          />
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Produk</span>
              <span className="font-semibold text-right">
                {selected ? selected.name : "—"}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
          </div>

          <p className="mb-2 mt-4 text-xs font-semibold text-slate-500">
            Metode Pembayaran
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(["Tunai", "QRIS", "Transfer"] as PaymentMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setPayment(m)}
                className={`rounded-lg px-2 py-2 text-sm font-semibold ${
                  payment === m
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {payment === "Tunai" && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Uang Diterima (Rp)
              </label>
              <input
                value={cash}
                onChange={(e) => setCash(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-base font-bold outline-none focus:border-emerald-500"
              />
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Kembalian</span>
                <span className="font-bold text-emerald-600">
                  {formatIDR(Math.max(0, cashNum - total))}
                </span>
              </div>
            </div>
          )}

          <Btn
            onClick={handleSell}
            disabled={!selected || (payment === "Tunai" && cashNum < total)}
            className="mt-4 w-full py-3 text-base"
          >
            Jual Sekarang
          </Btn>
          <p className="mt-2 text-center text-xs text-slate-400">
            Pulsa & paket data tidak mengurangi stok.
          </p>
        </div>
      </div>

      {lastTx && (
        <Modal title={`Struk — ${lastTx.code}`} onClose={() => setLastTx(null)} wide>
          <div className="flex flex-col items-center">
            <div className="print-area">
              <Receipt tx={lastTx} />
            </div>
            <div className="mt-4 flex gap-2">
              <Btn onClick={() => window.print()}>🖨️ Cetak Struk</Btn>
              <Btn variant="secondary" onClick={() => setLastTx(null)}>
                Tutup
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
