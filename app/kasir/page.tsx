"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  Category,
  formatIDR,
  PaymentMethod,
  Product,
  SaleItem,
  Transaction,
  useStore,
} from "../../lib/store";
import { Btn, Modal, PageHeader } from "../../components/ui";
import Receipt from "../../components/Receipt";

export default function Kasir() {
  const { products, completeSale } = useStore();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Category | "Semua">("Semua");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("Tunai");
  const [cash, setCash] = useState("");
  const [notice, setNotice] = useState("");
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (cat === "Semua" || p.category === cat) &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()))
      ),
    [products, search, cat]
  );

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseInt(cash.replace(/[^0-9]/g, ""), 10) || 0;
  const change = payment === "Tunai" ? cashNum - total : 0;

  function addToCart(p: Product) {
    setNotice("");
    const inCart = cart.find((i) => i.productId === p.id);
    const qty = inCart ? inCart.qty + 1 : 1;
    if (p.stock >= 0 && qty > p.stock) {
      setNotice(`Stok ${p.name} tinggal ${p.stock}.`);
      return;
    }
    if (inCart) {
      setCart(cart.map((i) => (i.productId === p.id ? { ...i, qty } : i)));
    } else {
      setCart([...cart, { productId: p.id, name: p.name, price: p.sellPrice, qty: 1 }]);
    }
  }

  function setQty(id: string, qty: number) {
    const item = cart.find((i) => i.productId === id);
    const p = products.find((x) => x.id === id);
    if (!item) return;
    if (qty <= 0) {
      setCart(cart.filter((i) => i.productId !== id));
      return;
    }
    if (p && p.stock >= 0 && qty > p.stock) {
      setNotice(`Stok ${p.name} tinggal ${p.stock}.`);
      return;
    }
    setCart(cart.map((i) => (i.productId === id ? { ...i, qty } : i)));
  }

  function handleComplete() {
    if (cart.length === 0) return;
    if (payment === "Tunai" && cashNum < total) {
      setNotice("Uang tunai kurang dari total belanja.");
      return;
    }
    const tx = completeSale({
      items: cart,
      discount,
      paymentMethod: payment,
      cashPaid: payment === "Tunai" ? cashNum : total,
      type: "penjualan",
    });
    setLastTx(tx);
    setCart([]);
    setDiscount(0);
    setCash("");
    setNotice("");
  }

  const quickCash = [10000, 20000, 50000, 100000].map((v) => v);

  return (
    <div>
      <PageHeader
        title="Kasir"
        subtitle="Pilih produk, atur keranjang, lalu selesaikan pembayaran."
      />
      {notice && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Produk */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk atau SKU…"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <div className="flex flex-wrap gap-1">
              {(["Semua", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    cat === c
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const out = p.stock === 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={out}
                  className="rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-emerald-400 disabled:opacity-50"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                    {p.category}
                  </p>
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-800">
                    {p.name}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatIDR(p.sellPrice)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {p.stock < 0 ? "Tanpa stok" : out ? "Habis" : `Stok: ${p.stock}`}
                  </p>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-400">
                Produk tidak ditemukan.
              </p>
            )}
          </div>
        </div>

        {/* Keranjang */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-bold text-slate-800">Keranjang</h2>
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Keranjang masih kosong. Klik produk untuk menambah.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map((it) => (
                <li key={it.productId} className="py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{it.name}</p>
                      <p className="text-xs text-slate-400">{formatIDR(it.price)}</p>
                    </div>
                    <p className="text-sm font-bold">{formatIDR(it.price * it.qty)}</p>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <button
                      onClick={() => setQty(it.productId, it.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold hover:bg-slate-200"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                    <button
                      onClick={() => setQty(it.productId, it.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold hover:bg-slate-200"
                    >
                      +
                    </button>
                    <button
                      onClick={() => setCart(cart.filter((i) => i.productId !== it.productId))}
                      className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-2 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-semibold">{formatIDR(subtotal)}</span>
            </div>
            <label className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Diskon (Rp)</span>
              <input
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                placeholder="0"
                className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm outline-none focus:border-emerald-500"
              />
            </label>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatIDR(total)}</span>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">Metode Pembayaran</p>
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
          </div>

          {payment === "Tunai" && (
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Uang Diterima (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cash}
                onChange={(e) => setCash(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-base font-bold outline-none focus:border-emerald-500"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickCash.map((v) => (
                  <button
                    key={v}
                    onClick={() => setCash(String(v))}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    {formatIDR(v)}
                  </button>
                ))}
                <button
                  onClick={() => setCash(String(total))}
                  className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                >
                  Uang Pas
                </button>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-slate-500">Kembalian</span>
                <span className={`font-bold ${change < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatIDR(Math.max(0, change))}
                </span>
              </div>
            </div>
          )}

          <Btn
            onClick={handleComplete}
            disabled={cart.length === 0 || (payment === "Tunai" && cashNum < total)}
            className="mt-4 w-full py-3 text-base"
          >
            Selesaikan & Cetak Struk
          </Btn>
          {cart.length > 0 && (
            <button
              onClick={() => {
                setCart([]);
                setDiscount(0);
                setCash("");
                setNotice("");
              }}
              className="mt-2 w-full rounded-lg py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              Kosongkan Keranjang
            </button>
          )}
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
