import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import type { StoreData } from "../../../lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KV_KEY = "yusup-cell:data";

function kvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}

function isValidStoreData(value: unknown): value is StoreData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.products) &&
    Array.isArray(v.services) &&
    Array.isArray(v.transactions) &&
    typeof v.settings === "object" &&
    v.settings !== null
  );
}

// GET /api/data — ambil seluruh data kasir dari Vercel KV.
// 503 kalau KV belum dikonfigurasi (aplikasi tetap jalan pakai localStorage).
export async function GET() {
  if (!kvConfigured()) {
    return NextResponse.json(
      { ok: false, error: "KV belum dikonfigurasi" },
      { status: 503 }
    );
  }
  try {
    const data = await kv.get<StoreData>(KV_KEY);
    return NextResponse.json({ ok: true, data: data ?? null });
  } catch (err) {
    console.error("Gagal membaca Vercel KV:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal membaca Vercel KV" },
      { status: 500 }
    );
  }
}

// POST /api/data — simpan seluruh data kasir ke Vercel KV.
export async function POST(request: Request) {
  if (!kvConfigured()) {
    return NextResponse.json(
      { ok: false, error: "KV belum dikonfigurasi" },
      { status: 503 }
    );
  }
  try {
    const body: unknown = await request.json();
    if (!isValidStoreData(body)) {
      return NextResponse.json(
        { ok: false, error: "Format data tidak valid" },
        { status: 400 }
      );
    }
    await kv.set(KV_KEY, body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Gagal menyimpan ke Vercel KV:", err);
    return NextResponse.json(
      { ok: false, error: "Gagal menyimpan ke Vercel KV" },
      { status: 500 }
    );
  }
}
