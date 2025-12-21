<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getCategories } from "../api/categories";
import { getItems } from "../api/items";
import { getLendingContent } from "../api/lending";

const stats = ref({
  categories: 0,
  items: 0,
  lending: 0,
});
const loading = ref(true);

onMounted(async () => {
  try {
    const [categories, items, lending] = await Promise.all([
      getCategories(),
      getItems(),
      getLendingContent(),
    ]);

    stats.value = {
      categories: categories.length,
      items: items.length,
      lending: lending.length,
    };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Главная</h2>

    <div v-if="loading" class="text-gray-500">Загрузка статистики...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <div class="text-gray-500 text-sm font-medium uppercase">Категории</div>
        <div class="text-3xl font-bold text-gray-800 mt-2">
          {{ stats.categories }}
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500"
      >
        <div class="text-gray-500 text-sm font-medium uppercase">Товары</div>
        <div class="text-3xl font-bold text-gray-800 mt-2">
          {{ stats.items }}
        </div>
      </div>

      <div
        class="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500"
      >
        <div class="text-gray-500 text-sm font-medium uppercase">
          Элементы лендинга
        </div>
        <div class="text-3xl font-bold text-gray-800 mt-2">
          {{ stats.lending }}
        </div>
      </div>
    </div>
  </div>
</template>
