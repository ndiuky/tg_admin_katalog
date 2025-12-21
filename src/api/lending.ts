import apiClient from "./client";
import type { Lending } from "../types";

export const getLendingContent = async () => {
  const response = await apiClient.get<Lending[]>("/lending");
  return response.data;
};

export const getLendingItem = async (id: number) => {
  const response = await apiClient.get<Lending>(`/lending/${id}`);
  return response.data;
};

export const createLendingItem = async (data: Omit<Lending, "id">) => {
  const response = await apiClient.post<Lending>("/lending", data);
  return response.data;
};

export const updateLendingItem = async (
  id: number,
  data: Omit<Lending, "id">,
) => {
  const response = await apiClient.patch<Lending>(`/lending/${id}`, data);
  return response.data;
};

export const deleteLendingItem = async (id: number) => {
  const response = await apiClient.delete<{ success: boolean }>(
    `/lending/${id}`,
  );
  return response.data;
};
