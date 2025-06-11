import axios from "axios";

const API_URL = "http://localhost:3000";

export const getTotalExpense = async (token: string) => {
  const res = await axios.get(`${API_URL}/livestock`, {
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
