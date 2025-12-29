import apiClient from "./client";
import type { SocialLink } from "../types";

export const getSocialLinks = async () => {
  const response = await apiClient.get<SocialLink[]>("/social");
  return response.data;
};

export const getSocialLink = async (id: number) => {
  const response = await apiClient.get<SocialLink>(`/social/${id}`);
  return response.data;
};

export const createSocialLink = async (
  data: Omit<SocialLink, "id">,
) => {
  const response = await apiClient.post<SocialLink>("/social", data);
  return response.data;
};

export const updateSocialLink = async (
  id: number,
  data: Partial<Omit<SocialLink, "id">>,
) => {
  const response = await apiClient.patch<SocialLink>(`/social/${id}`, data);
  return response.data;
};

export const deleteSocialLink = async (id: number) => {
  const response = await apiClient.delete<{ success: boolean }>(
    `/social/${id}`,
  );
  return response.data;
};
