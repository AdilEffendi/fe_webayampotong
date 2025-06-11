"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Box, TrendingDown, TrendingUp, Users } from "lucide-react";
import { getTotalIncome } from "@/services/income";
import { getTotalExpense } from "@/services/expense";
import { getTotalBalance, getBalanceSummary } from "@/services/balance";
import { useRef } from "react";
import axios from "axios";
import { useEffect as useEffectChart, useRef as useRefChart } from "react";
// import { getTotalStock } from "@/services/stock";

// fungsi fetch stok ayam
async function getTotalStock(token: string): Promise<number> {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL + "/livestock"
      : "http://localhost:3000/livestock";
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data)
        ? data.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export default function DashboardPage() {
  // --- Proteksi halaman: redirect ke login jika tidak ada token ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  // --- Deteksi admin dari localStorage ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [totalUser, setTotalUser] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setIsAdmin(user.role === "admin");
        } catch {}
      }
    }
  }, []);

  // --- Ambil total user jika admin ---
  useEffect(() => {
    if (isAdmin) {
      const token = localStorage.getItem("token") || "";
      axios
        .get("http://localhost:3000/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) =>
          setTotalUser(Array.isArray(res.data) ? res.data.length : 0)
        )
        .catch(() => setTotalUser(0));
    }
  }, [isAdmin]);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [activeCustomer, setActiveCustomer] = useState(0);
  const [totalStock, setTotalStock] = useState(0);

  // State untuk harga ayam hari ini
  const [hargaAyam, setHargaAyam] = useState(""); // Jangan ambil dari localStorage di sini
  const [hargaAyamInput, setHargaAyamInput] = useState("");

  // State untuk data prediksi 2025
  const [data2025, setData2025] = useState<
    { minggu: string; prediksi_keuntungan: number; hari_raya: number }[]
  >([]);
  const chartRef = useRef<HTMLCanvasElement>(null);

  // State untuk bar yang dipilih
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // State untuk jam dan tanggal digital
  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // State filter
  const [filterMode, setFilterMode] = useState<"day" | "week" | "month">(
    "week"
  );
  const [filterDate, setFilterDate] = useState("2025-03-10");

  // State summary
  const [summary, setSummary] = useState<{
    total_income: number;
    total_expense: number;
    balance: number;
    start?: string;
    end?: string;
  } | null>(null);

  // Fetch data saat pertama kali dan saat filter berubah
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const income = await getTotalIncome(token);
        setTotalIncome(income);
        const expense = await getTotalExpense(token);
        setTotalExpense(expense);
        const balance = await getTotalBalance(token);
        setTotalBalance(balance);
        // const customer = await getActiveCustomerCount(token);
        // setActiveCustomer(customer);
        const stock = await getTotalStock(token);
        setTotalStock(stock);
      } catch (err) {
        setTotalIncome(0);
        setTotalExpense(0);
        setTotalBalance(0);
        setActiveCustomer(0);
        setTotalStock(0);
      }
    };
    fetchData();
  }, []);

  // Sync harga ayam dari localStorage saat mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem("hargaAyamHariIni");
      if (val) {
        setHargaAyam(val);
        setHargaAyamInput(formatRupiah(val));
      }
    }
  }, []);

  // Fetch summary saat filter berubah
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const data = await getBalanceSummary(token, filterMode, filterDate);
        setSummary(data);
      } catch {
        setSummary(null);
      }
    };
    fetchSummary();
  }, [filterMode, filterDate]);

  // Format angka ke rupiah dengan titik
  function formatRupiah(val: string) {
    return val.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Handler simpan harga ayam
  const handleHargaAyamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const angka = hargaAyamInput.replace(/[^0-9]/g, "");
    setHargaAyam(angka);
    localStorage.setItem("hargaAyamHariIni", angka);
    setHargaAyamInput(formatRupiah(angka));
    alert("Harga ayam hari ini berhasil disimpan!");
  };

  // Fetch data prediksi 2025 dari backend Flask (endpoint baru)
  useEffect(() => {
    fetch("http://localhost:5000/prediksi2025")
      .then((res) => res.json())
      .then((data) => {
        setData2025(data);
      })
      .catch(() => setData2025([]));
  }, []);

  // Render Chart.js diagram batang setelah data2025 didapat
  useEffect(() => {
    if (!chartRef.current || data2025.length === 0) return;
    import("chart.js/auto").then((Chart) => {
      if (chartRef.current) {
        if ((chartRef.current as any)._chartInstance) {
          (chartRef.current as any)._chartInstance.destroy();
        }
        const ctx = chartRef.current.getContext("2d");
        if (!ctx) return;
        const minggu = data2025.map((d) => d.minggu);
        const keuntungan = data2025.map((d) => d.prediksi_keuntungan);
        const hariRaya = data2025.map((d) => d.hari_raya);
        const colors = hariRaya.map((hr, idx) =>
          selectedBar === idx ? "#2563eb" : hr === 1 ? "#f59e42" : "#22c55e"
        );
        const chartInstance = new Chart.default(ctx, {
          type: "bar",
          data: {
            labels: minggu,
            datasets: [
              {
                label: "Prediksi Keuntungan",
                data: keuntungan,
                backgroundColor: colors,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (context: any) =>
                    "Rp " + Number(context.parsed.y).toLocaleString("id-ID"),
                },
              },
              title: {
                display: true,
                text: "Prediksi Keuntungan Mingguan Tahun 2025",
                font: { size: 16 },
              },
            },
            scales: {
              x: {
                title: { display: true, text: "Minggu ke-" },
                ticks: { autoSkip: true, maxTicksLimit: 12 },
              },
              y: {
                title: { display: true, text: "Keuntungan (Rp)" },
                beginAtZero: true,
                ticks: {
                  callback: (value: any) =>
                    "Rp " + Number(value).toLocaleString("id-ID"),
                },
              },
            },
            onClick: (evt: any, elements: any) => {
              if (elements && elements.length > 0) {
                const idx = elements[0].index;
                setSelectedBar(idx);
              }
            },
          },
        });
        (chartRef.current as any)._chartInstance = chartInstance;
      }
    });
  }, [data2025, selectedBar]);

  // Hitung minggu keberapa hari ini (asumsi minggu ke-1 = 1 Januari)
  function getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    // Awal tahun (minggu ke-1)
    const start = new Date(year, 0, 1);
    // Hitung selisih hari
    const diffDays = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Minggu keberapa (mulai dari 1)
    return Math.floor(diffDays / 7) + 1;
  }
  const mingguSekarang = getCurrentWeek();

  // Format tanggal Indonesia
  function formatTanggal(date: Date) {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  // Format jam digital
  function formatJam(date: Date) {
    return date.toLocaleTimeString("id-ID", { hour12: false }).padStart(8, "0");
  }
  const totalIncomeDisplay = summary ? summary.total_income : totalIncome;
  const totalExpenseDisplay = summary ? summary.total_expense : totalExpense;
  const totalBalanceDisplay = summary ? summary.balance : totalBalance;

  // Data untuk grafik ringkasan keuangan sesuai filter
  let chartLabels: string[] = [];
  let pemasukanData: number[] = [];
  let pengeluaranData: number[] = [];

  if (filterMode === "month") {
    // Bulanan: 12 bulan
    chartLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const bulanSekarang = now.getMonth();
    pemasukanData = Array(12)
      .fill(0)
      .map((v, i) => (i === bulanSekarang ? totalIncomeDisplay : 0));
    pengeluaranData = Array(12)
      .fill(0)
      .map((v, i) => (i === bulanSekarang ? totalExpenseDisplay : 0));
  } else if (filterMode === "week") {
    // Mingguan: 1-5 minggu dalam bulan yang dipilih
    const date = new Date(filterDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    // Hitung jumlah minggu dalam bulan
    const weeks: string[] = [];
    let week = 1;
    let d = new Date(year, month, 1);
    while (d.getMonth() === month) {
      weeks.push(`Minggu ${week}`);
      d.setDate(d.getDate() + 7);
      week++;
    }
    chartLabels = weeks;
    // Data: hanya minggu terpilih yang diisi, lain 0
    const weekNow = Math.ceil(
      (date.getDate() + (new Date(year, month, 1).getDay() || 7) - 1) / 7
    );
    pemasukanData = Array(weeks.length)
      .fill(0)
      .map((v, i) => (i === weekNow - 1 ? totalIncomeDisplay : 0));
    pengeluaranData = Array(weeks.length)
      .fill(0)
      .map((v, i) => (i === weekNow - 1 ? totalExpenseDisplay : 0));
  } else {
    // Harian: 1 bulan, 28-31 hari
    const date = new Date(filterDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    chartLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    // Data: hanya hari terpilih yang diisi, lain 0
    const dayNow = date.getDate();
    pemasukanData = Array(daysInMonth)
      .fill(0)
      .map((v, i) => (i === dayNow - 1 ? totalIncomeDisplay : 0));
    pengeluaranData = Array(daysInMonth)
      .fill(0)
      .map((v, i) => (i === dayNow - 1 ? totalExpenseDisplay : 0));
  }

  // Grafik Ringkasan Keuangan
  const chartRingkasanRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!chartRingkasanRef.current) return;
    import("chart.js/auto").then((Chart) => {
      if (chartRingkasanRef.current) {
        if ((chartRingkasanRef.current as any)._chartInstance) {
          (chartRingkasanRef.current as any)._chartInstance.destroy();
        }
        const ctx = chartRingkasanRef.current.getContext("2d");
        if (!ctx) return;
        const chartInstance = new Chart.default(ctx, {
          type: "line",
          data: {
            labels: chartLabels,
            datasets: [
              {
                label: "Pemasukan",
                data: pemasukanData,
                borderColor: "#22c55e",
                backgroundColor: "rgba(34,197,94,0.1)",
                tension: 0.3,
                pointRadius: 3,
                fill: true,
              },
              {
                label: "Pengeluaran",
                data: pengeluaranData,
                borderColor: "#ef4444",
                backgroundColor: "rgba(239,68,68,0.08)",
                tension: 0.3,
                pointRadius: 3,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { display: true, position: "top" },
              tooltip: {
                callbacks: {
                  label: (context: any) =>
                    context.dataset.label +
                    ": Rp " +
                    Number(context.parsed.y).toLocaleString("id-ID"),
                },
              },
              title: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (value: any) =>
                    "Rp " + Number(value).toLocaleString("id-ID"),
                },
              },
            },
          },
        });
        (chartRingkasanRef.current as any)._chartInstance = chartInstance;
      }
    });
  }, [filterMode, filterDate, totalIncomeDisplay, totalExpenseDisplay]);

  // Hitung total bulan berjalan (dari summary card)
  const totalPemasukanBulanIni = totalIncome;
  const totalPengeluaranBulanIni = totalExpense;
  const saldoBulanIni = totalBalance;

  if (isAdmin) {
    // --- Dashboard khusus admin: hanya summary card user aktif ---
    return (
      <div style={{ flex: 1, padding: 32, background: "#f9fafb" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
            Dashboard Admin
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: 16,
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Selamat datang, admin. Berikut total user aktif pada sistem.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <SummaryCard
            title="Total User Aktif"
            value={totalUser.toLocaleString("id-ID")}
            icon={<Users size={28} color="#2563eb" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        padding: 32,
        background: "#f9fafb",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
            wordBreak: "break-word",
          }}
        >
          Selamat Datang di Halaman Utama
        </h1>
        <p
          style={{
            color: "#6b7280",
            fontSize: 16,
            marginTop: 8,
            marginBottom: 0,
            wordBreak: "break-word",
          }}
        >
          Aplikasi pencatatan keuangan & prediksi keuntungan untuk peternakan
          ayam. Kelola pemasukan, pengeluaran, pelanggan, dan prediksi.
        </p>
      </div>

      {/* Digital Clock & Date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        {mounted && (
          <>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "#2563eb",
                letterSpacing: 0.5,
                wordBreak: "break-word",
              }}
            >
              {formatTanggal(now)}
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 28,
                fontWeight: 700,
                color: "#111827",
                background: "#e0e7ff",
                borderRadius: 8,
                padding: "4px 18px",
                boxShadow: "0 1px 4px #0001",
                letterSpacing: 2,
                minWidth: 120,
                textAlign: "center",
              }}
            >
              {formatJam(now)}
            </div>
          </>
        )}
      </div>

      {/* Info minggu keberapa hari ini */}
      <div
        style={{
          width: "100%",
          margin: "0 auto 18px auto",
          background: "#e0e7ff",
          borderRadius: 10,
          padding: "12px 18px",
          fontWeight: 600,
          color: "#3730a3",
          fontSize: 16,
          textAlign: "center",
          letterSpacing: 0.2,
        }}
      >
        Hari ini masuk{" "}
        <span style={{ color: "#2563eb" }}>minggu ke-{mingguSekarang}</span>{" "}
        tahun {new Date().getFullYear()}
      </div>

      {/* Form Harga Ayam Hari Ini */}
      <div
        style={{
          margin: "0 auto 32px auto",
          maxWidth: 600,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 8px #0001",
          padding: 24,
          border: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <form
          onSubmit={handleHargaAyamSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            width: "100%",
            alignItems: "flex-start",
          }}
        >
          <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>
            Harga Ayam Hari Ini
          </label>
          <div
            style={{
              display: "flex",
              width: "100%",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 120 }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#888",
                  fontWeight: 600,
                  fontSize: 15,
                  zIndex: 2,
                  pointerEvents: "none",
                }}
              >
                Rp.
              </span>
              <input
                type="text"
                value={hargaAyamInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setHargaAyamInput(formatRupiah(val));
                }}
                placeholder="cth: 65.000"
                style={{
                  width: "100%",
                  padding: "8px 8px 8px 38px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  fontSize: 15,
                  minWidth: 0,
                }}
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 18px",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Simpan
            </button>
          </div>
        </form>
        {hargaAyam && (
          <div
            style={{
              marginTop: 12,
              color: "#2563eb",
              fontWeight: 500,
              fontSize: 15,
              width: "100%",
              textAlign: "left",
              maxWidth: "100%",
              wordBreak: "break-word",
            }}
          >
            Harga ayam saat ini adalah:{" "}
            <span style={{ fontWeight: 700 }}>
              Rp {formatRupiah(hargaAyam)}
            </span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div
        className="summary-cards-row"
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        <SummaryCard
          title="Total Pemasukan"
          value={`Rp ${totalIncomeDisplay.toLocaleString("id-ID")}`}
          icon={<TrendingUp size={28} color="#22c55e" />}
          onClick={() => {
            window.location.href = "http://localhost:3001/transaksi/pemasukan";
          }}
        />
        <SummaryCard
          title="Total Pengeluaran"
          value={`- Rp ${totalExpenseDisplay.toLocaleString("id-ID")}`}
          icon={<TrendingDown size={24} color="#ef4444" />}
          onClick={() => {
            window.location.href =
              "http://localhost:3001/transaksi/pengeluaran";
          }}
        />
        <SummaryCard
          title="Keuntungan Bersih"
          value={`Rp ${totalBalanceDisplay.toLocaleString("id-ID")}`}
          icon={<BarChart3 size={28} color="#6366f1" />}
        />
        <SummaryCard
          title="Stok Tersedia"
          value={totalStock.toLocaleString("id-ID")}
          icon={<Box size={28} color="#f59e42" />}
          onClick={() => {
            window.location.href = "http://localhost:3001/stok";
          }}
        />
      </div>

      {/* Ringkasan Keuangan */}
      <div style={{ width: "100%" }}>
        <section
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 8px #0001",
            padding: 24,
            minHeight: 220,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 18 }}>
            Ringkasan Keuangan Bulanan
          </h2>
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              marginBottom: 18,
              flexWrap: "wrap",
            }}
          >
            <label style={{ fontWeight: 600 }}>Tampilkan:</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as any)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                fontSize: 15,
              }}
            >
              <option value="day">Per Hari</option>
              <option value="week">Per Minggu</option>
              <option value="month">Per Bulan</option>
            </select>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                fontSize: 15,
              }}
            />
            {summary && (
              <span style={{ color: "#6b7280", fontSize: 14 }}>
                {filterMode === "day"
                  ? `Tanggal: ${new Date(summary.start!).toLocaleDateString(
                      "id-ID"
                    )}`
                  : filterMode === "week"
                  ? `Minggu: ${new Date(summary.start!).toLocaleDateString(
                      "id-ID"
                    )} - ${new Date(summary.end!).toLocaleDateString("id-ID")}`
                  : `Bulan: ${new Date(summary.start!).toLocaleDateString(
                      "id-ID",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}`}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            {/* Grafik */}
            <div style={{ flex: 2, minWidth: 180, maxWidth: 500 }}>
              <canvas ref={chartRingkasanRef} height={120} />
            </div>
            {/* Info Ringkasan */}
            <div
              style={{
                flex: 1,
                minWidth: 180,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 12,
              }}
            >
              <div
                style={{
                  background: "#f0fdf4",
                  borderRadius: 10,
                  padding: "14px 18px",
                  color: "#15803d",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #0001",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TrendingUp size={20} color="#22c55e" />
                Pemasukan{" "}
                {filterMode === "month"
                  ? "bulan"
                  : filterMode === "week"
                  ? "minggu"
                  : "hari"}{" "}
                ini:
                <span style={{ fontWeight: 700, color: "#166534" }}>
                  Rp {totalIncomeDisplay.toLocaleString("id-ID")}
                </span>
              </div>
              <div
                style={{
                  background: "#fef2f2",
                  borderRadius: 10,
                  padding: "14px 18px",
                  color: "#b91c1c",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #0001",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TrendingDown size={20} color="#ef4444" />
                Pengeluaran{" "}
                {filterMode === "month"
                  ? "bulan"
                  : filterMode === "week"
                  ? "minggu"
                  : "hari"}{" "}
                ini:
                <span style={{ fontWeight: 700, color: "#991b1b" }}>
                  Rp {totalExpenseDisplay.toLocaleString("id-ID")}
                </span>
              </div>
              <div
                style={{
                  background: "#eef2ff",
                  borderRadius: 10,
                  padding: "14px 18px",
                  color: "#3730a3",
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: "0 1px 4px #0001",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <BarChart3 size={20} color="#6366f1" />
                Saldo{" "}
                {filterMode === "month"
                  ? "bulan"
                  : filterMode === "week"
                  ? "minggu"
                  : "hari"}{" "}
                ini:
                <span style={{ fontWeight: 700, color: "#3730a3" }}>
                  Rp {totalBalanceDisplay.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main Sections */}
      <div style={{ width: "100%", marginBottom: 24 }}>
        {/* Prediksi Keuntungan 2025 Full Width */}
        <section
          style={{
            width: "100%",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 8px #0001",
            padding: 24,
            minHeight: 80,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
            Prediksi Keuntungan 2025
          </h2>
          {data2025.length === 0 ? (
            <div
              style={{
                color: "#9ca3af",
                fontSize: 15,
                textAlign: "center",
                marginTop: 40,
              }}
            >
              Memuat data prediksi...
            </div>
          ) : (
            <>
              <canvas ref={chartRef} height={80} />
              {selectedBar !== null && data2025[selectedBar] && (
                <div
                  style={{
                    marginTop: 16,
                    background: "#f3f4f6",
                    borderRadius: 8,
                    padding: 16,
                    fontSize: 15,
                    color: "#222",
                  }}
                >
                  <b>Detail Minggu {data2025[selectedBar].minggu}</b>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>
                      Prediksi Keuntungan:{" "}
                      <b>
                        Rp{" "}
                        {Number(
                          data2025[selectedBar].prediksi_keuntungan
                        ).toLocaleString("id-ID")}
                      </b>
                    </li>
                    <li>
                      Hari Raya:{" "}
                      <b>
                        {data2025[selectedBar].hari_raya === 1 ? "Ya" : "Tidak"}
                      </b>
                    </li>
                  </ul>
                  <button
                    style={{
                      marginTop: 10,
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 16px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedBar(null)}
                  >
                    Tutup
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
      {/* Responsive helper style */}
      <style>
        {`
          @media (max-width: 900px) {
            .summary-cards-row {
              flex-direction: column !important;
              gap: 16px !important;
            }
            section, .summary-cards-row > div {
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          }
          @media (max-width: 600px) {
            body, html, #__next, #root {
              padding: 0 !important;
            }
            div[style*="padding: 32px"] {
              padding: 10px !important;
            }
            h1 { font-size: 18px !important; }
            h2 { font-size: 15px !important; }
            .summary-cards-row, .summary-card {
              flex-direction: column !important;
              min-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .summary-card {
              padding: 12px !important;
              font-size: 13px !important;
            }
            section {
              padding: 10px !important;
            }
            input, select, button {
              font-size: 14px !important;
            }
          }
        `}
      </style>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 200,
        background: "#fff",
        borderRadius: 16,
        boxShadow: isHovered
          ? "0 8px 24px #0003"
          : onClick
          ? "0 4px 16px #0002"
          : "0 2px 8px #0001",
        padding: 24,
        display: "flex",
        alignItems: "center",
        gap: 18,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s, transform 0.2s",
        transform: isHovered ? "scale(1.04)" : "scale(1)",
      }}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? "button" : undefined}
      onKeyPress={
        onClick
          ? (e) => {
              if (e.key === "Enter") onClick();
            }
          : undefined
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          background: "#f3f4f6",
          borderRadius: 12,
          padding: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 15, color: "#6b7280", fontWeight: 500 }}>
          {title}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/*
Beberapa fitur interaktif yang bisa dikembangkan untuk diagram batang prediksi keuntungan:

1. **Tooltip Detail Lengkap**
   - Saat hover bar, tampilkan info detail: minggu ke-, prediksi keuntungan, status hari raya, margin ayam, dsb.

2. **Highlight Bar**
   - Klik/hover bar untuk highlight minggu tertentu, lalu tampilkan info mingguan di bawah chart.

3. **Filter/Range Selector**
   - Tambahkan slider atau input untuk memilih rentang minggu yang ingin ditampilkan (misal: minggu 10-20 saja).

4. **Export Data**
   - Tombol untuk download data prediksi (CSV/Excel) atau gambar chart.

5. **Bandingkan Tahun**
   - Tampilkan dua set data (misal 2024 vs 2025) dalam satu chart untuk membandingkan prediksi dan realisasi.

6. **Custom Color**
   - Pilih warna batang berdasarkan range keuntungan (misal: hijau = tinggi, kuning = sedang, merah = rendah).

7. **Zoom & Pan**
   - Fitur zoom in/out dan geser (pan) pada chart jika data minggu sangat banyak.

8. **Click to Show Details**
   - Klik bar untuk membuka modal/detail mingguan: breakdown prediksi, faktor penyumbang, dsb.

9. **Dynamic Update**
   - Chart otomatis update jika ada perubahan input (misal harga ayam hari ini diubah).

10. **Show/Hide Hari Raya**
    - Checkbox untuk menampilkan/menyembunyikan minggu hari raya pada chart.

Semua fitur di atas bisa diimplementasikan dengan Chart.js (plugin), React state, atau library chart lain seperti Recharts, ApexCharts, dsb.
*/
