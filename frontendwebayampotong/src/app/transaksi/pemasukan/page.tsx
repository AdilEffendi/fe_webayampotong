"use client";

import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "@/components/ui/tabs";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Pencil,
  Trash2,
  Calendar,
  User,
  FileText,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react"; // tambahkan icon
import { getAccounts } from "@/services/account";
import { jsPDF } from "jspdf"; // tambahkan ini

const getAllTransactions = async (token: string) => {
  const res = await fetch("http://localhost:3000/transactions", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal fetch transaksi");
  return await res.json();
};

export default function TransaksiPage() {
  // Proteksi halaman: redirect ke login jika tidak ada token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState("semua");
  const [form, setForm] = useState({
    jumlah: "",
    tanggal: "",
    kategori: "",
    deskripsi: "",
    user_id: "",
  });
  const [username, setUsername] = useState("");
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [role, setRole] = useState(""); // untuk role user
  const rowsPerPage = 5;
  const [editModal, setEditModal] = useState<{ open: boolean; trx?: any }>({
    open: false,
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState(""); // fitur pencarian
  const [modal, setModal] = useState<{
    open: boolean;
    success: boolean;
    message: string;
    confirm?: boolean;
    onConfirm?: (() => void) | null;
  }>({
    open: false,
    success: true,
    message: "",
    confirm: false,
    onConfirm: null,
  });

  const showModal = (success: boolean, message: string) => {
    setModal({
      open: true,
      success,
      message,
      confirm: false,
      onConfirm: null,
    });
  };
  const showConfirm = (message: string, onConfirm: () => void) => {
    setModal({
      open: true,
      success: true,
      message,
      confirm: true,
      onConfirm,
    });
  };

  useEffect(() => {
    const fetchTransaksi = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const data = await getAllTransactions(token);
        // Urutkan dari tanggal dan jam terbaru ke terlama
        setTransaksi(
          data.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
          })
        );
      } catch (err) {
        setTransaksi([]);
      }
    };
    fetchTransaksi();

    // Ambil username dan role dari localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || "");
        setRole(user.role || "");
        setForm((f) => ({ ...f, user_id: user.username || "" }));
      } catch {}
    }

    // Ambil akun dari backend
    const fetchAccounts = async () => {
      const token = localStorage.getItem("token") || "";
      try {
        const data = await getAccounts(token);
        setAccounts(data);
        // Otomatis pilih akun kas jika kategori Penjualan
        const kas = data.find((a: any) => a.account_type === "Kas");
        if (kas) setSelectedAccount(kas.account_id);
      } catch {}
    };
    fetchAccounts();

    // Ambil daftar customer
    const fetchCustomers = async () => {
      const token = localStorage.getItem("token") || "";
      try {
        const url = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL + "/customers"
          : "http://localhost:3000/customers";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch {}
    };
    fetchCustomers();
  }, []);

  // Filter hanya transaksi dengan type Income
  // DAN hanya tampilkan transaksi yang status-nya non-kredit atau kredit (tidak null)
  const pemasukan = transaksi.filter(
    (t) =>
      t.type === "Income" &&
      (t.status === "non-kredit" || t.status === "kredit")
  );

  // Helper untuk dapatkan nama customer dari id
  const getCustomerName = (customer_id: any) => {
    if (!customer_id) return "-";
    const cust = customers.find((c) => c.customer_id === customer_id);
    return cust ? cust.name : "-";
  };

  // Filter pencarian sebelum pagination
  const filtered = pemasukan.filter((t) => {
    if (!search) return true;
    const pembeli = getCustomerName(t.customer_id).toLowerCase();
    const penerima = (t.user_id || "").toLowerCase();
    const kategori = (
      t.category ||
      t.kategori ||
      (t.type === "Income" ? "Penjualan" : "") ||
      ""
    ).toLowerCase();
    const deskripsi = (t.description || t.deskripsi || "").toLowerCase();
    const jumlahAyam = (
      t.jumlah_ayam !== undefined && t.jumlah_ayam !== null
        ? String(t.jumlah_ayam)
        : ""
    ).toLowerCase();
    const tanggal = t.date ? new Date(t.date).toLocaleDateString("id-ID") : "";
    const jumlah = String(t.amount || t.jumlah || "");
    const q = search.toLowerCase();
    return (
      pembeli.includes(q) ||
      penerima.includes(q) ||
      kategori.includes(q) ||
      deskripsi.includes(q) ||
      jumlahAyam.includes(q) ||
      tanggal.includes(q) ||
      jumlah.includes(q)
    );
  });

  // Pagination logic setelah filter pencarian
  const totalRows = filtered.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  // Urutkan paginated juga berdasarkan tanggal dan jam terbaru
  const paginated = filtered
    .sort((a: any, b: any) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    })
    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Jika kategori berubah ke Penjualan, pilih akun kas otomatis
    if (e.target.name === "kategori" && e.target.value === "Penjualan") {
      const kas = accounts.find((a: any) => a.account_type === "Kas");
      if (kas) setSelectedAccount(kas.account_id);
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const data = {
        amount: Number(form.jumlah),
        date: form.tanggal,
        type: form.kategori,
        category: form.kategori,
        description: form.deskripsi,
        user_id: form.user_id,
        account_id: selectedAccount,
        source: form.kategori,
      };
      await import("@/services/income").then(({ createIncome }) =>
        createIncome(data, token)
      );
      setForm({
        jumlah: "",
        tanggal: "",
        kategori: "Penjualan",
        deskripsi: "",
        user_id: username,
      });
      const newData = await getAllTransactions(token);
      setTransaksi(
        newData.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      showModal(true, "Pemasukan berhasil ditambahkan!");
    } catch (err) {
      showModal(false, "Gagal menambah pemasukan");
    }
  };

  const handleEdit = (trx: any) => {
    setEditModal({ open: true, trx });
  };

  const handleEditClose = () => {
    setEditModal({ open: false });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.trx) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `http://localhost:3000/transactions/${editModal.trx.transaction_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editModal.trx),
        }
      );
      if (!res.ok) throw new Error("Gagal update transaksi");
      setEditModal({ open: false });
      // Refresh data
      const data = await getAllTransactions(token);
      setTransaksi(
        data.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      showModal(true, "Transaksi berhasil diupdate!");
    } catch (err) {
      showModal(false, "Gagal update transaksi");
    }
  };

  // Handler aksi
  const handleDelete = async (trx: any) => {
    showConfirm("Yakin hapus transaksi ini?", async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `http://localhost:3000/transactions/${trx.transaction_id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Gagal hapus transaksi");
        // Refresh data
        const data = await getAllTransactions(token);
        setTransaksi(
          data.sort(
            (a: any, b: any) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )
        );
        showModal(true, "Transaksi berhasil dihapus!");
      } catch (err) {
        showModal(false, "Gagal menghapus transaksi");
      }
    });
  };

  // Fungsi cetak struk PDF
  const handlePrintReceipt = (trx: any) => {
    const doc = new jsPDF();
    const pembeliName = getCustomerName(trx.customer_id);
    const penerima = trx.user_id || "-";
    const jumlahAyam =
      trx.jumlah_ayam !== undefined && trx.jumlah_ayam !== null
        ? trx.jumlah_ayam
        : "-";
    const tanggal = trx.date
      ? new Date(trx.date).toLocaleString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";
    const jumlah = Number(trx.amount || trx.jumlah || 0).toLocaleString(
      "id-ID"
    );
    const status = trx.status === "kredit" ? "Belum Lunas" : "Lunas";

    // Header toko
    doc.setFontSize(16);
    doc.text("AYAM POTONG EVA", 105, 18, { align: "center" });
    // Tambah jarak antara judul dan alamat
    doc.setFontSize(10);
    doc.text(
      "Jl. Poros, Jambuk Makmur, Kec. Bongan, Kabupaten Kutai Barat, Kalimantan Timur.",
      105,
      26, // sebelumnya 25, sekarang 26 (lebih jauh dari judul)
      { align: "center" }
    );
    doc.text("Telp: 0812-5803-1337", 105, 31, { align: "center" });

    // Garis pemisah
    doc.line(15, 35, 195, 35);

    // Judul invoice
    doc.setFontSize(13);
    doc.text("STRUK", 105, 43, { align: "center" });

    // Info transaksi (ratakan titik dua)
    doc.setFontSize(11);
    // Gunakan posisi x tetap untuk titik dua dan value
    doc.text("Tanggal", 15, 53);
    doc.text(":", 40, 53);
    doc.text(`${tanggal}`, 45, 53);

    doc.text("No. Invoice", 15, 59);
    doc.text(":", 40, 59);
    doc.text(`${trx.transaction_id || "-"}`, 45, 59);

    doc.text("Pelanggan", 120, 53);
    doc.text(":", 150, 53);
    doc.text(`${pembeliName}`, 155, 53);

    doc.text("Penerima", 120, 59);
    doc.text(":", 150, 59);
    doc.text(`${penerima}`, 155, 59);

    // Garis pemisah
    doc.line(15, 63, 195, 63);

    // Tabel detail transaksi
    doc.setFontSize(11);
    doc.text("Deskripsi", 20, 71);
    doc.text("Jumlah Ayam", 90, 71);
    doc.text("Sub Total", 150, 71);

    // Garis bawah header tabel
    doc.line(15, 74, 195, 74);

    // Isi tabel
    doc.text(
      trx.description && trx.description.trim() !== ""
        ? trx.description
        : trx.deskripsi && trx.deskripsi.trim() !== ""
        ? trx.deskripsi
        : "-",
      20,
      81
    );
    doc.text(`${jumlahAyam}`, 100, 81, { align: "center" });
    doc.text(`Rp ${jumlah}`, 170, 81, { align: "right" });

    // Garis bawah isi tabel
    doc.line(15, 86, 195, 86);

    // Bold untuk TOTAL
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", 120, 93);
    doc.text(":", 150, 93);
    doc.text(`Rp ${jumlah}`, 155, 93);
    doc.setFont("helvetica", "normal");

    // Status pembayaran
    doc.setFontSize(11);
    doc.text("Status", 120, 100);
    doc.text(":", 150, 100);
    doc.text(status, 155, 100);

    // Footer
    doc.setFontSize(10);
    doc.text(
      "Terima kasih atas kepercayaan Anda bertransaksi di tempat kami.",
      105,
      115,
      { align: "center" }
    );

    // Preview PDF di tab baru
    doc.output("dataurlnewwindow");
  };

  return (
    <div style={{ padding: 32, background: "#f3f4f6", minHeight: "100vh" }}>
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
              {modal.confirm
                ? "KONFIRMASI"
                : modal.success
                ? "BERHASIL"
                : "GAGAL"}
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
            {modal.confirm ? (
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center" }}
              >
                <button
                  onClick={() => setModal((m) => ({ ...m, open: false }))}
                  style={{
                    background: "#eee",
                    color: "#333",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 32px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setModal((m) => ({ ...m, open: false }));
                    if (modal.onConfirm) modal.onConfirm();
                  }}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 32px",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                  autoFocus
                >
                  Oke
                </button>
              </div>
            ) : (
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
            )}
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
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#111",
          marginBottom: 24,
        }}
      >
        Laporan Pemasukan
      </h1>

      {/* Fitur Pencarian */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Cari pemasukan berdasarkan pembeli, penerima, kategori, dll..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "#fff",
            fontSize: 16,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Tabel Transaksi */}
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
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#94a3b8",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  background: "#f8fafc",
                }}
              >
                PENERIMA
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
                KATEGORI
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
                JUMLAH AYAM
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
                TANGGAL
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
                DESKRIPSI
              </th>
              <th
                style={{
                  padding: 16,
                  textAlign: "right",
                  fontWeight: 700,
                  color: "#94a3b8",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  background: "#f8fafc",
                }}
              >
                JUMLAH
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
              {(role === "pemilik usaha" || role === "karyawan") && (
                <th
                  style={{
                    padding: 16,
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#94a3b8",
                    width: 80,
                    fontSize: 15,
                    letterSpacing: 0.5,
                    borderTopRightRadius: 16,
                    background: "#f8fafc",
                  }}
                >
                  AKSI
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((t, i) => {
                const pembeliName = getCustomerName(t.customer_id);
                const avatarChar =
                  pembeliName && pembeliName !== "-"
                    ? pembeliName[0].toUpperCase()
                    : "?";
                return (
                  <tr
                    key={i}
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
                        fontWeight: 600,
                        fontSize: 15,
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: "#2563eb",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 18,
                            flexShrink: 0,
                            boxShadow: "0 1px 3px #0001",
                            textTransform: "uppercase",
                          }}
                        >
                          {avatarChar}
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: "#222",
                            fontFamily: "Inter, Arial, sans-serif",
                            textTransform: "capitalize",
                          }}
                        >
                          {pembeliName}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: 16,
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: 15,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <User size={16} style={{ color: "#64748b" }} />
                        {t.user_id || "-"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 16,
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: 15,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {t.category && t.category.trim() !== ""
                        ? t.category
                        : t.kategori && t.kategori.trim() !== ""
                        ? t.kategori
                        : t.type === "Income"
                        ? "Penjualan"
                        : t.type === "Expense"
                        ? "Pengeluaran"
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: 16,
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: 15,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {t.jumlah_ayam !== undefined && t.jumlah_ayam !== null
                        ? t.jumlah_ayam
                        : "-"}
                    </td>
                    <td
                      style={{
                        padding: 16,
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: 15,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Calendar size={16} style={{ color: "#64748b" }} />
                        {t.date
                          ? (() => {
                              const d = new Date(t.date);
                              // Format: 17 Juni 2024, Senin 14:30
                              const hari = d.toLocaleDateString("id-ID", {
                                weekday: "long",
                              });
                              const tanggal = d.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              });
                              const jam = d.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                              return `${tanggal}, ${hari} ${jam}`;
                            })()
                          : ""}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 16,
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: 15,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <FileText size={16} style={{ color: "#64748b" }} />
                        {(() => {
                          const desc =
                            t.description && t.description.trim() !== ""
                              ? t.description
                              : t.deskripsi && t.deskripsi.trim() !== ""
                              ? t.deskripsi
                              : "-";
                          return desc.length > 10
                            ? desc.slice(0, 10) + "..."
                            : desc;
                        })()}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 16,
                        textAlign: "right",
                        color:
                          t.status === "kredit"
                            ? "#64748b"
                            : t.status === "non-kredit"
                            ? "#22c55e"
                            : t.type === "Income"
                            ? "#22c55e"
                            : t.type === "Expense"
                            ? "#ef4444"
                            : "#222",
                        fontWeight: 700,
                        fontSize: 16,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 4,
                        }}
                      >
                        {/* TIDAK ADA ICON jika status kredit, ada icon jika non-kredit */}
                        {t.type === "Income" && t.status !== "kredit" ? (
                          <ArrowUpCircle
                            size={18}
                            color="#22c55e"
                            style={{ verticalAlign: "middle" }}
                          />
                        ) : t.type === "Expense" ? (
                          <ArrowDownCircle
                            size={18}
                            color="#ef4444"
                            style={{ verticalAlign: "middle" }}
                          />
                        ) : null}
                        Rp{" "}
                        {Number(t.amount || t.jumlah).toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: t.status === "kredit" ? "#64748b" : "#22c55e",
                        fontWeight: 700,
                        fontSize: 15,
                        background: i % 2 === 0 ? "#fff" : "#f8fafc",
                        textTransform: "capitalize",
                      }}
                    >
                      {t.status === "kredit"
                        ? "Kredit"
                        : t.status === "non-kredit"
                        ? "Non-Kredit"
                        : "-"}
                    </td>
                    {(role === "pemilik usaha" || role === "karyawan") && (
                      <td
                        style={{
                          padding: 16,
                          textAlign: "center",
                          background: i % 2 === 0 ? "#fff" : "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "center",
                          }}
                        >
                          {/* Tombol cetak struk */}
                          <button
                            onClick={() => handlePrintReceipt(t)}
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
                          {/* Tambahkan tombol Edit dan Hapus hanya untuk pemilik usaha */}
                          {role === "pemilik usaha" && (
                            <>
                              <button
                                onClick={() => handleEdit({ ...t })}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 6,
                                  borderRadius: 6,
                                  transition: "background 0.2s",
                                }}
                                title="Edit"
                              >
                                <Pencil size={18} color="#2563eb" />
                              </button>
                              <button
                                onClick={() => handleDelete(t)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: 6,
                                  borderRadius: 6,
                                  transition: "background 0.2s",
                                }}
                                title="Hapus"
                              >
                                <Trash2 size={18} color="#ef4444" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    role === "pemilik usaha" || role === "karyawan" ? 9 : 8
                  }
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
              key={idx + 1}
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
      {/* Modal Edit */}
      {editModal.open && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            background: "#0008",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={handleEditClose}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleEditSubmit}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              minWidth: 340,
              boxShadow: "0 4px 24px #0003",
              display: "flex",
              flexDirection: "column",
              gap: 0,
              maxWidth: 700,
              width: "100%",
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
              <Tag size={18} color="#7F8CAA" />
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
                Edit Data
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Jumlah (Rp)</label>
                <div style={{ position: "relative" }}>
                  <input
                    name="amount"
                    type="number"
                    value={editModal.trx.amount || ""}
                    onChange={(e) =>
                      setEditModal((m) => ({
                        ...m,
                        trx: { ...m.trx, amount: e.target.value },
                      }))
                    }
                    required
                    placeholder="Masukkan jumlah pemasukan"
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
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Tanggal</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      color: "#888",
                    }}
                  >
                    <Calendar size={18} />
                  </span>
                  <input
                    name="date"
                    type="date"
                    value={
                      editModal.trx.date ? editModal.trx.date.slice(0, 10) : ""
                    }
                    onChange={(e) =>
                      setEditModal((m) => ({
                        ...m,
                        trx: { ...m.trx, date: e.target.value },
                      }))
                    }
                    required
                    placeholder="dd/mm/yyyy"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Kategori</label>
                <select
                  name="category"
                  value={editModal.trx.category || ""}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      trx: { ...m.trx, category: e.target.value },
                    }))
                  }
                  required
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <option value="" disabled>
                    Pilih Kategori
                  </option>
                  <option value="Penjualan">Penjualan</option>
                  <option value="Pembayaran Hutang">Pembayaran Hutang</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Penerima</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      color: "#888",
                    }}
                  >
                    <User size={18} />
                  </span>
                  <input
                    name="user_id"
                    value={editModal.trx.user_id || ""}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f3f4f6",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Pembeli</label>
                <select
                  name="customer_id"
                  value={editModal.trx.customer_id || ""}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      trx: { ...m.trx, customer_id: e.target.value },
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  <option value="" disabled>
                    Pilih Pembeli
                  </option>
                  {customers.map((cust: any) => (
                    <option key={cust.customer_id} value={cust.customer_id}>
                      {cust.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Divider */}
              <div
                style={{
                  gridColumn: "1/3",
                  borderBottom: "1px solid #e5e7eb",
                  margin: "16px 0",
                }}
              />
              <div
                style={{
                  gridColumn: "1/3",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label style={{ fontWeight: 500 }}>Deskripsi</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      color: "#888",
                    }}
                  >
                    <FileText size={18} />
                  </span>
                  <input
                    name="description"
                    value={editModal.trx.description || ""}
                    onChange={(e) =>
                      setEditModal((m) => ({
                        ...m,
                        trx: { ...m.trx, description: e.target.value },
                      }))
                    }
                    required
                    placeholder="Contoh: Penjualan ayam, pembayaran hutang, dll"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 16,
              }}
            >
              <button
                type="button"
                onClick={handleEditClose}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="submit"
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 20px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
