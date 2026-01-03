<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";
import { login } from "../../api/auth";
import { z } from "zod";

const router = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

const schema = z.object({
  username: z.string().min(1, "Введите имя пользователя"),
  password: z.string().min(1, "Введите пароль"),
});

const handleLogin = async () => {
  error.value = "";

  try {
    schema.parse({ username: username.value, password: password.value });
  } catch (e: any) {
    error.value = e.errors[0].message;
    return;
  }

  loading.value = true;

  try {
    const data = await login({
      username: username.value,
      password: password.value,
    });
    authStore.setAuth(data.user, data.accessToken, data.refreshToken);
    router.push("/");
  } catch (e: any) {
    error.value = "Ошибка входа. Проверьте данные.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6 sm:p-8">
      <h2 class="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6 sm:mb-8">
        Вход в админ-панель
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-4 sm:space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Имя пользователя</label
          >
          <input
            v-model="username"
            type="text"
            class="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Username"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"
            >Пароль</label
          >
          <input
            v-model="password"
            type="password"
            class="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
          />
        </div>

        <div v-if="error" class="text-red-500 text-sm text-center">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2.5 sm:py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-base font-medium"
        >
          {{ loading ? "Вход..." : "Войти" }}
        </button>
      </form>
    </div>
  </div>
</template>
