import axios from "axios";

const API_URL = "http://localhost:3000";

export const getTotalBalance = async (token: string) => {
  const res = await axios.get(`${API_URL}/balance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // Asumsikan API mengembalikan { balance: number }
  return res.data.balance || 0;
};

// Fungsi baru: getBalanceSummary
export const getBalanceSummary = async (
  token: string,
  mode: "day" | "week" | "month",
  date: string
) => {
  const res = await axios.get(`${API_URL}/balance/summary`, {
    params: { mode, date },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
