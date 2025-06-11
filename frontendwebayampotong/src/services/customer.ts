import axios from "axios";

const API_URL = "http://localhost:3000";

export const getActiveCustomerCount = async (token: string) => {
  const res = await axios.get(`${API_URL}/customers`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // Asumsikan API mengembalikan array customer aktif
  return Array.isArray(res.data) ? res.data.length : 0;
};
