import type { Metadata } from "next";
import "./globals.css";
import Shell from "../components/Shell";
import { StoreProvider } from "../lib/store";

export const metadata: Metadata = {
  title: "Yusup Cell — Kasir",
  description: "Aplikasi kasir konter HP: pulsa, paket data, aksesoris, HP & kartu, dan jasa servis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-100 text-slate-800 antialiased">
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
