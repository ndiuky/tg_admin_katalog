<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getLendingContent,
  createLendingItem,
  updateLendingItem,
  deleteLendingItem,
} from "../../api/lending";
import type { Lending } from "../../types";
import Modal from "../../components/Modal/Modal.vue";
import { z } from "zod";

const items = ref<Lending[]>([]);
const loading = ref(false);
const searchQuery = ref("");

// Modal state
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const editingItem = ref<Lending | null>(null);
const itemToDelete = ref<Lending | null>(null);

// Form state
const form = ref({
  title: "",
  value: "",
  valueAz: "",
});
const formErrors = ref<Record<string, string>>({});
const formLoading = ref(false);

const schema = z.object({
  title: z.string().min(1, "Заголовок (RU) обязателен"),
  value: z.string().min(1, "Значение (RU) обязательно"),
  valueAz: z.string().min(1, "Значение (AZ) обязательно"),
});

const fetchData = async () => {
  loading.value = true;
  try {
    items.value = await getLendingContent();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  const query = searchQuery.value.toLowerCase();
  return items.value.filter(
    (i) =>
      i.title.toLowerCase().includes(query),
  );
});

const openCreateModal = () => {
  editingItem.value = null;
  form.value = { title: "", value: "", valueAz: "" };
  formErrors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (item: Lending) => {
  editingItem.value = item;
  form.value = {
    title: item.title,
    value: item.value,
    valueAz: item.valueAz,
  };
  formErrors.value = {};
  isModalOpen.value = true;
};

const handleSubmit = async () => {
  formErrors.value = {};
  try {
    schema.parse(form.value);
  } catch (e: any) {
    e.errors.forEach((err: any) => {
      formErrors.value[err.path[0]] = err.message;
    });
    return;
  }

  formLoading.value = true;
  try {
    if (editingItem.value) {
      await updateLendingItem(editingItem.value.id, form.value);
    } else {
      await createLendingItem(form.value);
    }

    await fetchData();
    isModalOpen.value = false;
  } catch (e) {
    console.error(e);
    alert("Ошибка сохранения");
  } finally {
    formLoading.value = false;
  }
};

const confirmDelete = (item: Lending) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!itemToDelete.value) return;

  try {
    await deleteLendingItem(itemToDelete.value.id);
    await fetchData();
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
  } catch (e) {
    console.error(e);
    alert("Ошибка удаления");
  }
};

onMounted(fetchData);
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
    >
      <h2 class="text-2xl font-bold text-gray-800">Контент лендинга</h2>
      <button
        @click="openCreateModal"
        class="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Добавить элемент
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по заголовку..."
        class="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <!-- Desktop Table View -->
    <div class="hidden md:block bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              ID
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Заголовок (RU)
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Значение (RU)
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="item in filteredItems" :key="item.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ item.id }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{ item.title }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
              {{ item.value }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <button
                @click="openEditModal(item)"
                class="text-indigo-600 hover:text-indigo-900 mr-4"
              >
                Редактировать
              </button>
              <button
                @click="confirmDelete(item)"
                class="text-red-600 hover:text-red-900"
              >
                Удалить
              </button>
            </td>
          </tr>
          <tr v-if="filteredItems.length === 0">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">
              Элементы не найдены
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards View -->
    <div class="md:hidden space-y-4">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs text-gray-500">ID: {{ item.id }}</p>
          </div>
          <h3 class="text-sm font-semibold text-gray-900 mb-2">
            {{ item.title }}
          </h3>
          <p class="text-xs text-gray-600 line-clamp-2">
            {{ item.value }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="openEditModal(item)"
            class="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Редактировать
          </button>
          <button
            @click="confirmDelete(item)"
            class="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
      <div
        v-if="filteredItems.length === 0"
        class="bg-white rounded-lg shadow p-8 text-center text-gray-500"
      >
        Элементы не найдены
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      :isOpen="isModalOpen"
      :title="editingItem ? 'Редактировать элемент' : 'Создать элемент'"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Заголовок (RU)</label
          >
          <input
            v-model="form.title"
            type="text"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p v-if="formErrors.title" class="text-red-500 text-xs mt-1">
            {{ formErrors.title }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Значение (RU)</label
          >
          <textarea
            v-model="form.value"
            rows="4"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
          <p v-if="formErrors.value" class="text-red-500 text-xs mt-1">
            {{ formErrors.value }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Значение (AZ)</label
          >
          <textarea
            v-model="form.valueAz"
            rows="4"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
          <p v-if="formErrors.valueAz" class="text-red-500 text-xs mt-1">
            {{ formErrors.valueAz }}
          </p>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <button
            type="button"
            @click="isModalOpen = false"
            class="w-full sm:w-auto px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            :disabled="formLoading"
            class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {{ formLoading ? "Сохранение..." : "Сохранить" }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      :isOpen="isDeleteModalOpen"
      title="Удалить элемент?"
      @close="isDeleteModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Вы уверены, что хотите удалить элемент <b>{{ itemToDelete?.title }}</b
          >?
        </p>
        <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            @click="isDeleteModalOpen = false"
            class="w-full sm:w-auto px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Отмена
          </button>
          <button
            @click="handleDelete"
            class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
