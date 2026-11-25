"use client";

import { formatDateTime, formatIDR, Transaction, useStore } from "../lib/store";

export default function Receipt({ tx }: { tx: Transaction }) {
  const { settings } = useStore();
  return (
    <div className="receipt w-full max-w-[320px] bg-white font-mono text-[13px] leading-relaxed text-slate-800">
      <div className="text-center">
        <p className="text-base font-bold">{settings.shopName}</p>
        <p className="whitespace-pre-line text-xs">{settings.address}</p>
      </div>
      <div className="my-2 border-t border-dashed border-slate-400" />
      <div className="flex justify-between text-xs">
        <span>{tx.code}</span>
        <span>{formatDateTime(tx.date)}</span>
      </div>
      {tx.customerName && (
        <p className="text-xs">Pelanggan: {tx.customerName}</p>
      )}
      {tx.phoneNumber && (
        <p className="text-xs">
          No. HP: {tx.phoneNumber}
          {tx.operator ? ` (${tx.operator})` : ""}
        </p>
      )}
      <div className="my-2 border-t border-dashed border-slate-400" />
      {tx.items.map((it, i) => (
        <div key={i} className="mb-1">
          <p>{it.name}</p>
          <div className="flex justify-between text-xs">
            <span>
              {it.qty} x {formatIDR(it.price)}
              {it.meta ? ` — ${it.meta}` : ""}
            </span>
            <span>{formatIDR(it.price * it.qty)}</span>
          </div>
        </div>
      ))}
      <div className="my-2 border-t border-dashed border-slate-400" />
      <div className="flex justify-between text-xs">
        <span>Subtotal</span>
        <span>{formatIDR(tx.subtotal)}</span>
      </div>
      {tx.discount > 0 && (
        <div className="flex justify-between text-xs">
          <span>Diskon</span>
          <span>-{formatIDR(tx.discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold">
        <span>Total</span>
        <span>{formatIDR(tx.total)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span>
          {tx.paymentMethod === "Tunai"
            ? "Tunai"
            : tx.paymentMethod === "QRIS"
              ? "QRIS"
              : "Transfer"}
        </span>
        <span>{formatIDR(tx.cashPaid ?? tx.total)}</span>
      </div>
      {tx.change != null && tx.change > 0 && (
        <div className="flex justify-between text-xs">
          <span>Kembali</span>
          <span>{formatIDR(tx.change)}</span>
        </div>
      )}
      <div className="my-2 border-t border-dashed border-slate-400" />
      <p className="whitespace-pre-line text-center text-[11px]">
        {settings.receiptFooter}
      </p>
    </div>
  );
}
