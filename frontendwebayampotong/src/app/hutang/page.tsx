"use client";

import { useEffect, useState } from "react";
import { Search, User, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

type Debt = {
  debt_receivables_id: number;
  customer_id: number;
  type: string;
  amount: number;
  due_date: string;
  status: string;
};

type Customer = {
  customer_id: number;
  name: string;
  contact?: string;
  address?: string;
};

export default function HutangPage() {
  // Proteksi halaman: redirect ke login jika tidak ada token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  const [debts, setDebts] = useState<Debt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const fetchDebts = async () => {
      const res = await fetch(`${apiUrl}/debt-receivables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDebts(await res.json());
      }
    };

    const fetchCustomers = async () => {
      const res = await fetch(`${apiUrl}/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCustomers(await res.json());
      }
    };

    Promise.all([fetchDebts(), fetchCustomers()]).finally(() =>
      setLoading(false)
    );
  }, []);

  // Helper untuk dapatkan data customer
  const getCustomer = (id: number) =>
    customers.find((c) => c.customer_id === id);

  // Fungsi cetak struk hutang
  const handlePrintReceipt = (debt: Debt) => {
    const cust = getCustomer(debt.customer_id);
    const namaPelanggan = cust?.name || "-";
    const kontak = cust?.contact || "-";
    const alamat = cust?.address || "-";
    // Ambil tanggal transaksi (pakai due_date jika tidak ada field lain)
    const tanggal = debt.due_date
      ? new Date(debt.due_date).toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";
    const jumlah = Number(debt.amount || 0).toLocaleString("id-ID");
    const status =
      debt.status?.toLowerCase() === "lunas" ? "Lunas" : "Belum Lunas";
    const sisaHutang =
      debt.status?.toLowerCase() === "lunas" ? 0 : Number(debt.amount || 0);

    const doc = new jsPDF();
    // Header toko
    doc.setFontSize(16);
    doc.text("AYAM POTONG EVA", 105, 18, { align: "center" });
    doc.setFontSize(10);
    doc.text(
      "Jl. Poros, Jambuk Makmur, Kec. Bongan, Kabupaten Kutai Barat, Kalimantan Timur.",
      105,
      26,
      { align: "center" }
    );
    doc.text("Telp: 0812-5803-1337", 105, 31, { align: "center" });
    doc.line(15, 35, 195, 35);

    // Judul invoice
    doc.setFontSize(13);
    doc.text("INVOICE HUTANG PELANGGAN", 105, 43, { align: "center" });

    // Info hutang
    doc.setFontSize(11);
    doc.text("Tanggal Transaksi", 15, 53);
    doc.text(":", 50, 53);
    doc.text(`${tanggal}`, 55, 53); // <-- ubah dari 60 ke 55 agar rata dengan pelanggan/kontak/alamat

    doc.text("No. Hutang", 15, 59);
    doc.text(":", 50, 59);
    doc.text(`${debt.debt_receivables_id || "-"}`, 55, 59);

    doc.text("Pelanggan", 120, 53);
    doc.text(":", 150, 53);
    doc.text(`${namaPelanggan}`, 155, 53);

    doc.text("Kontak", 120, 59);
    doc.text(":", 150, 59);
    doc.text(`${kontak}`, 155, 59);

    doc.text("Alamat", 120, 65);
    doc.text(":", 150, 65);
    doc.text(`${alamat}`, 155, 65);

    doc.line(15, 69, 195, 69);

    // Tabel detail hutang
    doc.setFontSize(11);
    doc.text("Kategori", 20, 77);
    doc.text("Jumlah Hutang", 90, 77);
    doc.text("Status", 150, 77);

    doc.line(15, 80, 195, 80);

    doc.text(`${debt.type}`, 20, 87);
    doc.text(`Rp ${jumlah}`, 100, 87, { align: "center" });
    doc.text(`${status}`, 170, 87, { align: "right" });

    doc.line(15, 91, 195, 91);

    // Sisa hutang
    // Perbaikan: gunakan doc.setFont("helvetica", "bold") dan doc.setFont("helvetica", "normal")
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Sisa Hutang", 120, 98);
    doc.text(":", 150, 98);
    doc.text(`Rp ${Number(sisaHutang).toLocaleString("id-ID")}`, 155, 98);
    doc.setFont("helvetica", "normal");

    // Footer
    doc.setFontSize(10);
    doc.text(
      "Terima kasih atas kepercayaan Anda bertransaksi di tempat kami.",
      105,
      115,
      { align: "center" }
    );

    doc.output("dataurlnewwindow");
  };

  // Filter pencarian
  const filteredDebts = debts
    .filter((debt) => {
      const cust = getCustomer(debt.customer_id);
      const searchText = search.toLowerCase();
      return (
        !searchText ||
        (cust?.name && cust.name.toLowerCase().includes(searchText)) ||
        (cust?.contact && cust.contact.toLowerCase().includes(searchText)) ||
        (cust?.address && cust.address.toLowerCase().includes(searchText))
      );
    })
    // Urutkan: Belum Lunas paling atas, lalu Lunas, lalu due_date terbaru ke terlama
    .sort((a, b) => {
      const statusA = (a.status || "").toLowerCase();
      const statusB = (b.status || "").toLowerCase();
      if (statusA === "belum lunas" && statusB === "lunas") return -1;
      if (statusA === "lunas" && statusB === "belum lunas") return 1;
      // Jika status sama, urutkan due_date terbaru ke terlama
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    });

  // Pagination logic
  const rowsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalRows = filteredDebts.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginated = filteredDebts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div style={{ padding: 32, background: "#f7f8fa", minHeight: "100vh" }}>
      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          marginBottom: 4,
          color: "#18181b",
        }}
      >
        Daftar Hutang Pelanggan
      </h1>
      <div style={{ color: "#64748b", marginBottom: 28, fontSize: 16 }}>
        Kelola data hutang pelanggan Anda dengan mudah
      </div>
      {/* Search bar */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 1px 4px #0001",
          padding: "8px 16px",
          maxWidth: 480,
        }}
      >
        <Search size={20} color="#64748b" style={{ marginRight: 8 }} />
        <input
          type="text"
          placeholder="Cari pelanggan berdasarkan nama, kontak, atau alamat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 16,
            flex: 1,
            color: "#18181b",
          }}
        />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 2px 8px #0001",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
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
                  borderTopLeftRadius: 14,
                  background: "#f8fafc",
                }}
              >
                NO
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
                NAMA PELANGGAN
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
                KATEGORI
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
                JUMLAH HUTANG
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
                TANGGAL
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
                STATUS
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
                  borderTopRightRadius: 14,
                  width: 80,
                }}
              >
                AKSI
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: 32, color: "#64748b" }}
                >
                  Memuat...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{ textAlign: "center", padding: 32, color: "#64748b" }}
                >
                  Tidak ada data hutang.
                </td>
              </tr>
            ) : (
              paginated.map((debt, idx) => {
                const cust = getCustomer(debt.customer_id);
                return (
                  <tr
                    key={debt.debt_receivables_id}
                    style={{
                      background: idx % 2 === 0 ? "#fff" : "#f8fafc",
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
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {(currentPage - 1) * rowsPerPage + idx + 1}
                    </td>
                    <td
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        padding: 16,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 20,
                          marginRight: 10,
                          flexShrink: 0,
                        }}
                      >
                        {cust?.name ? (
                          cust.name.charAt(0).toUpperCase()
                        ) : (
                          <User size={20} />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 17,
                            color: "#18181b",
                          }}
                        >
                          {cust?.name || "-"}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#18181b",
                        fontWeight: 600,
                        fontSize: 15,
                        padding: 16,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {debt.type}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#18181b",
                        fontWeight: 700,
                        fontSize: 16,
                        padding: 16,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {Number(debt.amount).toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      })}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        color: "#18181b",
                        fontWeight: 500,
                        fontSize: 15,
                        padding: 16,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {debt.due_date
                        ? new Date(debt.due_date).toLocaleDateString("id-ID")
                        : "-"}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: 16,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          color:
                            debt.status?.toLowerCase() === "lunas"
                              ? "#16a34a"
                              : "#dc2626",
                          background:
                            debt.status?.toLowerCase() === "lunas"
                              ? "#dcfce7"
                              : "#fee2e2",
                          borderRadius: 8,
                          padding: "4px 18px",
                          fontWeight: 700,
                          fontSize: 15,
                          display: "inline-block",
                        }}
                      >
                        {debt.status?.toLowerCase() === "lunas"
                          ? "Lunas"
                          : "Belum Lunas"}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: 16,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <button
                        onClick={() => handlePrintReceipt(debt)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 6,
                          borderRadius: 6,
                          transition: "background 0.2s",
                        }}
                        title="Cetak Struk"
                      >
                        <FileText size={18} color="#7F8CAA" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "18px 24px",
            fontSize: 15,
            color: "#64748b",
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            background: "#f7fafd",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            Menampilkan{" "}
            {totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            {" - "}
            {Math.min(currentPage * rowsPerPage, totalRows)}
            {" dari "}
            {totalRows} hutang
          </div>
          <div style={{ display: "flex", gap: 0, justifyContent: "center" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                minWidth: 40,
                height: 40,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: currentPage === 1 ? "#f3f4f6" : "#fff",
                color: currentPage === 1 ? "#aaa" : "#111",
                fontWeight: 700,
                fontSize: 18,
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                marginRight: 4,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {"<"}
            </button>
            {Array.from({ length: totalPages }, (_, idx) => (
              <button
                key={idx + 1}
                onClick={() => setCurrentPage(idx + 1)}
                style={{
                  minWidth: 40,
                  height: 40,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: currentPage === idx + 1 ? "#111" : "#fff",
                  color: currentPage === idx + 1 ? "#fff" : "#111",
                  fontWeight: currentPage === idx + 1 ? 700 : 500,
                  fontSize: 18,
                  cursor: "pointer",
                  margin: "0 2px",
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
                minWidth: 40,
                height: 40,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background:
                  currentPage === totalPages || totalPages === 0
                    ? "#f3f4f6"
                    : "#fff",
                color:
                  currentPage === totalPages || totalPages === 0
                    ? "#aaa"
                    : "#111",
                fontWeight: 700,
                fontSize: 18,
                cursor:
                  currentPage === totalPages || totalPages === 0
                    ? "not-allowed"
                    : "pointer",
                marginLeft: 4,
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
