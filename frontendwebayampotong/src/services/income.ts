import axios from "axios";

const API_URL = "http://localhost:3000";

export const getTotalIncome = async (token: string) => {
  const res = await axios.get(`${API_URL}/incomes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // Sum all amount fields
  const total = res.data.reduce(
    (sum: number, item: any) => sum + Number(item.amount),
    0
  );
  return total;
};

export const createIncome = async (data: any, token: string) => {
  // Hanya dipakai untuk pemasukan dari pembayaran hutang, JANGAN untuk Penjualan Non-Kredit!
  // console.log(data);
  const res = await axios.post(`${API_URL}/incomes`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
