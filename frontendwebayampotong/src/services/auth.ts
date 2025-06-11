import axios from "axios";

const API_URL = "http://localhost:3000/api/auth"; //seusaikan backend url

export const loginUser = async (username: string, password: string) => {
  const res = await axios.post(`${API_URL}/login`, {
    username,
    password,
  });

  return res.data; // { token, user }
};

export const logoutUser = () => {
  localStorage.removeItem("token");
};
