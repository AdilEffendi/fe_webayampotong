"use client";
import {
  Home,
  DollarSign,
  Users,
  BarChart3,
  ShoppingCart,
  ChevronDown,
  Package,
  Layers,
  FileMinus,
  Menu,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

// Struktur menu baru
const menuSections = [
  {
    label: null,
    items: [{ id: 1, title: "Dashboard", icon: Home, href: "/dashboard" }],
  },
  {
    label: "Menu Utama",
    items: [
      { id: 8, title: "Kasir", icon: ShoppingCart, href: "/kasir" },
      { id: 5, title: "Prediksi", icon: BarChart3, href: "/prediksi" },
    ],
  },
  {
    label: "Laporan Transaksi",
    items: [
      {
        id: 2,
        title: "Transaksi",
        icon: DollarSign,
        children: [
          { id: "2-1", title: "Pemasukan", href: "/transaksi/pemasukan" },
          { id: "2-2", title: "Pengeluaran", href: "/transaksi/pengeluaran" },
          { id: "2-3", title: "Hutang Pelanggan", href: "/hutang" },
          { id: "2-4", title: "Hutang Usaha", href: "/hutang-usaha" }, // Pindahkan ke sini
        ],
      },
    ],
  },
  {
    label: "Manajemen Usaha",
    items: [
      { id: 6, title: "Pelanggan", icon: Users, href: "/pelanggan" },
      {
        id: 9,
        title: "Pembelian Stok",
        icon: Package,
        href: "/pembelian-ayam",
      },
      { id: 10, title: "Stok Ayam", icon: Layers, href: "/stok" },
      // Hapus Hutang Usaha dari sini
      // { id: 11, title: "Hutang Usaha", icon: FileMinus, href: "/hutang-usaha" },
    ],
  },
];

export default function Sidebar({ active }: { active?: string }) {
  const [transaksiOpen, setTransaksiOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Ganti: jangan gunakan window pada render
  const [currentActive, setCurrentActive] = useState(active);

  useEffect(() => {
    // Set active menu di client setelah mount
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.startsWith("/dashboard")) setCurrentActive("Dashboard");
      else if (path.startsWith("/kasir")) setCurrentActive("Kasir");
      else if (path.startsWith("/laporan")) setCurrentActive("Prediksi");
      else if (path.startsWith("/transaksi")) setCurrentActive("Transaksi");
      else if (path.startsWith("/pelanggan")) setCurrentActive("Pelanggan");
      else if (path.startsWith("/pembelian-stok"))
        setCurrentActive("Pembelian Stok");
      else if (path.startsWith("/stok-ayam")) setCurrentActive("Stok Ayam");
      else if (path.startsWith("/hutang-usaha"))
        setCurrentActive("Hutang Usaha");
      else if (path.startsWith("/pengaturan")) setCurrentActive("Pengaturan");
    }
  }, []);

  // Optional: close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        transaksiOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setTransaksiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [transaksiOpen]);

  // Tutup sidebar jika klik di luar pada mobile
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Perbaikan: pastikan klik pada hamburger tidak menutup sidebar
      const hamburger = document.querySelector(".sidebar-hamburger");
      if (
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node) &&
        !(hamburger && hamburger.contains(e.target as Node))
      ) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sidebarOpen]);

  // --- Tambah: Logout handler ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // --- Tambah: Idle timeout 1 jam (3600000 ms) ---
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 3600000); // 1 jam
    };

    // Event yang dianggap aktivitas user
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  // --- Tambah: deteksi role admin dari localStorage ---
  const [isAdmin, setIsAdmin] = useState(false);

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

  // --- Menu khusus admin ---
  const adminMenuSections = [
    {
      label: "Manajemen User",
      items: [
        {
          id: 100,
          title: "User",
          icon: Users,
          href: "/admin/user", // sesuaikan dengan route manajemen user Anda
        },
      ],
    },
  ];

  // Tombol hamburger untuk mobile
  const Hamburger = (
    <button
      className="sidebar-hamburger"
      style={{
        display: "none",
        position: "fixed",
        top: 18,
        left: 18,
        zIndex: 1201,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px #0001",
        cursor: "pointer",
      }}
      onClick={() => setSidebarOpen(true)}
      aria-label="Buka menu"
    >
      <Menu size={28} color="#2563eb" />
    </button>
  );

  return (
    <>
      {Hamburger}
      <aside
        ref={sidebarRef}
        className={`sidebar-main${sidebarOpen ? " sidebar-open" : ""}`}
        style={{
          width: 240,
          background: "#f8fafc",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "100vh",
          boxShadow: "2px 0 12px 0 rgba(0,0,0,0.04)",
          transition: "box-shadow 0.3s, transform 0.3s",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1200,
          // Tambahkan transform agar sidebar bisa keluar/masuk di mobile
          transform: sidebarOpen ? "translateX(0)" : "translateX(-110%)",
        }}
      >
        {/* Tombol close di mobile */}
        <button
          className="sidebar-close"
          style={{
            display: "none",
            position: "absolute",
            top: 16,
            right: 16,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px #0001",
            cursor: "pointer",
            zIndex: 1202,
          }}
          onClick={(e) => {
            e.stopPropagation();
            setSidebarOpen(false);
          }}
          aria-label="Tutup menu"
        >
          <span
            style={{
              display: "block",
              width: 20,
              height: 3,
              background: "#ef4444",
              borderRadius: 2,
              transform: "rotate(45deg) translate(3px, 3px)",
              position: "absolute",
              left: 8,
              top: 16,
            }}
          />
          <span
            style={{
              display: "block",
              width: 20,
              height: 3,
              background: "#ef4444",
              borderRadius: 2,
              transform: "rotate(-45deg) translate(3px, -3px)",
              position: "absolute",
              left: 8,
              top: 16,
            }}
          />
        </button>
        <div>
          <div
            style={{
              padding: "24px 24px 20px 24px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>
              Ayam Potong Eva
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: 13,
                margin: 0,
                marginTop: 4,
              }}
            >
              Sistem Manajemen Keuangan
            </p>
          </div>
          <nav style={{ marginTop: 18 }}>
            {/* --- Tampilkan menu admin jika admin login --- */}
            {isAdmin
              ? adminMenuSections.map((section, idx) => (
                  <React.Fragment key={idx}>
                    {section.label && (
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: 13,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          padding: "16px 24px 6px 24px",
                        }}
                      >
                        {section.label}
                      </div>
                    )}
                    {section.items.map((item) => (
                      <a
                        key={item.id}
                        href={item.href}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          width: "100%",
                          padding: "12px 24px",
                          background:
                            active === item.title ? "#e0e7ef" : "transparent",
                          border: "none",
                          borderLeft:
                            active === item.title
                              ? "4px solid #2563eb"
                              : "4px solid transparent",
                          color: active === item.title ? "#1e293b" : "#64748b",
                          fontWeight: active === item.title ? 700 : 500,
                          fontSize: 16,
                          cursor: "pointer",
                          gap: 14,
                          outline: "none",
                          textDecoration: "none",
                          transition:
                            "background 0.2s, color 0.2s, border-left 0.2s",
                          marginBottom: 2,
                          borderRadius: "0 20px 20px 0",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#e0e7ef";
                          e.currentTarget.style.color = "#1e293b";
                          e.currentTarget.style.borderLeft =
                            "4px solid #2563eb";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            active === item.title ? "#e0e7ef" : "transparent";
                          e.currentTarget.style.color =
                            active === item.title ? "#1e293b" : "#64748b";
                          e.currentTarget.style.borderLeft =
                            active === item.title
                              ? "4px solid #2563eb"
                              : "4px solid transparent";
                        }}
                      >
                        <item.icon size={20} style={{ marginRight: 12 }} />
                        {item.title}
                      </a>
                    ))}
                  </React.Fragment>
                ))
              : menuSections.map((section, idx) => (
                  <React.Fragment key={idx}>
                    {section.label && (
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: 13,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          padding: "16px 24px 6px 24px", // 3. padding lebih rapi
                        }}
                      >
                        {section.label}
                      </div>
                    )}
                    {section.items.map((item) =>
                      item.title === "Transaksi" ? (
                        <div key={item.id} ref={dropdownRef}>
                          <button
                            type="button"
                            onClick={() => setTransaksiOpen((v) => !v)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "100%",
                              padding: "12px 24px",
                              background: transaksiOpen
                                ? "#e0e7ef"
                                : "transparent", // 2. highlight lebih jelas
                              border: "none",
                              borderLeft: transaksiOpen
                                ? "4px solid #2563eb"
                                : "4px solid transparent", // 2. border kiri
                              color: transaksiOpen ? "#1e293b" : "#64748b",
                              fontWeight: transaksiOpen ? 700 : 500,
                              fontSize: 16,
                              cursor: "pointer",
                              gap: 14,
                              outline: "none",
                              textDecoration: "none",
                              transition:
                                "background 0.2s, color 0.2s, border-left 0.2s",
                              marginBottom: 2, // 3. jarak antar item
                              borderRadius: "0 20px 20px 0", // 3. sudut lebih lembut
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#e0e7ef")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = transaksiOpen
                                ? "#e0e7ef"
                                : "transparent")
                            }
                          >
                            <item.icon size={20} style={{ marginRight: 12 }} />
                            {item.title}
                            <ChevronDown
                              size={18}
                              style={{
                                marginLeft: "auto",
                                transition:
                                  "transform 0.4s cubic-bezier(.4,0,.2,1)",
                                transform: transaksiOpen
                                  ? "rotate(180deg)"
                                  : "none",
                              }}
                            />
                          </button>
                          <div
                            style={{
                              marginLeft: 36,
                              maxHeight: transaksiOpen ? 500 : 0,
                              opacity: transaksiOpen ? 1 : 0,
                              overflow: "hidden",
                              transition:
                                "max-height 0.5s cubic-bezier(.4,0,.2,1), opacity 0.3s cubic-bezier(.4,0,.2,1)", // 6. transisi lebih halus
                              pointerEvents: transaksiOpen ? "auto" : "none",
                            }}
                          >
                            {item.children?.map((child) => (
                              <a
                                key={child.id}
                                href={child.href}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "8px 0 8px 8px",
                                  color: "#64748b",
                                  fontWeight: 500,
                                  fontSize: 15,
                                  cursor: "pointer",
                                  textDecoration: "none",
                                  border: "none",
                                  background: "none",
                                  borderLeft: "2px solid transparent",
                                  borderRadius: "0 16px 16px 0",
                                  marginBottom: 2,
                                  transition:
                                    "color 0.2s, background 0.2s, border-left 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f1f5f9";
                                  e.currentTarget.style.color = "#1e293b";
                                  e.currentTarget.style.borderLeft =
                                    "2px solid #2563eb";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "none";
                                  e.currentTarget.style.color = "#64748b";
                                  e.currentTarget.style.borderLeft =
                                    "2px solid transparent";
                                }}
                              >
                                {child.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <a
                          key={item.id}
                          href={item.href}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            width: "100%",
                            padding: "12px 24px",
                            background:
                              currentActive === item.title
                                ? "#e0e7ef"
                                : "transparent", // 2. highlight lebih jelas
                            border: "none",
                            borderLeft:
                              currentActive === item.title
                                ? "4px solid #2563eb"
                                : "4px solid transparent", // 2. border kiri
                            color:
                              currentActive === item.title
                                ? "#1e293b"
                                : "#64748b",
                            fontWeight:
                              currentActive === item.title ? 700 : 500,
                            fontSize: 16,
                            cursor: "pointer",
                            gap: 14,
                            outline: "none",
                            textDecoration: "none",
                            transition:
                              "background 0.2s, color 0.2s, border-left 0.2s",
                            marginBottom: 2, // 3. jarak antar item
                            borderRadius: "0 20px 20px 0", // 3. sudut lebih lembut
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#e0e7ef";
                            e.currentTarget.style.color = "#1e293b";
                            e.currentTarget.style.borderLeft =
                              "4px solid #2563eb";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              currentActive === item.title
                                ? "#e0e7ef"
                                : "transparent";
                            e.currentTarget.style.color =
                              currentActive === item.title
                                ? "#1e293b"
                                : "#64748b";
                            e.currentTarget.style.borderLeft =
                              currentActive === item.title
                                ? "4px solid #2563eb"
                                : "4px solid transparent";
                          }}
                        >
                          <item.icon size={20} style={{ marginRight: 12 }} />
                          {item.title}
                        </a>
                      )
                    )}
                  </React.Fragment>
                ))}
          </nav>
          {/* Logout button pindah ke sini */}
          <div style={{ padding: "32px 24px 0 24px" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#ef4444",
                background: "none",
                border: "none",
                fontWeight: 500,
                fontSize: 16,
                cursor: "pointer",
                marginTop: 24, // jarak atas
              }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
      {/* Overlay untuk mobile */}
      <div
        className="sidebar-overlay"
        style={{
          display: sidebarOpen ? "block" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.18)",
          zIndex: 1199,
          transition: "opacity 0.3s",
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
        }}
        onClick={() => setSidebarOpen(false)}
      />
      <style>
        {`
        @media (max-width: 900px) {
          .sidebar-main {
            position: fixed !important;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 1200;
            width: 240px !important;
            transform: translateX(-110%);
            transition: transform 0.3s cubic-bezier(.4,0,.2,1);
            box-shadow: 2px 0 12px 0 rgba(0,0,0,0.08);
          }
          .sidebar-main.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-hamburger {
            display: flex !important;
          }
          .sidebar-close {
            display: flex !important;
          }
          .sidebar-overlay {
            display: block !important;
          }
        }
        @media (min-width: 901px) {
          .sidebar-hamburger, .sidebar-close, .sidebar-overlay {
            display: none !important;
          }
          .sidebar-main {
            position: static !important;
            transform: none !important;
            z-index: 1 !important;
          }
        }
        `}
      </style>
    </>
  );
}
