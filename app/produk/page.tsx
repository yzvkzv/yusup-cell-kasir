"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  Category,
  formatIDR,
  OPERATORS,
  Product,
  useStore,
} from "../../lib/store";
import { Btn, Field, inputCls, Modal, PageHeader } from "../../components/ui";

type FormState = {
  name: string;
  category: Category;
  buyPrice: string;
  sellPrice: string;
  stock: string;
  minStock: string;
  operator: string;
};

const emptyForm: FormState = {
  name: "",
  category: "Aksesoris",
  buyPrice: "",
  sellPrice: "",
  stock: "0",
  minStock: "5",
  operator: "",
};

export default function Produk() {
  const { products, settings, addProduct, updateProduct, deleteProduct } =
    useStore();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<Category | "Semua">("Semua");
  const [form, setForm] = useState<FormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      buyPrice: String(p.buyPrice),
      sellPrice: String(p.sellPrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      operator: p.operator ?? "",
    });
  }

  function save() {
    if (!form || !form.name.trim()) return;
    const stock = parseInt(form.stock, 10);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      buyPrice: parseInt(form.buyPrice, 10) || 0,
      sellPrice: parseInt(form.sellPrice, 10) || 0,
      stock: isNaN(stock) ? 0 : stock,
      minStock: parseInt(form.minStock, 10) || settings.lowStockDefault,
      operator: form.operator || undefined,
    };
    if (editingId) {
      updateProduct(editingId, payload);
    } else {
      const sku = `${form.category.slice(0, 3).toUpperCase()}-${Date.now()
        .toString()
        .slice(-6)}`;
      addProduct({ ...payload, sku });
    }
    setForm(null);
    setEditingId(null);
  }

  const isUnlimited = form?.stock === "-1";

  return (
    <div>
      <PageHeader
        title="Produk"
        subtitle={`${products.length} produk · klik produk untuk ubah, atau tambah baru.`}
        actions={<Btn onClick={openAdd}>+ Tambah Produk</Btn>}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama produk atau SKU…"
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

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Produk</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3 text-right">Harga Beli</th>
              <th className="px-4 py-3 text-right">Harga Jual</th>
              <th className="px-4 py-3 text-right">Stok</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => {
              const low =
                p.stock >= 0 && p.stock <= (p.minStock || settings.lowStockDefault);
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.sku}
                      {p.operator ? ` · ${p.operator}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{formatIDR(p.buyPrice)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatIDR(p.sellPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.stock < 0 ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span
                        className={`font-semibold ${low ? "text-red-600" : "text-slate-800"}`}
                      >
                        {p.stock}
                        {low && " ⚠️"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-2 font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="font-semibold text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                  Produk tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <Modal
          title={editingId ? "Ubah Produk" : "Tambah Produk"}
          onClose={() => setForm(null)}
        >
          <div className="space-y-3">
            <Field label="Nama Produk">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
                placeholder="cth: Case HP Transparan"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as Category })
                  }
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Operator (opsional)">
                <select
                  value={form.operator}
                  onChange={(e) => setForm({ ...form, operator: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {OPERATORS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga Beli (Rp)">
                <input
                  type="number"
                  min={0}
                  value={form.buyPrice}
                  onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Harga Jual (Rp)">
                <input
                  type="number"
                  min={0}
                  value={form.sellPrice}
                  onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stok (isi -1 untuk tanpa stok)">
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Batas Stok Menipis">
                <input
                  type="number"
                  min={0}
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            {isUnlimited && (
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
                Stok -1 berarti produk tanpa stok (misal pulsa / jasa) — penjualan
                tidak mengurangi stok.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setForm(null)}>
                Batal
              </Btn>
              <Btn onClick={save} disabled={!form.name.trim()}>
                Simpan
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Hapus Produk?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600">
            Produk{" "}
            <strong>
              {products.find((p) => p.id === deleteId)?.name}
            </strong>{" "}
            akan dihapus permanen. Riwayat transaksi yang sudah ada tidak
            berubah.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setDeleteId(null)}>
              Batal
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                deleteProduct(deleteId);
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
