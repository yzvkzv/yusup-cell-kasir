"use client";

import { useMemo, useState } from "react";
import {
  formatDate,
  formatIDR,
  PaymentMethod,
  SERVICE_STATUSES,
  ServiceStatus,
  ServiceTicket,
  Transaction,
  useStore,
} from "../../lib/store";
import { Btn, Field, inputCls, Modal, PageHeader } from "../../components/ui";
import Receipt from "../../components/Receipt";

const STATUS_STYLE: Record<ServiceStatus, string> = {
  Diterima: "bg-sky-100 text-sky-700",
  Dikerjakan: "bg-amber-100 text-amber-700",
  Selesai: "bg-emerald-100 text-emerald-700",
  Diambil: "bg-slate-200 text-slate-600",
};

const NEXT_STATUS: Record<ServiceStatus, ServiceStatus | null> = {
  Diterima: "Dikerjakan",
  Dikerjakan: "Selesai",
  Selesai: "Diambil",
  Diambil: null,
};

export default function Servis() {
  const { services, addService, updateService, deleteService, completeSale } =
    useStore();
  const [filter, setFilter] = useState<ServiceStatus | "Semua">("Semua");
  const [showForm, setShowForm] = useState(false);
  const [payTicket, setPayTicket] = useState<ServiceTicket | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("Tunai");
  const [cash, setCash] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);

  const [f, setF] = useState({
    customerName: "",
    phone: "",
    device: "",
    problem: "",
    price: "",
    notes: "",
  });

  const filtered = useMemo(
    () => services.filter((s) => filter === "Semua" || s.status === filter),
    [services, filter]
  );

  const cashNum = parseInt(cash.replace(/[^0-9]/g, ""), 10) || 0;

  function saveTicket() {
    if (!f.customerName.trim() || !f.device.trim() || !f.problem.trim()) return;
    addService({
      customerName: f.customerName.trim(),
      phone: f.phone.trim(),
      device: f.device.trim(),
      problem: f.problem.trim(),
      price: parseInt(f.price, 10) || 0,
      status: "Diterima",
      notes: f.notes.trim() || undefined,
    });
    setF({ customerName: "", phone: "", device: "", problem: "", price: "", notes: "" });
    setShowForm(false);
  }

  function handlePay() {
    if (!payTicket) return;
    if (payment === "Tunai" && cashNum < payTicket.price) return;
    const tx = completeSale({
      items: [
        {
          productId: `service-${payTicket.id}`,
          name: `Servis: ${payTicket.device} — ${payTicket.problem}`,
          price: payTicket.price,
          qty: 1,
        },
      ],
      discount: 0,
      paymentMethod: payment,
      cashPaid: payment === "Tunai" ? cashNum : payTicket.price,
      type: "servis",
      serviceId: payTicket.id,
      customerName: payTicket.customerName,
    });
    setLastTx(tx);
    setPayTicket(null);
    setCash("");
  }

  return (
    <div>
      <PageHeader
        title="Servis HP"
        subtitle="Tiket perbaikan: terima, kerjakan, selesai, lalu bayar & ambil."
        actions={<Btn onClick={() => setShowForm(true)}>+ Tiket Baru</Btn>}
      />

      <div className="mb-4 flex flex-wrap gap-1">
        {(["Semua", ...SERVICE_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === s
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {s}
            {s !== "Semua" &&
              ` (${services.filter((x) => x.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => {
          const next = NEXT_STATUS[s.status];
          return (
            <div
              key={s.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{s.code}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(s.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[s.status]}`}
                >
                  {s.status}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                {s.customerName}
                {s.phone && <span className="font-normal text-slate-500"> · {s.phone}</span>}
              </p>
              <p className="text-sm text-slate-600">{s.device}</p>
              <p className="mt-1 text-sm text-slate-500">{s.problem}</p>
              {s.notes && (
                <p className="mt-1 text-xs italic text-slate-400">{s.notes}</p>
              )}
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-base font-bold">{formatIDR(s.price)}</span>
                <span
                  className={`text-xs font-semibold ${
                    s.paid ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {s.paid ? "✓ Sudah dibayar" : "Belum dibayar"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {next && (
                  <Btn
                    variant="secondary"
                    onClick={() => updateService(s.id, { status: next })}
                  >
                    → {next}
                  </Btn>
                )}
                {s.status === "Selesai" && !s.paid && (
                  <Btn
                    onClick={() => {
                      setPayTicket(s);
                      setPayment("Tunai");
                      setCash("");
                    }}
                  >
                    💰 Bayar di Kasir
                  </Btn>
                )}
                <button
                  onClick={() => setDeleteId(s.id)}
                  className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700"
                >
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-slate-400">
            Tidak ada tiket servis dengan status ini.
          </p>
        )}
      </div>

      {showForm && (
        <Modal title="Tiket Servis Baru" onClose={() => setShowForm(false)}>
          <div className="space-y-3">
            <Field label="Nama Pelanggan">
              <input
                value={f.customerName}
                onChange={(e) => setF({ ...f, customerName: e.target.value })}
                className={inputCls}
                placeholder="cth: Andi Wijaya"
              />
            </Field>
            <Field label="No. HP Pelanggan">
              <input
                value={f.phone}
                onChange={(e) => setF({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") })}
                inputMode="numeric"
                className={inputCls}
                placeholder="08xxxxxxxxxx"
              />
            </Field>
            <Field label="Perangkat">
              <input
                value={f.device}
                onChange={(e) => setF({ ...f, device: e.target.value })}
                className={inputCls}
                placeholder="cth: Samsung Galaxy A05"
              />
            </Field>
            <Field label="Keluhan / Kerusakan">
              <textarea
                value={f.problem}
                onChange={(e) => setF({ ...f, problem: e.target.value })}
                className={inputCls}
                rows={2}
                placeholder="cth: LCD retak, layar tidak tampil"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estimasi Biaya (Rp)">
                <input
                  type="number"
                  min={0}
                  value={f.price}
                  onChange={(e) => setF({ ...f, price: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Catatan (opsional)">
                <input
                  value={f.notes}
                  onChange={(e) => setF({ ...f, notes: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setShowForm(false)}>
                Batal
              </Btn>
              <Btn
                onClick={saveTicket}
                disabled={!f.customerName.trim() || !f.device.trim() || !f.problem.trim()}
              >
                Simpan Tiket
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {payTicket && (
        <Modal
          title={`Bayar Servis — ${payTicket.code}`}
          onClose={() => setPayTicket(null)}
        >
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan</span>
              <span className="font-semibold">{payTicket.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perangkat</span>
              <span className="font-semibold">{payTicket.device}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total Bayar</span>
              <span>{formatIDR(payTicket.price)}</span>
            </div>
            <p className="text-xs font-semibold text-slate-500">Metode Pembayaran</p>
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
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">
                  Uang Diterima (Rp)
                </label>
                <input
                  value={cash}
                  onChange={(e) => setCash(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-base font-bold outline-none focus:border-emerald-500"
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">Kembalian</span>
                  <span className="font-bold text-emerald-600">
                    {formatIDR(Math.max(0, cashNum - payTicket.price))}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Btn variant="secondary" onClick={() => setPayTicket(null)}>
                Batal
              </Btn>
              <Btn
                onClick={handlePay}
                disabled={payment === "Tunai" && cashNum < payTicket.price}
              >
                Bayar & Tandai Diambil
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Hapus Tiket Servis?" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-slate-600">
            Tiket{" "}
            <strong>{services.find((s) => s.id === deleteId)?.code}</strong> akan
            dihapus permanen.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setDeleteId(null)}>
              Batal
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                deleteService(deleteId);
                setDeleteId(null);
              }}
            >
              Ya, Hapus
            </Btn>
          </div>
        </Modal>
      )}

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
