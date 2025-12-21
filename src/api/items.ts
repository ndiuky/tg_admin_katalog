import apiClient from "./client";
import type { Item } from "../types";

export const getItems = async () => {
  const response = await apiClient.get<Item[]>("/item");
  return response.data;
};

export const getItem = async (id: number) => {
  const response = await apiClient.get<Item>(`/item/${id}`);
  return response.data;
};

export const createItem = async (
  data: Omit<Item, "id" | "category" | "imageUrl">,
) => {
  const response = await apiClient.post<Item>("/item", data);
  return response.data;
};

export const updateItem = async (
  id: number,
  data: Omit<Item, "id" | "category" | "imageUrl">,
) => {
  const response = await apiClient.put<Item>(`/item/${id}`, data);
  return response.data;
};

export const uploadItemImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.patch<Item>(`/item/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteItem = async (id: number) => {
  const response = await apiClient.delete<{ success: boolean }>(`/item/${id}`);
  return response.data;
};
