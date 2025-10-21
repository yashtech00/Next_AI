import { AuthType } from "@/types/AuthType";
import axios from "axios";




export const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export default  axiosInstance.interceptors.request.use((config => {
  // You can add authorization headers or other custom headers here
  // For example, if you have a token stored in localStorage:
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}));

export const Register = async (formData: AuthType) => {
  try {
    const response = await axiosInstance.post("/auth/register", formData);
    return response.data;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};


