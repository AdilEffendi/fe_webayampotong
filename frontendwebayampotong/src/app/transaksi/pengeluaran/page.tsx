"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const getAllExpenses = async (token: string) => {
  const res = await fetch("http://localhost:3000/expense", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal fetch expense");
  return await res.json();
};

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [role, setRole] = useState("");
  const [editModal, setEditModal] = useState<{ open: boolean; trx?: any }>({
    open: false,
  });
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
  const rowsPerPage = 5;
  const [username, setUsername] = useState("");
  const [search, setSearch] = useState(""); // tambahkan state search

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const data = await getAllExpenses(token);
        setExpenses(
          data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt || b.date).getTime() -
              new Date(a.createdAt || a.date).getTime()
          )
        );
      } catch {
        setExpenses([]);
      }
    };
    fetchData();

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role || "");
        setUsername(user.username || "");
      } catch {}
    }
  }, []);

  // Proteksi halaman: redirect ke login jika tidak ada token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  // Filter pencarian sebelum pagination
  const filtered = expenses.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const kategori = (t.category || t.kategori || "").toLowerCase();
    const jumlah = String(t.amount || t.jumlah || "");
    const tanggal = t.date
      ? new Date(t.date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";
    return kategori.includes(q) || jumlah.includes(q) || tanggal.includes(q);
  });

  const totalRows = filtered.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Edit
  const handleEdit = (trx: any) => setEditModal({ open: true, trx });
  const handleEditClose = () => setEditModal({ open: false });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.trx) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `http://localhost:3000/expense/${editModal.trx.expense_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editModal.trx),
        }
      );
      if (!res.ok) throw new Error("Gagal update pengeluaran");
      setEditModal({ open: false });
      const data = await getAllExpenses(token);
      setExpenses(
        data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt || b.date).getTime() -
            new Date(a.createdAt || a.date).getTime()
        )
      );
      setModal({
        open: true,
        success: true,
        message: "Pengeluaran berhasil diupdate!",
        confirm: false,
        onConfirm: null,
      });
    } catch {
      setModal({
        open: true,
        success: false,
        message: "Gagal update pengeluaran",
        confirm: false,
        onConfirm: null,
      });
    }
  };

  // Hapus
  const handleDelete = async (trx: any) => {
    setModal({
      open: true,
      success: true,
      message: "Yakin hapus pengeluaran ini?",
      confirm: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token") || "";
          const res = await fetch(
            `http://localhost:3000/expense/${trx.expense_id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!res.ok) throw new Error("Gagal hapus pengeluaran");
          const data = await getAllExpenses(token);
          setExpenses(
            data.sort(
              (a: any, b: any) =>
                new Date(b.createdAt || b.date).getTime() -
                new Date(a.createdAt || a.date).getTime()
            )
          );
          setModal({
            open: true,
            success: true,
            message: "Pengeluaran berhasil dihapus!",
            confirm: false,
            onConfirm: null,
          });
        } catch {
          setModal({
            open: true,
            success: false,
            message: "Gagal menghapus pengeluaran",
            confirm: false,
            onConfirm: null,
          });
        }
      },
    });
  };

  return (
    <div style={{ padding: 32 }}>
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
        Laporan Pengeluaran
      </h1>
      {/* Fitur Pencarian */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Cari pengeluaran berdasarkan kategori, jumlah, atau tanggal..."
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
          }}
        >
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                  letterSpacing: 0.5,
                  borderTopLeftRadius: 16,
                }}
              >
                NO
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                KATEGORI
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                TANGGAL
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                DESKRIPSI
              </th>
              <th
                style={{
                  padding: "16px 12px",
                  textAlign: "right",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                JUMLAH
              </th>
              {role === "pemilik usaha" && (
                <th
                  style={{
                    padding: "16px 12px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#64748b",
                    fontSize: 15,
                    borderTopRightRadius: 16,
                  }}
                >
                  AKSI
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => (
              <tr
                key={i}
                style={{
                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                {/* NO */}
                <td
                  style={{
                    padding: "14px 12px",
                    textAlign: "center",
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  {(currentPage - 1) * rowsPerPage + i + 1}
                </td>
                {/* KATEGORI */}
                <td style={{ padding: "14px 12px", color: "#222" }}>
                  {t.category || t.kategori || "-"}
                </td>
                {/* TANGGAL */}
                <td
                  style={{
                    padding: "14px 12px",
                    textAlign: "center",
                    color: "#475569",
                  }}
                >
                  {t.date
                    ? new Date(t.date).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </td>
                {/* DESKRIPSI */}
                <td
                  style={{
                    padding: "14px 12px",
                    color: "#475569",
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={t.description || "-"}
                >
                  {t.description && t.description.trim() !== ""
                    ? t.description
                    : "-"}
                </td>
                {/* JUMLAH */}
                <td
                  style={{
                    padding: "14px 12px",
                    textAlign: "right",
                    fontWeight: 700,
                    color: "#ef4444",
                    fontSize: 16,
                  }}
                >
                  Rp {Number(t.amount || t.jumlah).toLocaleString("id-ID")}
                </td>
                {/* AKSI */}
                {role === "pemilik usaha" && (
                  <td style={{ padding: "14px 12px", textAlign: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        onClick={() => handleEdit({ ...t })}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
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
                          padding: 4,
                        }}
                        title="Hapus"
                      >
                        <Trash2 size={18} color="#ef4444" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={role === "pemilik usaha" ? 6 : 5}
                  style={{ textAlign: "center", padding: 24, color: "#888" }}
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
            <div style={{ marginBottom: 16, fontWeight: 600, fontSize: 18 }}>
              Edit Pengeluaran
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label>
                Kategori
                <input
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
                    marginTop: 4,
                  }}
                />
              </label>
              <label>
                Jumlah (Rp)
                <input
                  name="amount"
                  type="text"
                  value={editModal.trx.amount || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setEditModal((m) => ({
                      ...m,
                      trx: { ...m.trx, amount: value },
                    }));
                  }}
                  required
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    marginTop: 4,
                  }}
                  placeholder="Masukkan jumlah pengeluaran"
                />
              </label>
              <label>
                Tanggal
                <input
                  name="date"
                  type="date"
                  value={
                    editModal.trx.date
                      ? new Date(editModal.trx.date).toISOString().slice(0, 10)
                      : ""
                  }
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      trx: { ...m.trx, date: e.target.value },
                    }))
                  }
                  required
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    marginTop: 4,
                  }}
                />
              </label>
              <label>
                Deskripsi
                <input
                  name="description"
                  value={editModal.trx.description || ""}
                  onChange={(e) =>
                    setEditModal((m) => ({
                      ...m,
                      trx: { ...m.trx, description: e.target.value },
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    marginTop: 4,
                  }}
                  placeholder="Deskripsi pengeluaran"
                />
              </label>
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
