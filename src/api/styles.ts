import apiClient from "./client";

export interface Style {
  id: number;
  title: string;
  titleAz: string;
  imageUrl?: string;
}

export const getStyles = async () => {
  const response = await apiClient.get<Style[]>("/style");
  return response.data;
};

export const getStyle = async (id: number) => {
  const response = await apiClient.get<Style>(`/style/${id}`);
  return response.data;
};

export const createStyle = async (data: Omit<Style, "id" | "imageUrl">) => {
  const response = await apiClient.post<Style>("/style", data);
  return response.data;
};

export const updateStyle = async (
  id: number,
  data: Omit<Style, "id" | "imageUrl">
) => {
  const response = await apiClient.put<Style>(`/style/${id}`, data);
  return response.data;
};

export const deleteStyle = async (id: number) => {
  const response = await apiClient.delete<boolean>(`/style/${id}`);
  return response.data;
};

export const uploadStyleImage = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  const response = await apiClient.patch<Style>(`/style/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
