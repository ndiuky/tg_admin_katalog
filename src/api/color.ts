import apiClient from "./client";

interface ColorDto {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface Color extends ColorDto {
  id: number;
}

export const getSettings = async (): Promise<Color> => {
  const response = await apiClient.get<Color>("/color");
  return response.data;
};

export const updateSettings = async (
  id: number,
  data: ColorDto
): Promise<Color> => {
  const response = await apiClient.put<Color>(`/color/${id}`, data);
  return response.data;
};
