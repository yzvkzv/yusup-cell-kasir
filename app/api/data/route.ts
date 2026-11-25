import { createClient } from "@vercel/kv";
import { NextResponse } from "next/server";
import type { StoreData } from "../../../lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KV_KEY = "yusup-cell:data";

// Vercel KV (nama lama) dan Upstash Redis (nama baru di dashboard Vercel)
// memakai API yang sama. Terima kedua nama environment variable-nya,
// supaya store yang dibuat dari menu Storage mana pun langsung jalan.
const KV_URL =
  process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const kv =
  KV_URL && KV_TOKEN ? createClient({ url: KV_URL, token: KV_TOKEN }) : null;

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

// GET /api/data — ambil seluruh data kasir dari Vercel KV / Upstash Redis.
// 503 kalau store belum dikonfigurasi (aplikasi tetap jalan pakai localStorage).
export async function GET() {
  if (!kv) {
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

// POST /api/data — simpan seluruh data kasir ke Vercel KV / Upstash Redis.
export async function POST(request: Request) {
  if (!kv) {
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
