"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ---------- Types ----------

export type Category =
  | "Pulsa"
  | "Paket Data"
  | "Aksesoris"
  | "HP & Kartu"
  | "Servis";

export const CATEGORIES: Category[] = [
  "Pulsa",
  "Paket Data",
  "Aksesoris",
  "HP & Kartu",
  "Servis",
];

export const OPERATORS = [
  "Telkomsel",
  "Indosat",
  "XL",
  "Tri",
  "Axis",
  "Smartfren",
];

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  buyPrice: number;
  sellPrice: number;
  stock: number; // -1 = tanpa stok (pulsa / jasa)
  minStock: number;
  operator?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  meta?: string;
}

export type PaymentMethod = "Tunai" | "QRIS" | "Transfer";

export interface Transaction {
  id: string;
  code: string;
  date: string; // ISO string
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashPaid?: number;
  change?: number;
  type: "penjualan" | "pulsa" | "servis";
  phoneNumber?: string;
  operator?: string;
  serviceId?: string;
  customerName?: string;
}

export type ServiceStatus = "Diterima" | "Dikerjakan" | "Selesai" | "Diambil";

export const SERVICE_STATUSES: ServiceStatus[] = [
  "Diterima",
  "Dikerjakan",
  "Selesai",
  "Diambil",
];

export interface ServiceTicket {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  device: string;
  problem: string;
  price: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
  paid: boolean;
  notes?: string;
}

export interface Settings {
  shopName: string;
  address: string;
  receiptFooter: string;
  lowStockDefault: number;
}

export interface StoreData {
  products: Product[];
  services: ServiceTicket[];
  transactions: Transaction[];
  settings: Settings;
}

// ---------- Helpers ----------

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

export function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const STORAGE_KEY = "yusup-cell-data-v1";

// ---------- Seed data ----------

