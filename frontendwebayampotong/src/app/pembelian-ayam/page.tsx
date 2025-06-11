"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PembelianAyamPage() {
  // Proteksi halaman: redirect ke login jika tidak ada token
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  const [hargaAyam, setHargaAyam] = useState("");
  const [totalAyam, setTotalAyam] = useState("");
  const [tanggalMasuk, setTanggalMasuk] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({ open: false, success: true, message: "" });

  const showModal = (success: boolean, message: string) => {
    setModal({ open: true, success, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem("token") || "";
    const transaction_id = `TRX-${Date.now()}-${Math.floor(
      Math.random() * 100000
    )}`;
    let user_id = "";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user_id = user.username || user.id || ""; // gunakan username (string) untuk user_id
      }
    } catch {}
    try {
      // 1. Kirim ke transaksi (hanya expense, tidak income)
      const trxRes = await fetch("http://localhost:3000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transaction_id,
          date: tanggalMasuk,
          type: "Expense",
          amount:
            Number(hargaAyam.replace(/[^0-9.]/g, "")) *
            Number(totalAyam.replace(/[^0-9.]/g, "")), // pastikan hanya angka
          description: "Pembelian Stok Ayam",
          user_id,
          account_id: 1,
          category: "Pembelian Stok",
        }),
      });
      if (!trxRes.ok) {
        const err = await trxRes.text();
        throw new Error("Gagal simpan ke transaksi: " + err);
      }

      // Tambahkan ke tabel expense jika perlu
      await fetch("http://localhost:3000/expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transaction_id,
          date: tanggalMasuk,
          amount:
            Number(hargaAyam.replace(/[^0-9.]/g, "")) *
            Number(totalAyam.replace(/[^0-9.]/g, "")), // pastikan hanya angka
          description: "Pembelian Stok Ayam",
          user_id,
          category: "Pembelian Stok",
        }),
      });

      // 2. Kirim ke stok
      const stokRes = await fetch("http://localhost:3000/livestock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "Ayam",
          quantity: Number(totalAyam),
          entry_date: tanggalMasuk,
        }),
      });
      if (!stokRes.ok) {
        const err = await stokRes.text();
        throw new Error("Gagal simpan ke stok: " + err);
      }

      showModal(true, "Data berhasil disimpan ke transaksi & stok!");
      setHargaAyam("");
      setTotalAyam("");
      setTanggalMasuk("");
    } catch (err: any) {
      showModal(false, err?.message || "Gagal menyimpan data!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        padding: 32,
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      {/* Modal Notifikasi */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.18)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              boxShadow: "0 8px 32px #0003",
              padding: "36px 32px 28px 32px",
              minWidth: 320,
              maxWidth: "90vw",
              textAlign: "center",
              animation: "popIn 0.2s",
              border: modal.success ? "2px solid #22c55e" : "2px solid #ef4444",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              {modal.success ? (
                <CheckCircle2
                  size={64}
                  color="#22c55e"
                  style={{ margin: "0 auto" }}
                />
              ) : (
                <XCircle
                  size={64}
                  color="#ef4444"
                  style={{ margin: "0 auto" }}
                />
              )}
            </div>
            <div
              style={{
                fontWeight: 800,
                fontSize: 22,
                color: modal.success ? "#22c55e" : "#ef4444",
                marginBottom: 8,
                letterSpacing: 1,
              }}
            >
              {modal.success ? "BERHASIL" : "GAGAL"}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#222",
                marginBottom: 24,
                whiteSpace: "pre-line",
              }}
            >
              {modal.message}
            </div>
            <button
              onClick={() => setModal((m) => ({ ...m, open: false }))}
              style={{
                background: modal.success ? "#22c55e" : "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 32px",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 2px 8px #0001",
                transition: "background 0.15s",
              }}
              autoFocus
            >
              Oke
            </button>
          </div>
          <style>
            {`
              @keyframes popIn {
                0% { transform: scale(0.85); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}
          </style>
        </div>
      )}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#111",
            margin: 0,
          }}
        >
          Pembelian Stok
        </h1>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px #0002",
          padding: 32,
          width: "100%",
          maxWidth: 700,
          margin: "0 auto",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              background: "#7F8CAA",
              color: "#fff",
              borderRadius: 8,
              padding: "2px 12px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            Masukkan Data
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "center",
          }}
        >
          {/* Tanggal Masuk */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 500 }}>Tanggal Masuk</label>
            <div style={{ position: "relative" }}>
              <input
                type="date"
                value={tanggalMasuk}
                onChange={(e) => setTanggalMasuk(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "8px 8px 8px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              />
            </div>
          </div>
          {/* Kosongkan kolom kanan untuk grid */}
          <div />
          {/* Harga per Ekor */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 500 }}>Harga (per ekor)</label>
            <input
              type="number"
              value={hargaAyam}
              onChange={(e) => setHargaAyam(e.target.value)}
              required
              min={0}
              placeholder="Masukkan harga per ekor"
              style={{
                width: "100%",
                padding: "8px 8px 8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            />
          </div>
          {/* Jumlah Ayam Dibeli */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 500 }}>Jumlah Ayam Dibeli</label>
            <input
              type="number"
              value={totalAyam}
              onChange={(e) => setTotalAyam(e.target.value)}
              required
              min={1}
              placeholder="Masukkan jumlah ayam"
              style={{
                width: "100%",
                padding: "8px 8px 8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            />
          </div>
          {/* Divider */}
          <div
            style={{
              gridColumn: "1/3",
              borderBottom: "1px solid #e5e7eb",
              margin: "16px 0",
            }}
          />
          {/* Total */}
          <div
            style={{
              gridColumn: "1/3",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <label style={{ fontWeight: 500 }}>Total</label>
            <input
              type="text"
              value={
                hargaAyam && totalAyam
                  ? (
                      Number(hargaAyam.replace(/[^0-9.]/g, "")) *
                      Number(totalAyam.replace(/[^0-9.]/g, ""))
                    ).toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    })
                  : "Rp 0"
              }
              readOnly
              style={{
                width: "100%",
                padding: "8px 8px 8px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#f3f4f6",
                fontWeight: 600,
                color: "#2563eb",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              gridColumn: "1/3",
              marginTop: 16,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 0",
              fontWeight: 600,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>
    </div>
  );
}
