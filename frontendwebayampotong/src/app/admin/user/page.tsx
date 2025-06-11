"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "@/components/layout/Sidebar"; // pastikan path ini benar

type User = {
  user_id: number;
  username: string;
  password: string;
  role: string;
};

const defaultForm = { username: "", password: "", role: "karyawan" };

export default function UserAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const rowsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal/form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    username: string;
    password: string;
    role: string;
  }>(defaultForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Proteksi: hanya admin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      if (!token || !userStr) {
        window.location.href = "/login";
        return;
      }
      try {
        const user = JSON.parse(userStr);
        if (user.role !== "admin") {
          window.location.href = "/dashboard";
        }
      } catch {
        window.location.href = "/login";
      }
    }
  }, []);

  // Fetch user data
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get("http://localhost:3000/user", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Pagination logic
  const totalRows = users.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const paginated = users.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Handler form
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Tambah user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      await axios.post("http://localhost:3000/api/auth/register", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      setForm(defaultForm);
      fetchUsers();
      alert("User berhasil ditambahkan");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menambah user");
    }
    setFormLoading(false);
  };

  // Edit user
  const handleEditUser = (user: User) => {
    setEditId(user.user_id);
    setForm({ username: user.username, password: "", role: user.role });
    setShowForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      await axios.put(`http://localhost:3000/user/${editId}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
      fetchUsers();
      alert("User berhasil diupdate");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal update user");
    }
    setFormLoading(false);
  };

  // Hapus user
  const handleDeleteUser = async (id: number) => {
    if (!window.confirm("Yakin hapus user ini?")) return;
    try {
      const token = localStorage.getItem("token") || "";
      await axios.delete(`http://localhost:3000/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      alert("User berhasil dihapus");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal hapus user");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f8fa" }}>
      <Sidebar active="User" />
      <div style={{ flex: 1, padding: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 4,
            color: "#18181b",
          }}
        >
          Daftar User
        </h1>
        <div style={{ color: "#64748b", marginBottom: 28, fontSize: 16 }}>
          Kelola data user
        </div>
        {/* Tombol tambah user */}
        <button
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 28px",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 18,
          }}
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm(defaultForm);
          }}
        >
          + Tambah User
        </button>
        {/* Form tambah/edit user */}
        {showForm && (
          <form
            onSubmit={editId ? handleUpdateUser : handleAddUser}
            style={{
              background: "#fff",
              borderRadius: 14,
              boxShadow: "0 2px 8px #0001",
              padding: 32,
              marginBottom: 32,
              maxWidth: 420,
              marginTop: 0,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>
              {editId ? "Edit User" : "Tambah User"}
            </div>
            <label>
              Username
              <input
                name="username"
                value={form.username}
                onChange={handleFormChange}
                required
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  marginTop: 4,
                  fontSize: 16,
                }}
                autoComplete="off"
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleFormChange}
                required={!editId}
                placeholder={
                  editId ? "Kosongkan jika tidak ingin mengubah" : ""
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  marginTop: 4,
                  fontSize: 16,
                }}
                autoComplete="new-password"
              />
            </label>
            <label>
              Role
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  marginTop: 4,
                  fontSize: 16,
                }}
              >
                <option value="admin">Admin</option>
                <option value="karyawan">Karyawan</option>
                <option value="pemilik usaha">Pemilik Usaha</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                type="submit"
                disabled={formLoading}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: formLoading ? "not-allowed" : "pointer",
                }}
              >
                {formLoading
                  ? "Menyimpan..."
                  : editId
                  ? "Simpan Perubahan"
                  : "Tambah"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm(defaultForm);
                }}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 28px",
                  fontWeight: 500,
                  fontSize: 16,
                  cursor: "pointer",
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
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#94a3b8",
                    fontSize: 15,
                    letterSpacing: 0.5,
                    background: "#f8fafc",
                  }}
                >
                  USER ID
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
                  USERNAME
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
                  PASSWORD
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
                  ROLE
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
                    width: 120,
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
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "#64748b",
                    }}
                  >
                    Memuat...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 32,
                      color: "#64748b",
                    }}
                  >
                    Tidak ada data user.
                  </td>
                </tr>
              ) : (
                paginated.map((user, idx) => (
                  <tr
                    key={user.user_id}
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
                        padding: 16,
                        textAlign: "center",
                        color: "#18181b",
                        fontWeight: 600,
                        fontSize: 15,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {user.user_id}
                    </td>
                    <td
                      style={{
                        padding: 16,
                        color: "#18181b",
                        fontWeight: 700,
                        fontSize: 17,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      {user.username}
                    </td>
                    <td
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#64748b",
                        fontWeight: 500,
                        fontSize: 15,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                        fontFamily: "monospace",
                        letterSpacing: 1,
                        wordBreak: "break-all",
                      }}
                    >
                      {user.password}
                    </td>
                    <td
                      style={{
                        padding: 16,
                        textAlign: "center",
                        color: "#2563eb",
                        fontWeight: 700,
                        fontSize: 15,
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                        textTransform: "capitalize",
                      }}
                    >
                      {user.role}
                    </td>
                    <td
                      style={{
                        padding: 16,
                        textAlign: "center",
                        background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      }}
                    >
                      <button
                        style={{
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 16px",
                          fontWeight: 600,
                          fontSize: 15,
                          marginRight: 8,
                          cursor: "pointer",
                        }}
                        onClick={() => handleEditUser(user)}
                      >
                        Edit
                      </button>
                      <button
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "6px 16px",
                          fontWeight: 600,
                          fontSize: 15,
                          cursor: "pointer",
                        }}
                        onClick={() => handleDeleteUser(user.user_id)}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
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
              {totalRows} user
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
    </div>
  );
}
