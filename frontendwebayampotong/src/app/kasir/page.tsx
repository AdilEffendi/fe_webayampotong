"use client";

import React, { useState, useEffect, useRef } from "react";
import { getAccounts } from "@/services/account";
import { Calendar, Tag, User, FileText } from "lucide-react";
import { createDebtReceivable } from "@/services/debtreceivables"; // tambahkan ini
import { CheckCircle2, XCircle } from "lucide-react";

const kategoriOptions = [
  { value: "Penjualan", label: "Penjualan" },
  { value: "Pembayaran Hutang", label: "Pembayaran Hutang" },
  { value: "Pengeluaran", label: "Pengeluaran" },
];

const tipePembayaranOptions = [
  { value: "Non-Kredit", label: "Non-Kredit" },
  { value: "Kredit", label: "Kredit" },
];

export default function KasirPage() {
  // Proteksi halaman: redirect ke login jika tidak ada token
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
      }
    }
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    jumlah: "", // ini jadi harga per ekor
    tanggal: today,
    kategori: "Penjualan",
    deskripsi: "",
    user_id: "",
  });
  const [username, setUsername] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isExpense, setIsExpense] = useState(false); // State untuk deteksi pengeluaran
  const [stock, setStock] = useState<number>(0); // State stok ayam
  const [jumlahAyam, setJumlahAyam] = useState(""); // Input jumlah ayam dibeli
  const [debtCustomers, setDebtCustomers] = useState<any[]>([]); // pelanggan yang punya hutang
  const [selectedCustomerDebt, setSelectedCustomerDebt] = useState<
    number | null
  >(null);
  const [tipePembayaran, setTipePembayaran] = useState("Non-Kredit");
  const [searchPembeli, setSearchPembeli] = useState(""); // untuk pencarian pembeli
  const [showDropdown, setShowDropdown] = useState(false); // untuk kontrol dropdown custom
  const pembeliInputRef = useRef<HTMLInputElement>(null);

  // Tambahkan state untuk input harga berformat rupiah
  const [hargaInput, setHargaInput] = useState("");

  // State untuk modal notifikasi
  const [modal, setModal] = useState<{
    open: boolean;
    success: boolean;
    message: string;
  }>({
    open: false,
    success: true,
    message: "",
  });

  // Fungsi untuk menampilkan modal
  const showModal = (success: boolean, message: string) => {
    setModal({ open: true, success, message });
  };

  // Ambil harga ayam dari localStorage saat mount/kategori Penjualan
  useEffect(() => {
    if (form.kategori === "Penjualan") {
      if (typeof window !== "undefined") {
        const hargaAyam = localStorage.getItem("hargaAyamHariIni");
        if (hargaAyam && hargaAyam !== "") {
          // Format ke ribuan
          const formatted = hargaAyam.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
          setHargaInput(formatted);
          setForm((f) => {
            // Hanya set jika belum ada isian harga
            if (!f.jumlah || f.jumlah === "" || f.jumlah === "0") {
              return { ...f, jumlah: hargaAyam };
            }
            return f;
          });
        }
      }
    }
  }, [form.kategori]);

  useEffect(() => {
    // Ambil username dari localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUsername(user.username || "");
        setForm((f) => ({ ...f, user_id: user.username || "" }));
      } catch {}
    }

    // Ambil akun dari backend
    const fetchAccounts = async () => {
      const token = localStorage.getItem("token") || "";
      try {
        const data = await getAccounts(token);
        setAccounts(data);
        // Default akun ke "Aset (Harta)" jika kategori Penjualan (Pemasukan)
        setTimeout(() => {
          setAccounts((prev) => {
            // Cari akun dengan nama persis "Aset (Harta)" (case-insensitive)
            const aset = prev.find(
              (a: any) =>
                (a.account_name || "").toLowerCase() === "aset (harta)"
            );
            // Jika tidak ada, fallback ke account_type "aset (harta)" atau "aset" atau "harta"
            const fallback = prev.find(
              (a: any) =>
                (a.account_type || "").toLowerCase() === "aset (harta)" ||
                (a.account_type || "").toLowerCase() === "aset" ||
                (a.account_type || "").toLowerCase() === "harta"
            );
            // Hanya set jika kategori Penjualan (Pemasukan)
            if (form.kategori === "Penjualan" && (aset || fallback)) {
              setSelectedAccount((aset || fallback).account_id);
            }
            return prev;
          });
        }, 300);
      } catch {}
    };

    // Ambil data customer dari backend
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
        } else {
          console.error("Gagal fetch customer, status:", res.status);
        }
      } catch (err) {
        console.error("Error fetch customer:", err);
      }
    };

    // Ambil daftar pelanggan yang punya hutang
    const fetchDebtCustomers = async () => {
      const token = localStorage.getItem("token") || "";
      try {
        const url = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL + "/debt-receivables"
          : "http://localhost:3000/debt-receivables";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Ambil hanya customer_id unik yang hutangnya masih ada (misal sisa > 0)
          const customerIds = Array.from(
            new Set(
              (Array.isArray(data) ? data : [])
                .filter(
                  (d: any) =>
                    Number(d.remaining_debt || d.sisa || d.amount || 0) > 0
                )
                .map((d: any) => d.customer_id)
            )
          );
          // Filter dari daftar customers
          setDebtCustomers((prev) =>
            customers.filter((c) => customerIds.includes(c.customer_id))
          );
        }
      } catch (err) {
        console.error("Error fetch debt customers:", err);
      }
    };

    fetchAccounts();
    fetchCustomers();
    fetchStock();
    // fetchDebtCustomers akan dipanggil saat kategori berubah
  }, []);

  // Fetch debt customers setiap kali kategori berubah ke "Pembayaran Hutang" dan daftar customers sudah ada
  useEffect(() => {
    if (form.kategori === "Pembayaran Hutang" && customers.length > 0) {
      const fetchDebtCustomers = async () => {
        const token = localStorage.getItem("token") || "";
        try {
          const url = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL + "/debt-receivables"
            : "http://localhost:3000/debt-receivables";
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const customerIds = Array.from(
              new Set(
                (Array.isArray(data) ? data : [])
                  .filter(
                    (d: any) =>
                      Number(d.remaining_debt || d.sisa || d.amount || 0) > 0
                  )
                  .map((d: any) => d.customer_id)
              )
            );
            setDebtCustomers(
              customers.filter((c) => customerIds.includes(c.customer_id))
            );
          }
        } catch (err) {
          setDebtCustomers([]);
        }
      };
      fetchDebtCustomers();
    }
  }, [form.kategori, customers]);

  // Tambahkan agar bisa dipanggil ulang setelah submit
  const fetchStock = async () => {
    const token = localStorage.getItem("token") || "";
    try {
      const url = process.env.NEXT_PUBLIC_API_URL
        ? process.env.NEXT_PUBLIC_API_URL + "/livestock"
        : "http://localhost:3000/livestock";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const total = Array.isArray(data)
          ? data.reduce((sum, item) => sum + (item.quantity || 0), 0)
          : 0;
        setStock(total);
      }
    } catch (err) {
      console.error("Gagal fetch stok ayam:", err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "kategori") {
      setIsExpense(e.target.value === "Pengeluaran");
      if (e.target.value === "Penjualan") {
        const kas = accounts.find((a: any) => a.account_type === "Kas");
        if (kas) setSelectedAccount(kas.account_id);
      }
    }
  };

  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAccount(e.target.value);
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCustomer(e.target.value);
  };

  const handleJumlahAyamChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJumlahAyam(e.target.value);
  };

  const handleTipePembayaranChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setTipePembayaran(e.target.value);
  };

  // Handler untuk input harga dengan format rupiah
  const handleHargaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    let formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setHargaInput(formatted);
    setForm({ ...form, jumlah: val });
  };

  // Handler untuk input jumlah (kategori selain Penjualan) dengan format rupiah dan validasi max hutang
  const handleJumlahRupiahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    // Jika kategori Pembayaran Hutang, batasi max sesuai hutang
    if (
      form.kategori === "Pembayaran Hutang" &&
      selectedCustomerDebt !== null &&
      val !== ""
    ) {
      const max = Number(selectedCustomerDebt);
      if (Number(val) > max) {
        val = String(max);
      }
    }
    let formatted = val.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setHargaInput(formatted);
    setForm({ ...form, jumlah: val });
  };

  // Jika kategori berubah, reset hargaInput juga
  useEffect(() => {
    // Jika Penjualan, isi dari localStorage (sudah dihandle di atas)
    if (form.kategori !== "Penjualan") {
      setHargaInput("");
    }
  }, [form.kategori]);

  // Hitung total
  const totalHarga =
    form.kategori === "Penjualan" &&
    Number(form.jumlah) > 0 &&
    Number(jumlahAyam) > 0
      ? Number(form.jumlah) * Number(jumlahAyam)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      // Gabungkan tanggal dengan waktu saat submit
      let tanggalJam = form.tanggal;
      if (form.tanggal) {
        const now = new Date();
        const jam = now.getHours().toString().padStart(2, "0");
        const menit = now.getMinutes().toString().padStart(2, "0");
        tanggalJam = `${form.tanggal}T${jam}:${menit}:00`;
      }
      // Penjualan
      if (form.kategori === "Penjualan") {
        // Fungsi pengurangan stok ayam (bisa dipanggil di Non-Kredit & Kredit)
        const kurangiStokAyam = async () => {
          try {
            const token = localStorage.getItem("token") || "";
            const urlLivestock = process.env.NEXT_PUBLIC_API_URL
              ? process.env.NEXT_PUBLIC_API_URL + "/livestock"
              : "http://localhost:3000/livestock";
            const resLivestock = await fetch(urlLivestock, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const livestockData = await resLivestock.json();
            let sisa = Number(jumlahAyam);
            const sorted = Array.isArray(livestockData)
              ? [...livestockData].sort(
                  (a, b) =>
                    new Date(a.entry_date).getTime() -
                    new Date(b.entry_date).getTime()
                )
              : [];
            for (const item of sorted) {
              if (sisa <= 0) break;
              if ((item.quantity || 0) > 0) {
                const pengurangan = Math.min(item.quantity, sisa);
                const livestockId = item.livestock_id;
                if (!livestockId && livestockId !== 0) {
                  alert("ID livestock tidak ditemukan pada salah satu data!");
                  continue;
                }
                const urlUpdate = process.env.NEXT_PUBLIC_API_URL
                  ? `${process.env.NEXT_PUBLIC_API_URL}/livestock/${livestockId}`
                  : `http://localhost:3000/livestock/${livestockId}`;
                const resUpdate = await fetch(urlUpdate, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    quantity: item.quantity - pengurangan,
                    type: item.type,
                    entry_date: item.entry_date,
                    exit_date: item.exit_date,
                  }),
                });
                if (!resUpdate.ok) {
                  alert("Gagal mengurangi stok ayam pada id " + livestockId);
                  return false;
                }
                sisa -= pengurangan;
              }
            }
            if (sisa > 0) {
              alert("Stok ayam tidak cukup!");
              return false;
            }
            await fetchStock();
            return true;
          } catch (err) {
            alert("Gagal mengurangi stok ayam!");
            return false;
          }
        };

        if (tipePembayaran === "Non-Kredit") {
          const data = {
            amount: totalHarga,
            date: tanggalJam,
            type: "Income",
            category: form.kategori,
            description: form.deskripsi,
            user_id: form.user_id,
            account_id: selectedAccount,
            source: form.kategori,
            customer_id:
              selectedCustomer !== "" ? Number(selectedCustomer) : null,
            jumlah_ayam: Number(jumlahAyam),
            status: "non-kredit",
            tipe_pembayaran: "Non-Kredit",
          };
          // HANYA createTransaction, JANGAN createIncome!
          await import("@/services/transaction").then(({ createTransaction }) =>
            createTransaction(data, token)
          );
          // Kurangi stok ayam
          if (jumlahAyam) {
            const ok = await kurangiStokAyam();
            if (!ok) {
              showModal(
                false,
                "Stok ayam tidak cukup atau gagal mengurangi stok!"
              );
              return;
            }
          }
          setForm({
            jumlah: "",
            tanggal: "",
            kategori: "Penjualan",
            deskripsi: "",
            user_id: username,
          });
          setJumlahAyam("");
          setSelectedCustomer("");
          setTipePembayaran("Non-Kredit");
          showModal(true, "Pemasukan berhasil ditambahkan!");
        } else if (tipePembayaran === "Kredit") {
          // 1. Masukkan ke transaksi (Income/Transaksi)
          let transaction = null;
          try {
            const trxData = {
              amount: totalHarga,
              date: tanggalJam,
              type: "Income",
              category: form.kategori,
              description: form.deskripsi,
              user_id: form.user_id,
              account_id: selectedAccount,
              source: form.kategori,
              customer_id:
                selectedCustomer !== "" ? Number(selectedCustomer) : null,
              jumlah_ayam: Number(jumlahAyam),
              status: "kredit",
              tipe_pembayaran: "Kredit",
            };
            transaction = await import("@/services/transaction").then(
              ({ createTransaction }) => createTransaction(trxData, token)
            );
            // Kurangi stok ayam SETELAH transaksi berhasil
            if (jumlahAyam) {
              const ok = await kurangiStokAyam();
              if (!ok) {
                showModal(
                  false,
                  "Stok ayam tidak cukup atau gagal mengurangi stok!"
                );
                return;
              }
            }
          } catch (err) {
            showModal(
              false,
              "Gagal menambah transaksi penjualan kredit: " +
                (err instanceof Error ? err.message : String(err))
            );
            return;
          }
          // 2. Masukkan ke debt-receivables dengan transaction_id dari transaksi di atas
          const debtData = {
            transaction_id:
              transaction?.transaction_id || transaction?.id || null,
            customer_id:
              selectedCustomer !== "" ? Number(selectedCustomer) : null,
            type: "Kredit",
            amount: totalHarga,
            due_date: tanggalJam,
            status: "belum lunas",
          };
          if (!debtData.customer_id || !debtData.amount || !debtData.due_date) {
            showModal(false, "Data hutang tidak lengkap!");
            return;
          }
          try {
            await createDebtReceivable(debtData, token);
            setForm({
              jumlah: "",
              tanggal: "",
              kategori: "Penjualan",
              deskripsi: "",
              user_id: username,
            });
            setJumlahAyam("");
            setSelectedCustomer("");
            setTipePembayaran("Non-Kredit");
            showModal(
              true,
              "Penjualan kredit berhasil ditambahkan ke daftar hutang dan pemasukan!"
            );
          } catch (err: any) {
            showModal(
              false,
              "Gagal menambah hutang (debt receivable): " + (err?.message || "")
            );
          }
          return;
        }
      } else if (form.kategori === "Pengeluaran") {
        const data: any = {
          date: tanggalJam,
          type: "Expense",
          amount: Number(form.jumlah), // Pengeluaran pakai jumlah langsung
          description: form.deskripsi,
          user_id: form.user_id,
          account_id: selectedAccount,
          category: "Pengeluaran",
        };
        // HANYA createTransaction, JANGAN createExpense di frontend!
        await import("@/services/transaction").then(({ createTransaction }) =>
          createTransaction(data, token)
        );
        setForm({
          jumlah: "",
          tanggal: "",
          kategori: "Pengeluaran",
          deskripsi: "",
          user_id: username,
        });
        setSelectedCustomer("");
        showModal(true, "Pengeluaran berhasil ditambahkan!");
      } else if (form.kategori === "Pembayaran Hutang") {
        const data = {
          amount: Number(form.jumlah),
          date: tanggalJam,
          type: form.kategori,
          category: form.kategori,
          description: form.deskripsi,
          user_id: form.user_id,
          account_id: selectedAccount,
          source: form.kategori,
          customer_id:
            selectedCustomer !== "" ? Number(selectedCustomer) : null,
        };
        await import("@/services/income").then(({ createIncome }) =>
          createIncome(data, token)
        );
        // Update debt-receivables jika Pembayaran Hutang
        if (form.kategori === "Pembayaran Hutang" && selectedCustomer) {
          // Ambil data hutang customer
          const url = process.env.NEXT_PUBLIC_API_URL
            ? process.env.NEXT_PUBLIC_API_URL + "/debt-receivables"
            : "http://localhost:3000/debt-receivables";
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const dataHutang = await res.json();
            // Urutkan hutang customer by id ASC (atau tanggal ASC)
            const hutangList = (Array.isArray(dataHutang) ? dataHutang : [])
              .filter(
                (d: any) =>
                  String(d.customer_id) === String(selectedCustomer) &&
                  Number(d.amount || 0) > 0
              )
              .sort(
                (a: any, b: any) =>
                  (a.debt_receivables_id || 0) - (b.debt_receivables_id || 0)
              );
            let sisaBayar = Number(form.jumlah);
            for (const hutang of hutangList) {
              if (sisaBayar <= 0) break;
              const sisaHutang = Number(hutang.amount || 0);
              const bayar = Math.min(sisaBayar, sisaHutang);
              const newAmount = sisaHutang - bayar;
              // Update debt-receivable
              const urlUpdate = process.env.NEXT_PUBLIC_API_URL
                ? `${process.env.NEXT_PUBLIC_API_URL}/debt-receivables/${hutang.debt_receivables_id}`
                : `http://localhost:3000/debt-receivables/${hutang.debt_receivables_id}`;
              await fetch(urlUpdate, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  amount: newAmount,
                  status: newAmount <= 0 ? "lunas" : hutang.status,
                }),
              });
              sisaBayar -= bayar;
            }
          }
        }
        setForm({
          jumlah: "",
          tanggal: "",
          kategori: "Pembayaran Hutang",
          deskripsi: "",
          user_id: username,
        });
        setSelectedCustomer("");
        showModal(true, "Data berhasil disimpan!");
      }
    } catch (err) {
      showModal(false, "Gagal menambah pemasukan/pengeluaran");
    }
  };

  // Ambil hutang customer yang dipilih (khusus kategori Pembayaran Hutang)
  useEffect(() => {
    const fetchCustomerDebt = async () => {
      if (form.kategori !== "Pembayaran Hutang" || !selectedCustomer) {
        setSelectedCustomerDebt(null);
        return;
      }
      const token = localStorage.getItem("token") || "";
      try {
        const url = process.env.NEXT_PUBLIC_API_URL
          ? process.env.NEXT_PUBLIC_API_URL + "/debt-receivables"
          : "http://localhost:3000/debt-receivables";
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Cari hutang customer yang dipilih, ambil total sisa hutang
          const hutang = (Array.isArray(data) ? data : [])
            .filter(
              (d: any) => String(d.customer_id) === String(selectedCustomer)
            )
            .reduce(
              (sum: number, d: any) =>
                sum + Number(d.remaining_debt || d.sisa || d.amount || 0),
              0
            );
          setSelectedCustomerDebt(hutang > 0 ? hutang : 0);
          // Jika jumlah lebih dari hutang, set ke hutang
          if (
            form.kategori === "Pembayaran Hutang" &&
            form.jumlah &&
            Number(form.jumlah) > hutang
          ) {
            setForm((f) => ({ ...f, jumlah: String(hutang) }));
          }
        } else {
          setSelectedCustomerDebt(null);
        }
      } catch {
        setSelectedCustomerDebt(null);
      }
    };
    fetchCustomerDebt();
  }, [form.kategori, selectedCustomer]);

  // Batasi input jumlah maksimal hutang untuk Pembayaran Hutang
  const handleJumlahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (
      form.kategori === "Pembayaran Hutang" &&
      selectedCustomerDebt !== null
    ) {
      if (Number(val) > selectedCustomerDebt) {
        val = String(selectedCustomerDebt);
      }
    }
    setForm({ ...form, jumlah: val });
  };

  // Filter pembeli sesuai pencarian
  const filteredCustomers =
    form.kategori === "Pembayaran Hutang"
      ? debtCustomers.filter((cust: any) =>
          cust.name.toLowerCase().includes(searchPembeli.toLowerCase())
        )
      : customers.filter((cust: any) =>
          cust.name.toLowerCase().includes(searchPembeli.toLowerCase())
        );

  // Untuk handle klik luar dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pembeliInputRef.current &&
        !pembeliInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div
      style={{
        flex: 1,
        padding: 32,
        background: "#f3f4f6",
        minHeight: "100vh",
        position: "relative",
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
          {/* Animasi sederhana */}
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
          Kasir
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
        {/* Tampilkan stok ayam */}
        <div style={{ marginBottom: 16, fontWeight: 600, color: "#333" }}>
          Stok Ayam Tersedia: <span style={{ color: "#2563eb" }}>{stock}</span>
        </div>
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
            Masukkan Data
          </span>
        </div>
        <form
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            alignItems: "center",
          }}
          onSubmit={handleSubmit}
        >
          {/* Penjualan */}
          {form.kategori === "Penjualan" && (
            <>
              {/* Kategori */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Kategori</label>
                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
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
                  {kategoriOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tipe Pembayaran */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Tipe Pembayaran</label>
                <select
                  name="tipe_pembayaran"
                  value={tipePembayaran}
                  onChange={handleTipePembayaranChange}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  {tipePembayaranOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Harga per Ekor */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Harga (per ekor)</label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      color: "#888",
                      fontWeight: 600,
                      fontSize: 15,
                      zIndex: 2,
                    }}
                  >
                    Rp.
                  </span>
                  <input
                    name="jumlah"
                    type="text"
                    value={hargaInput}
                    onChange={handleHargaChange}
                    required
                    placeholder="Masukkan harga per ekor"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 38px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
              </div>
              {/* Jumlah Ayam Dibeli */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Jumlah Ayam Dibeli</label>
                <input
                  name="jumlah_ayam"
                  type="number"
                  min={1}
                  max={stock}
                  value={jumlahAyam}
                  onChange={handleJumlahAyamChange}
                  required
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
              {/* Tanggal */}
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
                    name="tanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={handleChange}
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
              {/* Penerima */}
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
                    value={form.user_id}
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
              {/* Pembeli (full width) */}
              <div
                style={{
                  gridColumn: "1/3",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: 500 }}>Pembeli</label>
                <div
                  ref={pembeliInputRef}
                  style={{ position: "relative", width: "100%" }}
                >
                  <input
                    type="text"
                    value={
                      selectedCustomer
                        ? customers.find(
                            (c: any) =>
                              String(c.customer_id) === String(selectedCustomer)
                          )?.name || ""
                        : searchPembeli
                    }
                    onChange={(e) => {
                      setSearchPembeli(e.target.value);
                      setSelectedCustomer("");
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Cari atau pilih pembeli"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 16px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                    autoComplete="off"
                    required
                    name="customer_id"
                  />
                  {showDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: 40,
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px #0001",
                        maxHeight: 180,
                        overflowY: "auto",
                        zIndex: 10,
                      }}
                    >
                      {customers.filter((cust: any) =>
                        cust.name
                          .toLowerCase()
                          .includes(searchPembeli.toLowerCase())
                      ).length > 0 ? (
                        customers
                          .filter((cust: any) =>
                            cust.name
                              .toLowerCase()
                              .includes(searchPembeli.toLowerCase())
                          )
                          .map((cust: any) => (
                            <div
                              key={cust.customer_id}
                              onClick={() => {
                                setSelectedCustomer(cust.customer_id);
                                setSearchPembeli(cust.name);
                                setShowDropdown(false);
                              }}
                              style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                background:
                                  String(selectedCustomer) ===
                                  String(cust.customer_id)
                                    ? "#f3f4f6"
                                    : "#fff",
                                fontWeight:
                                  String(selectedCustomer) ===
                                  String(cust.customer_id)
                                    ? 600
                                    : 400,
                              }}
                            >
                              {cust.name}
                            </div>
                          ))
                      ) : (
                        <div
                          style={{
                            padding: "10px 16px",
                            color: "#888",
                            fontStyle: "italic",
                          }}
                        >
                          Tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Deskripsi (full width) */}
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
                  <textarea
                    name="deskripsi"
                    value={form.deskripsi}
                    onChange={handleChange}
                    placeholder="Masukkan deskripsi"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      minHeight: 60,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
              {/* Total hanya untuk Penjualan */}
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
                  value={totalHarga.toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  })}
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
            </>
          )}

          {/* Pembayaran Hutang */}
          {form.kategori === "Pembayaran Hutang" && (
            <>
              {/* Kategori */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Kategori</label>
                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
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
                  {kategoriOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tanggal */}
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
                    name="tanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={handleChange}
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
              {/* Penerima */}
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
                    value={form.user_id}
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
              {/* Jumlah */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Jumlah</label>
                <input
                  name="jumlah"
                  type="text"
                  value={hargaInput}
                  onChange={handleJumlahRupiahChange}
                  required
                  placeholder="Masukkan jumlah"
                  min={1}
                  {...(form.kategori === "Pembayaran Hutang" &&
                  selectedCustomerDebt !== null
                    ? { max: selectedCustomerDebt }
                    : {})}
                  style={{
                    width: "100%",
                    padding: "8px 8px 8px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              {/* Pembeli (full width) */}
              <div
                style={{
                  gridColumn: "1/3",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  position: "relative",
                }}
              >
                <label style={{ fontWeight: 500 }}>Pembeli</label>
                <div
                  ref={pembeliInputRef}
                  style={{ position: "relative", width: "100%" }}
                >
                  <input
                    type="text"
                    value={
                      selectedCustomer
                        ? debtCustomers.find(
                            (c: any) =>
                              String(c.customer_id) === String(selectedCustomer)
                          )?.name || ""
                        : searchPembeli
                    }
                    onChange={(e) => {
                      setSearchPembeli(e.target.value);
                      setSelectedCustomer("");
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Cari atau pilih pembeli"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 16px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                    autoComplete="off"
                    required
                    name="customer_id"
                  />
                  {showDropdown && (
                    <div
                      style={{
                        position: "absolute",
                        top: 40,
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px #0001",
                        maxHeight: 180,
                        overflowY: "auto",
                        zIndex: 10,
                      }}
                    >
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((cust: any) => (
                          <div
                            key={cust.customer_id}
                            onClick={() => {
                              setSelectedCustomer(cust.customer_id);
                              setSearchPembeli(cust.name);
                              setShowDropdown(false);
                            }}
                            style={{
                              padding: "10px 16px",
                              cursor: "pointer",
                              background:
                                String(selectedCustomer) ===
                                String(cust.customer_id)
                                  ? "#f3f4f6"
                                  : "#fff",
                              fontWeight:
                                String(selectedCustomer) ===
                                String(cust.customer_id)
                                  ? 600
                                  : 400,
                            }}
                          >
                            {cust.name}
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: "10px 16px",
                            color: "#888",
                            fontStyle: "italic",
                          }}
                        >
                          Tidak ditemukan
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Deskripsi (full width) */}
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
                  <textarea
                    name="deskripsi"
                    value={form.deskripsi}
                    onChange={handleChange}
                    placeholder="Masukkan deskripsi"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      minHeight: 60,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
              {/* Total hutang customer */}
              {selectedCustomer && selectedCustomerDebt !== null && (
                <div
                  style={{
                    gridColumn: "1/3",
                    marginTop: 0,
                    marginBottom: 8,
                    fontWeight: 600,
                    color: "#ef4444",
                    fontSize: 16,
                    background: "#fef2f2",
                    borderRadius: 8,
                    padding: "10px 16px",
                    border: "1px solid #fecaca",
                  }}
                >
                  Total Hutang: Rp{" "}
                  {selectedCustomerDebt.toLocaleString("id-ID")}
                </div>
              )}
            </>
          )}

          {/* Pengeluaran */}
          {form.kategori === "Pengeluaran" && (
            <>
              {/* Kategori */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Kategori</label>
                <select
                  name="kategori"
                  value={form.kategori}
                  onChange={handleChange}
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
                  {kategoriOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tanggal */}
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
                    name="tanggal"
                    type="date"
                    value={form.tanggal}
                    onChange={handleChange}
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
              {/* Pemberi */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Pemberi</label>
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
                    value={form.user_id}
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
              {/* Jumlah */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontWeight: 500 }}>Jumlah</label>
                <input
                  name="jumlah"
                  type="text"
                  value={hargaInput}
                  onChange={handleJumlahRupiahChange}
                  required
                  placeholder="Masukkan jumlah"
                  min={1}
                  style={{
                    width: "100%",
                    padding: "8px 8px 8px 16px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
              {/* Deskripsi (full width) */}
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
                  <textarea
                    name="deskripsi"
                    value={form.deskripsi}
                    onChange={handleChange}
                    placeholder="Masukkan deskripsi"
                    style={{
                      width: "100%",
                      padding: "8px 8px 8px 36px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "#f9fafb",
                      minHeight: 60,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
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
              cursor: "pointer",
            }}
          >
            Simpan
          </button>
        </form>
        {/* Jika ada tampilan tanggal (misal preview/summary), gunakan:
        <span>
          {form.tanggal
            ? (() => {
                const d = new Date(form.tanggal);
                const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
                const tanggal = d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                const jam = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                return `${tanggal}, ${hari} ${jam}`;
              })()
            : ""}
        </span> */}
      </div>
    </div>
  );
}
