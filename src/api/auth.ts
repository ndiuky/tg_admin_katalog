import apiClient from "./client";
import axios from "axios";
import type { AuthResponse } from "../types";
import { API_BASE_URL } from "../const";

export const refresh = async (refreshToken: string) => {
  const response = await axios.post<AuthResponse>(
    `${API_BASE_URL}/auth/token`,
    { refreshToken }
  );
  return response.data;
};

export const login = async (credentials: {
  username: string;
  password: string;
}) => {
  const response = await apiClient.post<AuthResponse>(
    "/auth/login",
    credentials
  );
  return response.data;
};

export const register = async (credentials: {
  username: string;
  password: string;
}) => {
  const response = await apiClient.post<AuthResponse>(
    "/auth/register",
    credentials
  );
  return response.data;
};
