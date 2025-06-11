"use client";
import { useEffect, useState } from "react";

type Livestock = {
  id: number;
  type: string;
  quantity: number;
  entry_date: string;
  exit_date: string | null;
};

const getLivestock = async (token: string) => {
  const res = await fetch("http://localhost:3000/livestock", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal fetch stok ayam");
  return await res.json();
};

export default function StokPage() {
  const [data, setData] = useState<Livestock[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5; // tampilkan per 5

  // Hitung total stok tersedia
  const totalStok = data.reduce((sum, item) => sum + (item.quantity || 0), 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const result = await getLivestock(token);
        setData(result);
      } catch {
        setData([]);
      }
    };
    fetchData();
  }, []);

  // Urutkan: stok masih ada (quantity > 0) di atas, lalu habis
  const sortedData = [
    ...data.filter((item) => item.quantity > 0),
    ...data.filter((item) => !item.quantity || item.quantity === 0),
  ];

  const totalRows = sortedData.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginated = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div style={{ padding: 32, background: "#f3f4f6", minHeight: "100vh" }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#111",
          marginBottom: 24,
        }}
      >
        Stok Ayam
      </h1>
      {/* Summary Card */}
      <div
        style={{
          display: "flex",
          gap: 24,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px #0001",
            padding: "24px 32px",
            minWidth: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span style={{ color: "#6b7280", fontSize: 15, fontWeight: 500 }}>
            Total Stok Tersedia
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#2563eb",
              marginTop: 8,
            }}
          >
            {totalStok}
          </span>
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px #0001",
          padding: 0,
          overflow: "auto",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontFamily: "Inter, Arial, sans-serif",
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th
                style={{
                  padding: 16,
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#94a3b8",
                  width: 48,
                  fontSize: 15,
                  letterSpacing: 0.5,
                  borderTopLeftRadius: 16,
                  background: "#f8fafc",
                }}
              >
                No
              </th>
              <th
                style={{
                  padding: 16,
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#94a3b8",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  background: "#f8fafc",
                }}
              >
                Tipe
              </th>
              <th
                style={{
                  padding: 16,
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#94a3b8",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  background: "#f8fafc",
                }}
              >
                Stok
              </th>
              <th
                style={{
                  padding: 16,
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#94a3b8",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  background: "#f8fafc",
                }}
              >
                Tanggal Masuk
              </th>
              <th
                style={{
                  padding: 16,
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#94a3b8",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  background: "#f8fafc",
                  borderTopRightRadius: 16,
                }}
              >
                Tanggal Keluar
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, i) => (
              <tr
                key={item.id ?? `${item.type}-${i}`}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <td
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#64748b",
                    fontWeight: 700,
                    fontSize: 16,
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  {(currentPage - 1) * rowsPerPage + i + 1}
                </td>
                <td
                  style={{
                    padding: 16,
                    color: "#222",
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  {item.type || "-"}
                </td>
                <td
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: item.quantity === 0 ? "#ef4444" : "#111",
                    fontWeight: item.quantity === 0 ? 700 : 500,
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  {item.quantity === 0 ? "Habis" : item.quantity}
                </td>
                <td
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#111",
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  {item.entry_date
                    ? new Date(item.entry_date).toLocaleDateString("id-ID")
                    : "-"}
                </td>
                <td
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: "#111",
                    background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  }}
                >
                  {item.exit_date
                    ? new Date(item.exit_date).toLocaleDateString("id-ID")
                    : "-"}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr key="empty">
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "#888",
                    fontSize: 16,
                  }}
                >
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            gap: 4,
          }}
        >
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{
              marginRight: 4,
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background: currentPage === 1 ? "#f3f4f6" : "#fff",
              color: currentPage === 1 ? "#aaa" : "#111",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {"<"}
          </button>
          {Array.from({ length: totalPages }, (_, idx) => (
            <button
              key={`page-${idx + 1}`}
              onClick={() => setCurrentPage(idx + 1)}
              style={{
                margin: "0 2px",
                padding: "6px 14px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: currentPage === idx + 1 ? "#111" : "#fff",
                color: currentPage === idx + 1 ? "#fff" : "#111",
                fontWeight: currentPage === idx + 1 ? 700 : 500,
                cursor: "pointer",
                fontSize: 16,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {idx + 1}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{
              marginLeft: 4,
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              background:
                currentPage === totalPages || totalPages === 0
                  ? "#f3f4f6"
                  : "#fff",
              color:
                currentPage === totalPages || totalPages === 0
                  ? "#aaa"
                  : "#111",
              cursor:
                currentPage === totalPages || totalPages === 0
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
}
