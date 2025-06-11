import axios from "axios";

const API_URL = "http://localhost:3000";

export const getTotalExpense = async (token: string) => {
  const res = await axios.get(`${API_URL}/expense`, {
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

export async function createExpense(data: any, token: string) {
  const url = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL + "/expense"
    : "http://localhost:3000/expense";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Gagal menambah expense");
  return res.json();
}
