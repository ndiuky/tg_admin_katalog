import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "../types";
import { refresh } from "../api/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(localStorage.getItem("refreshToken"));

  const isAuthenticated = computed(() => !!accessToken.value);

  function setAuth(
    newUser: User,
    newAccessToken: string,
    newRefreshToken: string,
  ) {
    user.value = newUser;
    accessToken.value = newAccessToken;
    refreshToken.value = newRefreshToken;
    localStorage.setItem("refreshToken", newRefreshToken);
  }

  function setAccessToken(token: string) {
    accessToken.value = token;
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem("refreshToken");
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) return false;
    try {
      const data = await refresh(refreshToken.value);
      setAuth(data.user, data.accessToken, data.refreshToken);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    setAuth,
    setAccessToken,
    logout,
    refreshAccessToken,
  };
});
