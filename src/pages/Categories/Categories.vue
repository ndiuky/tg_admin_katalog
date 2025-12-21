<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
} from "../../api/categories";
import type { Category } from "../../types";
import Modal from "../../components/Modal/Modal.vue";
import { z } from "zod";
import { MEDIA_BASE_URL } from "../../const";

const categories = ref<Category[]>([]);
const loading = ref(false);
const searchQuery = ref("");

// Modal state
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const editingCategory = ref<Category | null>(null);
const categoryToDelete = ref<Category | null>(null);
const step = ref(1);

// Form state
const form = ref({
  title: "",
  titleAz: "",
  image: null as File | null,
});
const imagePreview = ref<string | null>(null);
const formErrors = ref<Record<string, string>>({});
const formLoading = ref(false);

const schema = z.object({
  title: z.string().min(1, "Название (RU) обязательно"),
  titleAz: z.string().min(1, "Название (AZ) обязательно"),
});

const fetchCategories = async () => {
  loading.value = true;
  try {
    categories.value = await getCategories();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value;
  const query = searchQuery.value.toLowerCase();
  return categories.value.filter(
    (c) =>
      c.title.toLowerCase().includes(query) ||
      c.titleAz.toLowerCase().includes(query)
  );
});

const openCreateModal = () => {
  editingCategory.value = null;
  step.value = 1;
  form.value = { title: "", titleAz: "", image: null };
  imagePreview.value = null;
  formErrors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (category: Category) => {
  editingCategory.value = category;
  step.value = 1;
  form.value = {
    title: category.title,
    titleAz: category.titleAz,
    image: null,
  };
  imagePreview.value = category.imageUrl
    ? `${MEDIA_BASE_URL}/${category.imageUrl}`
    : null;
  formErrors.value = {};
  isModalOpen.value = true;
};

const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    if (file.size > 3 * 1024 * 1024) {
      alert("Файл слишком большой (макс 3MB)");
      return;
    }
    form.value.image = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const fileInput = ref<HTMLInputElement | null>(null);

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files[0];
  if (file) {
    if (file.size > 3 * 1024 * 1024) {
      alert("Файл слишком большой (макс 3MB)");
      return;
    }
    form.value.image = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const clearImageSelection = () => {
  form.value.image = null;
  if (editingCategory.value && editingCategory.value.imageUrl) {
    imagePreview.value = `${MEDIA_BASE_URL}/${editingCategory.value.imageUrl}`;
  } else {
    imagePreview.value = null;
  }
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const handleNextStep = () => {
  formErrors.value = {};
  try {
    schema.parse(form.value);
    step.value = 2;
  } catch (e: any) {
    e.errors.forEach((err: any) => {
      formErrors.value[err.path[0]] = err.message;
    });
  }
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
    let categoryId: number;

    if (editingCategory.value) {
      await updateCategory(editingCategory.value.id, {
        title: form.value.title,
        titleAz: form.value.titleAz,
      });
      categoryId = editingCategory.value.id;
    } else {
      const newCategory = await createCategory({
        title: form.value.title,
        titleAz: form.value.titleAz,
      });
      categoryId = newCategory.id;
    }

    if (form.value.image) {
      await uploadCategoryImage(categoryId, form.value.image);
    }

    await fetchCategories();
    isModalOpen.value = false;
  } catch (e) {
    console.error(e);
    alert("Ошибка сохранения");
  } finally {
    formLoading.value = false;
  }
};

const confirmDelete = (category: Category) => {
  categoryToDelete.value = category;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!categoryToDelete.value) return;

  try {
    await deleteCategory(categoryToDelete.value.id);
    await fetchCategories();
    isDeleteModalOpen.value = false;
    categoryToDelete.value = null;
  } catch (e) {
    console.error(e);
    alert("Ошибка удаления");
  }
};

onMounted(fetchCategories);
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
    >
      <h2 class="text-2xl font-bold text-gray-800">Категории</h2>
      <button
        @click="openCreateModal"
        class="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Добавить категорию
      </button>
    </div>

    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по названию..."
        class="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
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
              Изображение
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Название (RU)
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Название (AZ)
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="category in filteredCategories" :key="category.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ category.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <img
                :src="
                  `${MEDIA_BASE_URL}/${category.imageUrl}` ||
                  '/media/default_item_image.png'
                "
                alt="Category"
                class="h-10 w-10 rounded-full object-cover"
              />
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{ category.title }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ category.titleAz }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <button
                @click="openEditModal(category)"
                class="text-indigo-600 hover:text-indigo-900 mr-4"
              >
                Редактировать
              </button>
              <button
                @click="confirmDelete(category)"
                class="text-red-600 hover:text-red-900"
              >
                Удалить
              </button>
            </td>
          </tr>
          <tr v-if="filteredCategories.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
              Категории не найдены
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      :isOpen="isModalOpen"
      :title="editingCategory ? 'Редактировать категорию' : 'Создать категорию'"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="step === 1 || editingCategory">
          <div>
            <label class="block text-sm font-medium text-gray-700"
              >Название (RU)</label
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

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700"
              >Название (AZ)</label
            >
            <input
              v-model="form.titleAz"
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p v-if="formErrors.titleAz" class="text-red-500 text-xs mt-1">
              {{ formErrors.titleAz }}
            </p>
          </div>
        </div>

        <div v-if="step === 2 || editingCategory">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Изображение</label
          >
          <div
            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:border-blue-400 transition-colors cursor-pointer"
            @click="fileInput?.click()"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <div class="space-y-1 text-center">
              <div v-if="imagePreview" class="relative inline-block">
                <img
                  :src="imagePreview"
                  alt="Preview"
                  class="mx-auto h-48 object-contain rounded-md bg-gray-50"
                />
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity rounded-md"
                >
                  <span class="text-white font-medium">Изменить</span>
                </div>
              </div>
              <div v-else class="flex flex-col items-center py-4">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <div class="flex text-sm text-gray-600 mt-2">
                  <span
                    class="relative bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    Загрузить файл
                  </span>
                  <p class="pl-1">или перетащите</p>
                </div>
                <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF до 3MB</p>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleImageChange"
              accept="image/*"
              @click.stop
            />
          </div>
          <div
            v-if="form.image"
            class="mt-2 flex items-center justify-between text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-200"
          >
            <span class="truncate">{{ form.image.name }}</span>
            <button
              type="button"
              @click.stop="clearImageSelection"
              class="text-red-500 hover:text-red-700 ml-2"
            >
              Отменить выбор
            </button>
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            v-if="step === 2 && !editingCategory"
            type="button"
            @click="step = 1"
            class="px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Назад
          </button>
          <button
            type="button"
            @click="isModalOpen = false"
            class="px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Отмена
          </button>
          <button
            v-if="step === 1 && !editingCategory"
            type="button"
            @click="handleNextStep"
            class="px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Добавить фото
          </button>
          <button
            type="submit"
            :disabled="formLoading"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {{ formLoading ? "Сохранение..." : "Сохранить" }}
          </button>
        </div>
      </form>
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal
      :isOpen="isDeleteModalOpen"
      title="Удалить категорию?"
      @close="isDeleteModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Вы уверены, что хотите удалить категорию
          <b>{{ categoryToDelete?.title }}</b
          >?
        </p>
        <p
          v-if="categoryToDelete?.items && categoryToDelete.items.length > 0"
          class="text-red-500 text-sm"
        >
          Внимание: У этой категории есть связанные товары!
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="isDeleteModalOpen = false"
            class="px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Отмена
          </button>
          <button
            @click="handleDelete"
            class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