function seedProducts(): Product[] {
  const list: Product[] = [];
  const add = (p: Omit<Product, "id">) =>
    list.push({ ...p, id: uid() });

  // Pulsa — harga jual = nominal + margin kecil
  const pulsaMarkup: Record<number, number> = {
    5000: 1500,
    10000: 1500,
    20000: 1000,
    25000: 1000,
    50000: 1000,
    100000: 1000,
  };
  const pulsaDenoms: Record<string, number[]> = {
    Telkomsel: [5000, 10000, 20000, 25000, 50000, 100000],
    Indosat: [5000, 10000, 20000, 25000, 50000, 100000],
    XL: [5000, 10000, 20000, 25000, 50000, 100000],
    Tri: [5000, 10000, 20000, 50000, 100000],
    Axis: [10000, 20000, 50000],
    Smartfren: [10000, 20000, 50000, 100000],
  };
  for (const op of OPERATORS) {
    for (const d of pulsaDenoms[op]) {
      add({
        sku: `PLS-${op.slice(0, 3).toUpperCase()}-${d / 1000}K`,
        name: `Pulsa ${op} ${d / 1000}rb`,
        category: "Pulsa",
        buyPrice: d,
        sellPrice: d + pulsaMarkup[d],
        stock: -1,
        minStock: 0,
        operator: op,
      });
    }
  }

  // Paket Data
  const paket: Array<[string, string, number, number]> = [
    ["Telkomsel 1GB 7 hari", "Telkomsel", 12000, 15000],
    ["Telkomsel 5GB 30 hari", "Telkomsel", 48000, 55000],
    ["Telkomsel 10GB 30 hari", "Telkomsel", 53000, 60000],
    ["Telkomsel 25GB 30 hari", "Telkomsel", 87000, 95000],
    ["Indosat Freedom 2GB 30 hari", "Indosat", 16000, 20000],
    ["Indosat Freedom 5GB 30 hari", "Indosat", 38000, 45000],
    ["Indosat Freedom 10GB 30 hari", "Indosat", 62000, 70000],
    ["XL Xtra Combo 5GB 30 hari", "XL", 43000, 50000],
    ["XL Xtra Combo 10GB 30 hari", "XL", 75000, 85000],
    ["Tri AlwaysOn 3GB 30 hari", "Tri", 24000, 30000],
    ["Tri AlwaysOn 8GB 30 hari", "Tri", 52000, 60000],
    ["Smartfren Unlimited 28 hari", "Smartfren", 62000, 70000],
  ];
  for (const [name, op, buy, sell] of paket) {
    add({
      sku: `PKT-${name.replace(/[^A-Za-z0-9]/g, "").slice(0, 10).toUpperCase()}`,
      name: `Paket ${name}`,
      category: "Paket Data",
      buyPrice: buy,
      sellPrice: sell,
      stock: -1,
      minStock: 0,
      operator: op,
    });
  }

  // Aksesoris
  const aksesoris: Array<[string, number, number, number]> = [
    ["Case HP Transparan Universal", 8000, 15000, 24],
    ["Case HP Motif Premium", 15000, 30000, 18],
    ["Tempered Glass Full Cover", 5000, 15000, 40],
    ["Tempered Glass Ceramic Matte", 8000, 20000, 25],
    ["Charger 2A Fast Charging", 25000, 45000, 15],
    ["Charger 25W Type-C Original", 45000, 75000, 10],
    ["Kabel Data Type-C 1m", 12000, 25000, 30],
    ["Kabel Data Micro USB 1m", 8000, 15000, 22],
    ["Kabel Data Lightning iPhone", 20000, 35000, 12],
    ["Earphone Wired 3.5mm", 15000, 30000, 20],
    ["Earphone Bluetooth TWS", 65000, 99000, 8],
    ["Headset Bluetooth", 55000, 89000, 6],
    ["Power Bank 10000mAh", 110000, 149000, 7],
    ["Power Bank 20000mAh", 150000, 199000, 5],
    ["Holder HP Meja / Motor", 12000, 25000, 14],
    ["Anti Gores Kamera HP", 5000, 10000, 30],
    ["Skin / Garskin HP", 10000, 20000, 16],
    ["Adaptor OTG Type-C", 10000, 20000, 10],
    ["Memory Card MicroSD 32GB", 45000, 65000, 9],
    ["Memory Card MicroSD 64GB", 70000, 95000, 6],
  ];
  for (const [name, buy, sell, stock] of aksesoris) {
    add({
      sku: `AKS-${name.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase()}`,
      name,
      category: "Aksesoris",
      buyPrice: buy,
      sellPrice: sell,
      stock,
      minStock: 5,
    });
  }

  // HP & Kartu
  const hp: Array<[string, number, number, number]> = [
    ["Kartu Perdana Telkomsel", 18000, 25000, 20],
    ["Kartu Perdana Indosat", 14000, 20000, 15],
    ["Kartu Perdana XL", 14000, 20000, 15],
    ["Kartu Perdana Tri", 10000, 15000, 18],
    ["Kartu Perdana Smartfren", 10000, 15000, 12],
    ["Samsung Galaxy A05 (4/64)", 1390000, 1499000, 3],
    ["Xiaomi Redmi 13C (4/128)", 1490000, 1599000, 2],
    ["Infinix Hot 40 (8/128)", 1690000, 1799000, 2],
    ["Realme C51 (4/64)", 1390000, 1499000, 2],
    ["Vivo Y03 (4/64)", 1190000, 1299000, 3],
    ["Oppo A18 (4/128)", 1490000, 1599000, 2],
  ];
  for (const [name, buy, sell, stock] of hp) {
    add({
      sku: `HP-${name.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase()}`,
      name,
      category: "HP & Kartu",
      buyPrice: buy,
      sellPrice: sell,
      stock,
      minStock: 2,
    });
  }

  // Jasa servis (sebagai produk agar bisa dijual langsung di kasir)
  const servis: Array<[string, number, number]> = [
    ["Ganti LCD HP (mulai dari)", 200000, 250000],
    ["Ganti Baterai HP", 120000, 150000],
    ["Ganti Port Charger / USB", 90000, 120000],
    ["Service Software / Flash HP", 35000, 50000],
    ["Ganti Speaker / Mic HP", 75000, 100000],
    ["Ganti Tombol Power / Volume", 50000, 75000],
  ];
  for (const [name, buy, sell] of servis) {
    add({
      sku: `SRV-${name.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase()}`,
      name,
      category: "Servis",
      buyPrice: buy,
      sellPrice: sell,
      stock: -1,
      minStock: 0,
    });
  }

  return list;
}

