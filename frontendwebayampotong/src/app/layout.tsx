// src/app/layout.tsx

import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ayam Potong Eva",
  description: "Halaman login sederhana menggunakan Next.js dan Tailwind",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout hanya render global style dan children
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ background: "#f3f4f6", minHeight: "100vh" }}
      >
        {children}
      </body>
    </html>
  );
}
