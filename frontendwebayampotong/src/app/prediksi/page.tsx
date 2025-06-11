"use client";

import React, { useEffect, useRef, useState } from "react";
import { getTotalBalance, getBalanceSummary } from "@/services/balance";

// Import Chart.js secara dinamis
import { useEffect as useEffectChart, useRef as useRefChart } from "react";

// Fungsi fetch data prediksi 2025
async function fetchPrediksi2025(): Promise<
  { minggu: string; prediksi_keuntungan: number; hari_raya: number }[]
> {
  try {
    const res = await fetch("http://localhost:5000/prediksi2025");
    if (res.ok) {
      return await res.json();
    }
    return [];
  } catch {
    return [];
  }
}

// Fungsi fetch keuntungan aktual (ambil total balance keseluruhan, bukan per minggu)
async function fetchAktualKeuntungan(token: string): Promise<number> {
  try {
    const total = await getTotalBalance(token);
    return Math.round((total || 0) / 1000) * 1000;
  } catch {
    return 0;
  }
}

// Fungsi fetch keuntungan aktual per minggu (menggunakan getBalanceSummary)
async function fetchAktualKeuntunganMinggu(
  token: string,
  minggu: number,
  tahun: number
): Promise<number> {
  try {
    // Cari tanggal awal dan akhir minggu ke-n pada tahun tertentu
    // Minggu ke-1: 1 Jan, dst.
    const firstDayOfYear = new Date(tahun, 0, 1);
    const start = new Date(firstDayOfYear);
    start.setDate(start.getDate() + (minggu - 1) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    // Format ke yyyy-mm-dd
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    // Ambil summary per minggu
    const summary = await getBalanceSummary(token, "week", startStr);
    return summary?.balance ?? 0;
  } catch {
    return 0;
  }
}

export default function Prediksi2025Page() {
  // Proteksi halaman: redirect ke login jika tidak ada token
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  const [data2025, setData2025] = useState<
    { minggu: string; prediksi_keuntungan: number; hari_raya: number }[]
  >([]);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);

  // Untuk compare prediksi vs aktual
  const [mingguCompare, setMingguCompare] = useState<number>(1);
  const [aktual, setAktual] = useState<number>(0);
  const [prediksi, setPrediksi] = useState<number>(0);

  const chartRef = useRef<HTMLCanvasElement>(null);

  // Ambil data prediksi 2025
  useEffect(() => {
    fetchPrediksi2025().then(setData2025);
  }, []);

  // Render Chart.js diagram batang
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
        const keuntungan = data2025.map(
          (d) => Math.round(d.prediksi_keuntungan / 1000) * 1000
        );
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
                setMingguCompare(idx + 1);
              }
            },
          },
        });
        (chartRef.current as any)._chartInstance = chartInstance;
      }
    });
  }, [data2025, selectedBar]);

  // Sync prediksi & fetch aktual saat mingguCompare berubah
  useEffect(() => {
    if (data2025.length === 0) return;
    const idx = mingguCompare - 1;
    const pred = data2025[idx]?.prediksi_keuntungan || 0;
    setPrediksi(Math.round(pred / 1000) * 1000);

    // Ambil token dari localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

    // Ambil tahun dari data prediksi (asumsi 2025, atau dari minggu jika ada)
    const tahun = 2025;
    fetchAktualKeuntunganMinggu(token, mingguCompare, tahun).then(setAktual);
  }, [mingguCompare, data2025]);

  // Hitung selisih dan persentase akurasi
  const selisih = prediksi - aktual;
  const persentase =
    prediksi === 0
      ? 0
      : Math.round(
          (Math.min(prediksi, aktual) / Math.max(prediksi, aktual)) * 100
        );

  // Helper: format ribuan tanpa koma
  function formatRupiah(val: number) {
    return val.toLocaleString("id-ID", { maximumFractionDigits: 0 });
  }

  // Daftar minggu untuk select
  const mingguOptions = data2025.map((d, i) => ({
    label: `Minggu ke-${i + 1}`,
    value: i + 1,
  }));

  return (
    <div style={{ flex: 1, padding: 32, background: "#f9fafb" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Prediksi Keuntungan 2025
      </h1>
      <section
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #0001",
          padding: 24,
          minHeight: 80,
          marginBottom: 32,
        }}
      >
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
                      {formatRupiah(
                        Math.round(
                          data2025[selectedBar].prediksi_keuntungan / 1000
                        ) * 1000
                      )}
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

      {/* Compare Prediksi vs Aktual */}
      <section
        style={{
          width: "100%",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #0001",
          padding: 24,
          minHeight: 120,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 18 }}>
          Perbandingan Prediksi vs Aktual
        </h2>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, marginRight: 10 }}>
            Pilih Minggu:
          </label>
          <select
            value={mingguCompare}
            onChange={(e) => setMingguCompare(Number(e.target.value))}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 15,
            }}
          >
            {mingguOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 12,
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
              minWidth: 180,
            }}
          >
            Prediksi:{" "}
            <span style={{ fontWeight: 700 }}>Rp {formatRupiah(prediksi)}</span>
          </div>
          <div
            style={{
              background: "#eef2ff",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#3730a3",
              fontWeight: 600,
              fontSize: 15,
              minWidth: 180,
            }}
          >
            Aktual:{" "}
            <span style={{ fontWeight: 700 }}>Rp {formatRupiah(aktual)}</span>
          </div>
          <div
            style={{
              background: "#fef2f2",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#b91c1c",
              fontWeight: 600,
              fontSize: 15,
              minWidth: 180,
            }}
          >
            Selisih:{" "}
            <span style={{ fontWeight: 700 }}>
              Rp {formatRupiah(Math.abs(selisih))}
            </span>
          </div>
          <div
            style={{
              background: "#f3f4f6",
              borderRadius: 10,
              padding: "14px 18px",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: 15,
              minWidth: 180,
            }}
          >
            Akurasi: <span style={{ fontWeight: 700 }}>{persentase}%</span>
          </div>
        </div>
      </section>
    </div>
  );
}
