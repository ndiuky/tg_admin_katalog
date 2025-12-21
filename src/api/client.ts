import axios from "axios";
import { useAuthStore } from "../stores/auth";
import router from "../router"; // We will create this later
import { API_BASE_URL } from "../const";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const authStore = useAuthStore();

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (authStore.refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/token`,
            {
              refreshToken: authStore.refreshToken,
            },
            {
              headers: {
                Authorization: `Bearer ${authStore.accessToken}`, // The TZ says Authorization: Bearer {accessToken} for refresh endpoint too?
                // Wait, if access token is expired, sending it might be useless or required.
                // TZ: "Authorization: Bearer {accessToken}" is listed for /auth/token.
                // This is unusual for a refresh endpoint (usually it doesn't need the expired access token, or it ignores it).
                // But I must follow TZ.
              },
            }
          );

          const { accessToken, refreshToken } = response.data;

          // Update tokens
          // Note: TZ says response has accessToken and refreshToken.
          // It doesn't explicitly say it returns the user, but the store might need it?
          // The store setAuth needs user. setAccessToken only updates access token.
          // I'll assume I just update the tokens.

          authStore.setAccessToken(accessToken);
          if (refreshToken) {
            authStore.refreshToken = refreshToken;
            localStorage.setItem("refreshToken", refreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          authStore.logout();
          router.push("/login");
          return Promise.reject(refreshError);
        }
      } else {
        authStore.logout();
        router.push("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