function seedTransactions(products: Product[]): Transaction[] {
  const now = new Date();
  const at = (daysAgo: number, hour: number, minute: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };
  const find = (name: string) =>
    products.find((p) => p.name === name) ?? products[0];
  const mk = (
    daysAgo: number,
    hour: number,
    minute: number,
    items: Array<[string, number]>,
    paymentMethod: PaymentMethod,
    type: Transaction["type"] = "penjualan",
    extra: Partial<Transaction> = {}
  ): Transaction => {
    const saleItems: SaleItem[] = items.map(([name, qty]) => {
      const p = find(name);
      return { productId: p.id, name: p.name, price: p.sellPrice, qty };
    });
    const subtotal = saleItems.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      id: uid(),
      code: "",
      date: at(daysAgo, hour, minute),
      items: saleItems,
      subtotal,
      discount: 0,
      total: subtotal,
      paymentMethod,
      type,
      ...extra,
    };
  };

  const txs: Transaction[] = [
    mk(0, 9, 12, [["Pulsa Telkomsel 10rb", 1], ["Tempered Glass Full Cover", 1]], "Tunai", "penjualan", { phoneNumber: "081234567890", operator: "Telkomsel" }),
    mk(0, 10, 5, [["Paket Telkomsel 5GB 30 hari", 1]], "QRIS", "pulsa", { phoneNumber: "085712345678", operator: "Telkomsel" }),
    mk(0, 11, 40, [["Case HP Motif Premium", 2], ["Kabel Data Type-C 1m", 1]], "Tunai", "penjualan"),
    mk(0, 13, 22, [["Pulsa Indosat 20rb", 1]], "Transfer", "pulsa", { phoneNumber: "081567890123", operator: "Indosat" }),
    mk(1, 10, 8, [["Charger 2A Fast Charging", 1], ["Earphone Wired 3.5mm", 1]], "Tunai", "penjualan"),
    mk(1, 15, 30, [["Pulsa Telkomsel 50rb", 1], ["Paket Tri AlwaysOn 3GB 30 hari", 1]], "QRIS", "penjualan", { phoneNumber: "081298765432", operator: "Telkomsel" }),
    mk(1, 17, 45, [["Ganti Baterai HP", 1]], "Tunai", "servis", { customerName: "Budi Santoso" }),
    mk(2, 9, 50, [["Kartu Perdana Telkomsel", 2], ["Tempered Glass Ceramic Matte", 1]], "Tunai", "penjualan"),
    mk(2, 12, 15, [["Pulsa XL 10rb", 2]], "QRIS", "pulsa", { phoneNumber: "087812345678", operator: "XL" }),
    mk(2, 16, 5, [["Power Bank 10000mAh", 1]], "Transfer", "penjualan"),
    mk(3, 11, 20, [["Samsung Galaxy A05 (4/64)", 1], ["Case HP Transparan Universal", 1]], "Transfer", "penjualan"),
    mk(3, 14, 35, [["Pulsa Smartfren 20rb", 1]], "Tunai", "pulsa", { phoneNumber: "088212345678", operator: "Smartfren" }),
  ];

  // Kode transaksi berurutan per hari
  const byDay = new Map<string, number>();
  for (const t of txs.sort((a, b) => a.date.localeCompare(b.date))) {
    const day = t.date.slice(0, 10).replace(/-/g, "");
    const n = (byDay.get(day) ?? 0) + 1;
    byDay.set(day, n);
    t.code = `TRX-${day}-${String(n).padStart(3, "0")}`;
  }
  return txs.sort((a, b) => b.date.localeCompare(a.date));
}

