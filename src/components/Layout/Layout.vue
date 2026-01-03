<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const isSidebarOpen = ref(false);

const handleLogout = () => {
  authStore.logout();
  router.push("/login");
};

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Mobile Header -->
    <div
      class="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30"
    >
      <h1 class="text-xl font-bold text-gray-800">Creatif</h1>
      <button @click="toggleSidebar" class="text-gray-600 focus:outline-none">
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>
    </div>

    <!-- Sidebar Overlay -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out transform md:transform-none',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <div class="p-6 border-b border-gray-100 hidden md:block">
        <h1 class="text-xl font-bold text-gray-800">Creatif</h1>
      </div>

      <div
        class="p-4 border-b border-gray-100 md:hidden flex justify-between items-center"
      >
        <h1 class="text-xl font-bold text-gray-800">Меню</h1>
        <button @click="isSidebarOpen = false" class="text-gray-500">
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <router-link
          to="/"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class=""
          exact-active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Главная
        </router-link>

        <router-link
          to="/categories"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Категории
        </router-link>

        <router-link
          to="/styles"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Стили
        </router-link>

        <router-link
          to="/items"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Товары
        </router-link>

        <router-link
          to="/lending"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Контент лендинга
        </router-link>

        <router-link
          to="/social"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Социальные сети
        </router-link>

        <router-link
          to="/settings"
          class="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          active-class="bg-gray-200 text-gray-900 font-medium"
          @click="isSidebarOpen = false"
        >
          Настройки цветов
        </router-link>
      </nav>

      <div class="p-4 border-t border-gray-100">
        <button
          @click="handleLogout"
          class="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Выход
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto pt-16 md:pt-0">
      <div class="p-4 md:p-8">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>
