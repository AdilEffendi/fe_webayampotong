"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  User,
  Phone,
  MapPin,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const getAllCustomers = async (token: string) => {
  const res = await fetch("http://localhost:3000/customers", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal fetch pelanggan");
  return await res.json();
};

export default function PelangganPage() {
  // Proteksi halaman: redirect ke login jika tidak ada token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  const [pelanggan, setPelanggan] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [role, setRole] = useState("");
  const rowsPerPage = 5; // tampilkan 5 per halaman
  const [editModal, setEditModal] = useState<{ open: boolean; data?: any }>({
    open: false,
  });
  // State untuk form tambah pelanggan
  const [form, setForm] = useState({ name: "", contact: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

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
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const data = await getAllCustomers(token);
        setPelanggan(data);
      } catch {
        setPelanggan([]);
      }
    };
    fetchData();

    // Ambil role dari localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.role || "");
      } catch {}
    }
  }, []);

  // Filter pencarian
  const filtered = pelanggan.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.contact?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  });

  // Pagination logic (pakai filtered)
  const totalRows = filtered.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handler aksi
  const handleEdit = (data: any) => {
    setEditModal({ open: true, data });
  };
  const handleEditClose = () => setEditModal({ open: false });

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.data) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `http://localhost:3000/customers/${editModal.data.customer_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editModal.data),
        }
      );
      if (!res.ok) throw new Error("Gagal update pelanggan");
      setEditModal({ open: false });
      // Refresh data
      const data = await getAllCustomers(token);
      setPelanggan(data);
      showModal(true, "Pelanggan berhasil diupdate!");
    } catch {
      showModal(false, "Gagal update pelanggan");
    }
  };

  const handleDelete = async (data: any) => {
    showConfirm("Yakin hapus pelanggan ini?", async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `http://localhost:3000/customers/${data.customer_id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Gagal hapus pelanggan");
        // Refresh data
        const newData = await getAllCustomers(token);
        setPelanggan(newData);
        showModal(true, "Pelanggan berhasil dihapus!");
      } catch {
        showModal(false, "Gagal menghapus pelanggan");
      }
    });
  };

  // Handler tambah pelanggan
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("http://localhost:3000/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal tambah pelanggan");
      setForm({ name: "", contact: "", address: "" });
      // Refresh data
      const data = await getAllCustomers(token);
      setPelanggan(data);
      showModal(true, "Pelanggan berhasil ditambahkan!");
    } catch {
      showModal(false, "Gagal menambah pelanggan");
    }
    setLoading(false);
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#111",
              margin: 0,
            }}
          >
            Daftar Pelanggan
          </h1>
          <div
            style={{
              color: "#64748b",
              fontSize: 16,
              marginTop: 4,
            }}
          >
            Kelola data pelanggan Anda dengan mudah
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: "#2046D6",
            color: "#fff",
            border: "none",
            borderRadius: 16,
            padding: "12px 28px",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 4px 12px #2046d622",
            display: showForm ? "none" : "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontSize: 22,
              lineHeight: 0,
              marginRight: 6,
            }}
          >
            +
          </span>{" "}
          Tambah Pelanggan
        </button>
      </div>
      {/* Input Pencarian */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          margin: "24px 0 24px 0",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 1px 4px #0001",
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            height: 52,
          }}
        >
          <svg
            width={22}
            height={22}
            fill="none"
            stroke="#64748b"
            strokeWidth={2}
            style={{ marginRight: 8 }}
          >
            <circle cx="10" cy="10" r="7" />
            <line x1="16" y1="16" x2="21" y2="21" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari pelanggan berdasarkan nama, kontak, atau alamat…"
            style={{
              border: "none",
              outline: "none",
              fontSize: 17,
              width: "100%",
              background: "transparent",
              color: "#222",
            }}
          />
        </div>
      </div>
      {/* Form Tambah Pelanggan */}
      {showForm && (
        <form
          onSubmit={handleFormSubmit}
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 2px 16px #0001",
            padding: 32,
            marginBottom: 32,
            marginTop: 0,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 22,
                color: "#222",
              }}
            >
              Tambah Pelanggan Baru
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: "none",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              title="Tutup"
            >
              <X size={26} color="#64748b" />
            </button>
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#222",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <User size={18} /> Nama Pelanggan
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
                placeholder="Masukkan nama pelanggan"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 16,
                  background: "#f8fafc",
                  marginBottom: 0,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#222",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Phone size={18} /> Kontak
              </label>
              <input
                name="contact"
                value={form.contact}
                onChange={handleFormChange}
                placeholder="Masukkan nomor kontak"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 16,
                  background: "#f8fafc",
                  marginBottom: 0,
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#222",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <MapPin size={18} /> Alamat
              </label>
              <input
                name="address"
                value={form.address}
                onChange={handleFormChange}
                placeholder="Masukkan alamat"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1.5px solid #e5e7eb",
                  fontSize: 16,
                  background: "#f8fafc",
                  marginBottom: 0,
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 38px",
                fontWeight: 700,
                fontSize: 18,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px #22c55e22",
              }}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                background: "#6b7280",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 38px",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "0 2px 8px #6b728022",
              }}
            >
              Batal
            </button>
          </div>
        </form>
      )}
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
            <tr style={{ background: "#f7fafd" }}>
              <th
                style={{
                  padding: "18px 0",
                  textAlign: "center",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                  width: 60,
                  borderTopLeftRadius: 16,
                }}
              >
                NO
              </th>
              <th
                style={{
                  padding: "18px 0",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                NAMA PELANGGAN
              </th>
              <th
                style={{
                  padding: "18px 0",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                KONTAK
              </th>
              <th
                style={{
                  padding: "18px 0",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#64748b",
                  fontSize: 15,
                }}
              >
                ALAMAT
              </th>
              {role === "pemilik usaha" && (
                <th
                  style={{
                    padding: "18px 0",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#64748b",
                    fontSize: 15,
                    width: 80,
                    borderTopRightRadius: 16,
                  }}
                >
                  AKSI
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginated.map((p, i) => {
              const idx = (currentPage - 1) * rowsPerPage + i + 1;
              const initial = (p.name || "?").trim().charAt(0).toUpperCase();
              return (
                <tr
                  key={p.customer_id}
                  style={{
                    background: "#fff",
                    borderBottom: "1px solid #f1f5f9",
                    transition: "background 0.2s",
                  }}
                >
                  {/* NO */}
                  <td
                    style={{
                      padding: 16,
                      textAlign: "center",
                      color: "#64748b",
                      fontWeight: 700,
                      fontSize: 16,
                      background: "#fff",
                    }}
                  >
                    {idx}
                  </td>
                  {/* NAMA PELANGGAN */}
                  <td style={{ padding: "18px 0" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 14 }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 22,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 17,
                            color: "#222",
                          }}
                        >
                          {p.name || "-"}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* KONTAK */}
                  <td
                    style={{ padding: "18px 0", color: "#222", fontSize: 16 }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Phone size={18} color="#64748b" />
                      <span>{p.contact || "-"}</span>
                    </div>
                  </td>
                  {/* ALAMAT */}
                  <td
                    style={{ padding: "18px 0", color: "#222", fontSize: 16 }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <MapPin size={18} color="#64748b" />
                      <span>{p.address || "-"}</span>
                    </div>
                  </td>
                  {/* AKSI */}
                  {role === "pemilik usaha" && (
                    <td style={{ padding: "18px 0", textAlign: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => handleEdit({ ...p })}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 6,
                            borderRadius: 8,
                            transition: "background 0.2s",
                          }}
                          title="Edit"
                        >
                          <Pencil size={22} color="#2563eb" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 6,
                            borderRadius: 8,
                            transition: "background 0.2s",
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={22} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={role === "pemilik usaha" ? 5 : 4}
                  style={{
                    textAlign: "center",
                    padding: 32,
                    color: "#888",
                    fontSize: 17,
                  }}
                >
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Footer info & Pagination */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "18px 24px",
            fontSize: 15,
            color: "#64748b",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            background: "#f7fafd",
          }}
        >
          <div style={{ marginBottom: 10 }}>
            Menampilkan{" "}
            {totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            {" - "}
            {Math.min(currentPage * rowsPerPage, totalRows)}
            {" dari "}
            {totalRows} pelanggan
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
              borderRadius: 12,
              padding: 32,
              minWidth: 340,
              boxShadow: "0 4px 24px #0003",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 400,
              width: "100%",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
              Edit Pelanggan
            </h2>
            <label>
              Nama Pelanggan
              <input
                value={editModal.data.name || ""}
                onChange={(e) =>
                  setEditModal((m) => ({
                    ...m,
                    data: { ...m.data, name: e.target.value },
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
              Kontak
              <input
                value={editModal.data.contact || ""}
                onChange={(e) =>
                  setEditModal((m) => ({
                    ...m,
                    data: { ...m.data, contact: e.target.value },
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
              Alamat
              <input
                value={editModal.data.address || ""}
                onChange={(e) =>
                  setEditModal((m) => ({
                    ...m,
                    data: { ...m.data, address: e.target.value },
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
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
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