function seedServices(): ServiceTicket[] {
  const now = new Date();
  const at = (daysAgo: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const rows: Array<[string, string, string, string, number, ServiceStatus, number, boolean]> = [
    ["Andi Wijaya", "081234567890", "Samsung Galaxy A05", "LCD retak, layar tidak tampil", 350000, "Dikerjakan", 0, false],
    ["Siti Rahma", "085712345678", "Xiaomi Redmi 13C", "Baterai cepat habis / boros", 150000, "Diterima", 1, false],
    ["Budi Santoso", "081567890123", "Infinix Hot 40", "Port charger longgar, susah ngecas", 120000, "Selesai", 1, false],
    ["Dewi Lestari", "087812345678", "Vivo Y03", "HP mati total, tidak bisa nyala", 200000, "Diterima", 2, false],
    ["Rizky Pratama", "088212345678", "Oppo A18", "Speaker pecah / suara kecil", 100000, "Diambil", 3, true],
  ];
  return rows.map(([customerName, phone, device, problem, price, status, daysAgo, paid], i) => ({
    id: uid(),
    code: `SRV-${String(i + 1).padStart(3, "0")}`,
    customerName,
    phone,
    device,
    problem,
    price,
    status,
    createdAt: at(daysAgo, 10),
    updatedAt: at(daysAgo, 10),
    paid,
  }));
}

export function seedData(): StoreData {
  const products = seedProducts();
  return {
    products,
    services: seedServices(),
    transactions: seedTransactions(products),
    settings: {
      shopName: "Yusup Cell",
      address: "Jl. Raya No. 12, Indonesia",
      receiptFooter: "Terima kasih sudah berbelanja di Yusup Cell.\nBarang yang sudah dibeli tidak dapat ditukar/dikembalikan.",
      lowStockDefault: 5,
    },
  };
}

// ---------- Store context ----------

// Status sinkronisasi ke cloud (Vercel KV):
// "cloud" = tersimpan di cloud, "local" = KV belum dikonfigurasi (hanya localStorage),
// "saving" = sedang menyimpan ke cloud, "error" = gagal sinkron (data tetap aman di localStorage).
export type SyncStatus = "cloud" | "local" | "saving" | "error";

interface StoreContextValue extends StoreData {
  loaded: boolean;
  syncStatus: SyncStatus;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  completeSale: (sale: {
    items: SaleItem[];
    discount: number;
    paymentMethod: PaymentMethod;
    cashPaid?: number;
    type: Transaction["type"];
    phoneNumber?: string;
    operator?: string;
    serviceId?: string;
    customerName?: string;
  }) => Transaction;
  addService: (s: Omit<ServiceTicket, "id" | "code" | "createdAt" | "updatedAt" | "paid">) => void;
  updateService: (id: string, s: Partial<ServiceTicket>) => void;
  deleteService: (id: string) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (s: Partial<Settings>) => void;
  importData: (data: StoreData) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<StoreData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const cloudModeRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Muat data: utamakan Vercel KV (cloud); kalau KV kosong / belum
  // dikonfigurasi / tidak bisa dijangkau, pakai localStorage, terakhir data contoh.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/data");
        if (res.ok) {
          const json = await res.json();
          cloudModeRef.current = true;
          if (json?.ok && json.data && Array.isArray(json.data.products)) {
            if (cancelled) return;
            // Data sudah dari cloud — tidak perlu disimpan balik.
            skipNextSaveRef.current = true;
            setData(json.data as StoreData);
            setSyncStatus("cloud");
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
            } catch {
              // abaikan
            }
            return;
          }
          // KV masih kosong: lanjut ke localStorage di bawah; save effect
          // akan mengunggah data lokal ke cloud.
        }
      } catch {
        // API tidak bisa dijangkau (mis. KV belum dikonfigurasi) — lanjut ke lokal
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoreData;
          if (parsed && Array.isArray(parsed.products)) {
            if (!cancelled) setData(parsed);
            return;
          }
        }
      } catch {
        // abaikan, pakai seed
      }
      if (!cancelled) setData(seedData());
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Simpan data: selalu ke localStorage, lalu (kalau KV aktif) ke cloud
  // dengan debounce supaya tidak setiap perubahan memanggil API.
  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // penyimpanan penuh / tidak tersedia
    }
    if (!cloudModeRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus("saving");
    saveTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setSyncStatus(res.ok ? "cloud" : "error");
      } catch {
        setSyncStatus("error");
      }
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data]);

  const value = useMemo<StoreContextValue | null>(() => {
    if (!data) return null;
    const nextCode = () => {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const count = data.transactions.filter((t) =>
        t.code.startsWith(`TRX-${today}`)
      ).length;
      return `TRX-${today}-${String(count + 1).padStart(3, "0")}`;
    };
    return {
      ...data,
      loaded: true,
      syncStatus,
      addProduct: (p) =>
        setData((d) => (d ? { ...d, products: [...d.products, { ...p, id: uid() }] } : d)),
      updateProduct: (id, p) =>
        setData((d) =>
          d
            ? { ...d, products: d.products.map((x) => (x.id === id ? { ...x, ...p } : x)) }
            : d
        ),
      deleteProduct: (id) =>
        setData((d) =>
          d ? { ...d, products: d.products.filter((x) => x.id !== id) } : d
        ),
      completeSale: (sale) => {
        const subtotal = sale.items.reduce((s, i) => s + i.price * i.qty, 0);
        const total = Math.max(0, subtotal - sale.discount);
        const tx: Transaction = {
          id: uid(),
          code: nextCode(),
          date: new Date().toISOString(),
          items: sale.items,
          subtotal,
          discount: sale.discount,
          total,
          paymentMethod: sale.paymentMethod,
          cashPaid: sale.cashPaid,
          change:
            sale.paymentMethod === "Tunai" && sale.cashPaid != null
              ? sale.cashPaid - total
              : undefined,
          type: sale.type,
          phoneNumber: sale.phoneNumber,
          operator: sale.operator,
          serviceId: sale.serviceId,
          customerName: sale.customerName,
        };
        setData((d) => {
          if (!d) return d;
          const products = d.products.map((p) => {
            const item = sale.items.find((i) => i.productId === p.id);
            if (item && p.stock >= 0) {
              return { ...p, stock: Math.max(0, p.stock - item.qty) };
            }
            return p;
          });
          const services = sale.serviceId
            ? d.services.map((s) =>
                s.id === sale.serviceId
                  ? { ...s, status: "Diambil" as ServiceStatus, paid: true, updatedAt: new Date().toISOString() }
                  : s
              )
            : d.services;
          return {
            ...d,
            products,
            services,
            transactions: [tx, ...d.transactions],
          };
        });
        return tx;
      },
      addService: (s) =>
        setData((d) => {
          if (!d) return d;
          const code = `SRV-${String(d.services.length + 1).padStart(3, "0")}`;
          const now = new Date().toISOString();
          return {
            ...d,
            services: [
              { ...s, id: uid(), code, createdAt: now, updatedAt: now, paid: false },
              ...d.services,
            ],
          };
        }),
      updateService: (id, s) =>
        setData((d) =>
          d
            ? {
                ...d,
                services: d.services.map((x) =>
                  x.id === id
                    ? { ...x, ...s, updatedAt: new Date().toISOString() }
                    : x
                ),
              }
            : d
        ),
      deleteService: (id) =>
        setData((d) =>
          d ? { ...d, services: d.services.filter((x) => x.id !== id) } : d
        ),
      deleteTransaction: (id) =>
        setData((d) =>
          d
            ? { ...d, transactions: d.transactions.filter((x) => x.id !== id) }
            : d
        ),
      updateSettings: (s) =>
        setData((d) => (d ? { ...d, settings: { ...d.settings, ...s } } : d)),
      importData: (imported) => setData(imported),
      resetData: () => setData(seedData()),
    };
  }, [data, syncStatus]);

  if (!value) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">
        Memuat Yusup Cell…
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore harus dipakai di dalam StoreProvider");
  return ctx;
}
