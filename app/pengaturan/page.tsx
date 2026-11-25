"use client";

import { useRef, useState } from "react";
import { StoreData, useStore } from "../../lib/store";
import { Btn, Field, inputCls, Modal, PageHeader } from "../../components/ui";

export default function Pengaturan() {
  const { settings, updateSettings, importData, resetData, products, services, transactions } =
    useStore();
  const [shopName, setShopName] = useState(settings.shopName);
  const [address, setAddress] = useState(settings.address);
  const [footer, setFooter] = useState(settings.receiptFooter);
  const [lowStock, setLowStock] = useState(String(settings.lowStockDefault));
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function save() {
    updateSettings({
      shopName: shopName.trim() || "Yusup Cell",
      address: address.trim(),
      receiptFooter: footer,
      lowStockDefault: parseInt(lowStock, 10) || 5,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function exportJson() {
    const data: StoreData = {
      products,
      services,
      transactions,
      settings: {
        shopName,
        address,
        receiptFooter: footer,
        lowStockDefault: parseInt(lowStock, 10) || 5,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yusup-cell-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as StoreData;
        if (
          !parsed ||
          !Array.isArray(parsed.products) ||
          !Array.isArray(parsed.transactions) ||
          !Array.isArray(parsed.services) ||
          !parsed.settings
        ) {
          throw new Error("Format file tidak valid");
        }
        importData(parsed);
        setImportError("");
        alert("Data berhasil diimpor.");
      } catch {
        setImportError("File backup tidak valid. Impor dibatalkan.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <PageHeader
        title="Pengaturan"
        subtitle="Nama toko, struk, batas stok, dan cadangan data."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 font-bold text-slate-800">Toko & Struk</h2>
          <div className="space-y-3">
            <Field label="Nama Toko">
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Alamat (tampil di struk)">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Teks Kaki Struk">
              <textarea
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
                className={inputCls}
                rows={3}
              />
            </Field>
            <Field label="Batas Stok Menipis Default">
              <input
                type="number"
                min={0}
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
                className={inputCls}
              />
            </Field>
            <div className="flex items-center gap-2 pt-1">
              <Btn onClick={save}>Simpan Pengaturan</Btn>
              {saved && (
                <span className="text-sm font-semibold text-emerald-600">
                  ✓ Tersimpan
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-2 font-bold text-slate-800">Cadangan Data (Backup)</h2>
            <p className="mb-4 text-sm text-slate-500">
              Semua data tersimpan di browser perangkat ini. Unduh cadangan
              secara berkala agar data aman jika browser dibersihkan.
            </p>
            <div className="flex flex-wrap gap-2">
              <Btn onClick={exportJson}>⬇️ Unduh Backup (.json)</Btn>
              <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
                ⬆️ Impor Backup
              </Btn>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                  e.target.value = "";
                }}
              />
            </div>
            {importError && (
              <p className="mt-2 text-sm font-semibold text-red-600">{importError}</p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              {products.length} produk · {transactions.length} transaksi ·{" "}
              {services.length} tiket servis tersimpan.
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-bold text-red-700">Zona Berbahaya</h2>
            <p className="mt-1 text-sm text-red-600">
              Kembalikan semua data ke kondisi awal (produk, transaksi, dan
              servis contoh). Data yang sudah diinput akan hilang.
            </p>
            <Btn
              variant="danger"
              className="mt-3"
              onClick={() => setConfirmReset(true)}
            >
              Reset ke Data Awal
            </Btn>
          </div>
        </div>
      </div>

      {confirmReset && (
        <Modal title="Reset Semua Data?" onClose={() => setConfirmReset(false)}>
          <p className="text-sm text-slate-600">
            Semua produk, transaksi, dan tiket servis akan dikembalikan ke data
            contoh awal. Pastikan sudah mengunduh backup jika data sekarang
            penting.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setConfirmReset(false)}>
              Batal
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                resetData();
                setConfirmReset(false);
              }}
            >
              Ya, Reset
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
