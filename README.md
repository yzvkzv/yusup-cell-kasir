# Yusup Cell — Aplikasi Kasir

Aplikasi kasir (POS) untuk konter HP **Yusup Cell**: penjualan pulsa, paket data,
aksesoris, HP & kartu perdana, serta jasa servis HP.

## Fitur

- **Dashboard** — omzet hari ini, jumlah transaksi, item terjual, peringatan stok
  menipis, dan servis yang menunggu diambil.
- **Kasir** — grid produk dengan pencarian & filter kategori, keranjang belanja,
  diskon, pembayaran Tunai / QRIS / Transfer, hitung kembalian, dan struk yang
  bisa dicetak.
- **Pulsa & Data** — pilih operator (Telkomsel, Indosat, XL, Tri, Axis,
  Smartfren), pilih nominal/paket, isi nomor HP tujuan, langsung jual.
- **Produk** — tambah, ubah, dan hapus produk (nama, kategori, harga beli,
  harga jual, stok, batas stok menipis, SKU).
- **Servis** — tiket perbaikan dengan alur status Diterima → Dikerjakan →
  Selesai → Diambil, plus pembayaran servis langsung di kasir.
- **Transaksi** — riwayat dengan filter tanggal & jenis, lihat detail, cetak
  ulang struk.
- **Laporan** — omzet harian / 7 hari / 30 hari, produk terlaris, penjualan
  per kategori, per metode bayar, dan omzet per hari.
- **Pengaturan** — nama toko, alamat & teks kaki struk, batas stok menipis,
  ekspor/impor data sebagai backup JSON.

## Data contoh

Aplikasi sudah dilengkapi data contoh yang realistis (pulsa per operator,
paket data, aksesoris, HP, kartu perdana, dan jasa servis) sehingga bisa
langsung dipakai. Data tersimpan di `localStorage` browser perangkat kasir —
tidak perlu database dan bisa dipakai offline.

> Catatan: karena data tersimpan di browser satu perangkat, perangkat lain
> tidak akan melihat data yang sama. Untuk sinkronisasi antar perangkat,
> nantinya bisa ditambahkan database (misalnya Supabase / Firebase).

## Penyimpanan cloud — Vercel KV

Aplikasi ini bisa menyimpan datanya di **Vercel KV** supaya semua perangkat
kasir melihat data yang sama (produk, stok, transaksi, servis, pengaturan).
Tanpa KV, aplikasi tetap jalan memakai `localStorage` di satu perangkat
(mode lokal — lihat status sinkron di bawah sidebar).

Cara mengaktifkan:

1. Di dashboard Vercel, buka project ini → **Storage** → **Create Database**
   → pilih **KV** → buat store (misalnya `yusup-cell-kv`).
2. Hubungkan store ke project ini — Vercel otomatis mengisi environment
   variables `KV_REST_API_URL` dan `KV_REST_API_TOKEN`.
3. **Redeploy** project supaya environment variables terbaca.
4. Buka aplikasi: status di bawah sidebar akan berubah menjadi
   "● Data tersinkron ke cloud (Vercel KV)".

Cara kerja: saat aplikasi dibuka, data dimuat dari KV dulu; kalau KV masih
kosong, data lokal (localStorage) yang dipakai dan otomatis diunggah ke KV.
Setiap perubahan (transaksi, produk, servis, pengaturan) tersimpan dulu di
localStorage, lalu dikirim ke KV beberapa saat kemudian. Kalau KV belum
dikonfigurasi atau sedang tidak bisa dijangkau, aplikasi tetap jalan normal
dalam mode lokal dan tidak ada data yang hilang.

Untuk menjalankan KV di lokal, salin `.env.example` menjadi `.env.local`
dan isi kedua variabel di atas dengan nilai dari dashboard Vercel.

## Menjalankan di lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Build produksi

```bash
npm run build
npm start
```

## Deploy ke Vercel

Hubungkan repository ini ke Vercel (Import Project), framework terdeteksi
otomatis sebagai Next.js. Setiap push ke branch utama akan ter-deploy
otomatis.
