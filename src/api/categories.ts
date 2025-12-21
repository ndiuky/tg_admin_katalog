import apiClient from "./client";
import type { Category } from "../types";

export const getCategories = async () => {
  const response = await apiClient.get<Category[]>("/kategory");
  return response.data;
};

export const getCategory = async (id: number) => {
  const response = await apiClient.get<Category>(`/kategory/${id}`);
  return response.data;
};

export const createCategory = async (data: {
  title: string;
  titleAz: string;
}) => {
  const response = await apiClient.post<Category>("/kategory", data);
  return response.data;
};

export const updateCategory = async (
  id: number,
  data: { title: string; titleAz: string },
) => {
  const response = await apiClient.put<Category>(`/kategory/${id}`, data);
  return response.data;
};

export const uploadCategoryImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await apiClient.patch<Category>(
    `/kategory/${id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const deleteCategory = async (id: number) => {
  const response = await apiClient.delete<{ success: boolean }>(
    `/kategory/${id}`,
  );
  return response.data;
};
