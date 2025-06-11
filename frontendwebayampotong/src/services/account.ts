import axios from "axios";

const API_URL = "http://localhost:3000/accounts";

export const getAccounts = async (token: string) => {
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
