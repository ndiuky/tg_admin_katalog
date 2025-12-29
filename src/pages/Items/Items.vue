<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  uploadItemImages,
  deleteItemImage,
} from "../../api/items";
import { getCategories } from "../../api/categories";
import type { Item, Category, ItemImage } from "../../types";
import Modal from "../../components/Modal/Modal.vue";
import { z } from "zod";
import {
  resolveImageUrl,
  PRODUCT_TYPES,
  getSizesForType,
  getProductType,
} from "../../const";

const items = ref<Item[]>([]);
const categories = ref<Category[]>([]);
const loading = ref(false);
const searchQuery = ref("");
const filterCategory = ref<number | "all">("all");
const filterType = ref<string | "all">("all");

// Modal state
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const editingItem = ref<Item | null>(null);
const itemToDelete = ref<Item | null>(null);
const step = ref(1);

// Form state
const form = ref({
  title: "",
  titleAz: "",
  description: "",
  descriptionAz: "",
  price: 0,
  type: "clothing",
  categoryId: 0,
});

// Multiple images state
const newImages = ref<File[]>([]);
const newImagePreviews = ref<string[]>([]);
const existingImages = ref<ItemImage[]>([]);
const imagesToDelete = ref<number[]>([]);

const selectedSizes = ref<string[]>([]);
const formErrors = ref<Record<string, string>>({});
const formLoading = ref(false);

// Available sizes based on selected type
const availableSizes = computed(() => getSizesForType(form.value.type));

// Watch for type changes to reset sizes
watch(
  () => form.value.type,
  () => {
    selectedSizes.value = [];
  }
);

// Toggle size selection
const toggleSize = (size: string) => {
  const index = selectedSizes.value.indexOf(size);
  if (index === -1) {
    selectedSizes.value.push(size);
  } else {
    selectedSizes.value.splice(index, 1);
  }
};

// Select all sizes
const selectAllSizes = () => {
  selectedSizes.value = [...availableSizes.value];
};

// Clear all sizes
const clearAllSizes = () => {
  selectedSizes.value = [];
};

const schema = z.object({
  title: z.string().min(1, "Название (RU) обязательно"),
  titleAz: z.string().min(1, "Название (AZ) обязательно"),
  price: z.number().min(0, "Цена должна быть >= 0"),
  categoryId: z.number().min(1, "Выберите категорию"),
  type: z.string().min(1, "Тип обязателен"),
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [itemsData, categoriesData] = await Promise.all([
      getItems(),
      getCategories(),
    ]);
    items.value = itemsData;
    categories.value = categoriesData;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const filteredItems = computed(() => {
  let result = items.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.titleAz.toLowerCase().includes(query)
    );
  }

  if (filterCategory.value !== "all") {
    result = result.filter((i) => i.categoryId === filterCategory.value);
  }

  if (filterType.value !== "all") {
    result = result.filter((i) => i.type === filterType.value);
  }

  return result;
});

const openCreateModal = () => {
  editingItem.value = null;
  step.value = 1;
  form.value = {
    title: "",
    titleAz: "",
    description: "",
    descriptionAz: "",
    price: 0,
    type: "clothing",
    categoryId: 0,
  };
  selectedSizes.value = [];
  newImages.value = [];
  newImagePreviews.value = [];
  existingImages.value = [];
  imagesToDelete.value = [];
  formErrors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (item: Item) => {
  editingItem.value = item;
  step.value = 1;
  form.value = {
    title: item.title,
    titleAz: item.titleAz,
    description: item.description || "",
    descriptionAz: item.descriptionAz || "",
    price: item.price,
    type: item.type || "clothing",
    categoryId: item.categoryId,
  };
  // Parse existing sizes
  selectedSizes.value = item.size
    ? item.size.split(",").map((s) => s.trim())
    : [];
  // Load existing images
  existingImages.value = item.images ? [...item.images] : [];
  newImages.value = [];
  newImagePreviews.value = [];
  imagesToDelete.value = [];
  formErrors.value = {};
  isModalOpen.value = true;
};

const handleImageChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    for (const file of Array.from(input.files)) {
      if (file.size > 3 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс 3MB)`);
        continue;
      }
      newImages.value.push(file);
      newImagePreviews.value.push(URL.createObjectURL(file));
    }
    // Reset input to allow selecting the same file again
    input.value = "";
  }
};

const fileInput = ref<HTMLInputElement | null>(null);

const handleDrop = (event: DragEvent) => {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      if (file.size > 3 * 1024 * 1024) {
        alert(`Файл ${file.name} слишком большой (макс 3MB)`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        alert(`Файл ${file.name} не является изображением`);
        continue;
      }
      newImages.value.push(file);
      newImagePreviews.value.push(URL.createObjectURL(file));
    }
  }
};

const removeNewImage = (index: number) => {
  URL.revokeObjectURL(newImagePreviews.value[index] as string);
  newImages.value.splice(index, 1);
  newImagePreviews.value.splice(index, 1);
};

const markExistingImageForDeletion = (imageId: number) => {
  if (!imagesToDelete.value.includes(imageId)) {
    imagesToDelete.value.push(imageId);
  }
};

const restoreExistingImage = (imageId: number) => {
  const index = imagesToDelete.value.indexOf(imageId);
  if (index > -1) {
    imagesToDelete.value.splice(index, 1);
  }
};

const isImageMarkedForDeletion = (imageId: number) => {
  return imagesToDelete.value.includes(imageId);
};

// Total images count (existing not deleted + new)
const totalImagesCount = computed(() => {
  const existingCount = existingImages.value.filter(
    (img) => !imagesToDelete.value.includes(img.id)
  ).length;
  return existingCount + newImages.value.length;
});

const handleNextStep = () => {
  formErrors.value = {};
  const result = schema.safeParse(form.value);
  if (result.success) {
    step.value = 2;
  } else {
    result.error.issues.forEach((err) => {
      const field = err.path[0] as string;
      formErrors.value[field] = err.message;
    });
  }
};

const handleSubmit = async () => {
  formErrors.value = {};
  const result = schema.safeParse(form.value);
  if (!result.success) {
    result.error.issues.forEach((err) => {
      const field = err.path[0] as string;
      formErrors.value[field] = err.message;
    });
    return;
  }

  formLoading.value = true;
  try {
    const itemData = {
      title: form.value.title,
      titleAz: form.value.titleAz,
      description: form.value.description,
      descriptionAz: form.value.descriptionAz,
      price: form.value.price,
      type: form.value.type,
      size: selectedSizes.value.join(","),
      categoryId: form.value.categoryId,
    };

    let itemId: number;

    if (editingItem.value) {
      await updateItem(editingItem.value.id, itemData);
      itemId = editingItem.value.id;

      // Delete images marked for deletion
      for (const imageId of imagesToDelete.value) {
        await deleteItemImage(itemId, imageId);
      }
    } else {
      const newItem = await createItem(itemData);
      itemId = newItem.id;
    }

    // Upload new images
    if (newImages.value.length > 0) {
      await uploadItemImages(itemId, newImages.value);
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

const confirmDelete = (item: Item) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!itemToDelete.value) return;

  try {
    await deleteItem(itemToDelete.value.id);
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
      <h2 class="text-2xl font-bold text-gray-800">Товары</h2>
      <button
        @click="openCreateModal"
        class="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Добавить товар
      </button>
    </div>

    <div class="mb-4 flex flex-wrap gap-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по названию..."
        class="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        v-model="filterCategory"
        class="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Все категории</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.title }}
        </option>
      </select>

      <select
        v-model="filterType"
        class="w-full md:w-1/4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">Все типы</option>
        <option
          v-for="productType in PRODUCT_TYPES"
          :key="productType.id"
          :value="productType.id"
        >
          {{ productType.label }}
        </option>
      </select>
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
              Категория
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Цена
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Тип
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Размеры
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
            <td class="px-6 py-4 whitespace-nowrap">
              <img
                :src="resolveImageUrl(item.imageUrl)"
                alt="Item"
                class="h-10 w-10 rounded-full object-cover"
              />
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{ item.title }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{
                categories.find((c) => c.id === item.categoryId)?.title ||
                item.categoryId
              }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ item.price }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ getProductType(item.type)?.label || item.type }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <span v-if="item.size" class="text-xs">{{ item.size }}</span>
              <span v-else class="text-gray-400">—</span>
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
            <td colspan="8" class="px-6 py-4 text-center text-gray-500">
              Товары не найдены
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      :isOpen="isModalOpen"
      :title="editingItem ? 'Редактировать товар' : 'Создать товар'"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="step === 1 || editingItem">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
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

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Категория</label
              >
              <select
                v-model="form.categoryId"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option :value="0" disabled>Выберите категорию</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.title }}
                </option>
              </select>
              <p v-if="formErrors.categoryId" class="text-red-500 text-xs mt-1">
                {{ formErrors.categoryId }}
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Цена</label
              >
              <input
                v-model.number="form.price"
                type="number"
                min="0"
                step="0.01"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p v-if="formErrors.price" class="text-red-500 text-xs mt-1">
                {{ formErrors.price }}
              </p>
            </div>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700"
              >Тип товара</label
            >
            <select
              v-model="form.type"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option
                v-for="productType in PRODUCT_TYPES"
                :key="productType.id"
                :value="productType.id"
              >
                {{ productType.label }}
              </option>
            </select>
            <p v-if="formErrors.type" class="text-red-500 text-xs mt-1">
              {{ formErrors.type }}
            </p>
          </div>

          <div class="mt-4" v-if="availableSizes.length > 0">
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-medium text-gray-700"
                >Доступные размеры</label
              >
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="selectAllSizes"
                  class="text-xs text-blue-600 hover:text-blue-800"
                >
                  Выбрать все
                </button>
                <button
                  type="button"
                  @click="clearAllSizes"
                  class="text-xs text-gray-500 hover:text-gray-700"
                >
                  Очистить
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="size in availableSizes"
                :key="size"
                type="button"
                @click="toggleSize(size)"
                :class="[
                  'px-3 py-1.5 text-sm font-medium rounded-md border transition-colors',
                  selectedSizes.includes(size)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400',
                ]"
              >
                {{ size }}
              </button>
            </div>
            <p
              class="text-xs text-gray-500 mt-2"
              v-if="selectedSizes.length > 0"
            >
              Выбрано: {{ selectedSizes.join(", ") }}
            </p>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700"
              >Описание (RU)</label
            >
            <textarea
              v-model="form.description"
              rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700"
              >Описание (AZ)</label
            >
            <textarea
              v-model="form.descriptionAz"
              rows="3"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
        </div>

        <div v-if="step === 2 || editingItem">
          <label class="block text-sm font-medium text-gray-700 mb-2"
            >Изображения ({{ totalImagesCount }}/10)</label
          >
          
          <!-- Existing images grid -->
          <div v-if="existingImages.length > 0" class="mb-4">
            <p class="text-xs text-gray-500 mb-2">Существующие изображения:</p>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="img in existingImages"
                :key="img.id"
                class="relative group"
              >
                <img
                  :src="resolveImageUrl(img.url)"
                  :alt="'Image ' + img.id"
                  :class="[
                    'w-full h-20 object-cover rounded-md border',
                    isImageMarkedForDeletion(img.id)
                      ? 'opacity-30 border-red-500'
                      : 'border-gray-200',
                  ]"
                />
                <button
                  v-if="!isImageMarkedForDeletion(img.id)"
                  type="button"
                  @click="markExistingImageForDeletion(img.id)"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ×
                </button>
                <button
                  v-else
                  type="button"
                  @click="restoreExistingImage(img.id)"
                  class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md text-white text-xs"
                >
                  Восстановить
                </button>
              </div>
            </div>
          </div>

          <!-- New images grid -->
          <div v-if="newImagePreviews.length > 0" class="mb-4">
            <p class="text-xs text-gray-500 mb-2">Новые изображения:</p>
            <div class="grid grid-cols-4 gap-2">
              <div
                v-for="(preview, index) in newImagePreviews"
                :key="'new-' + index"
                class="relative group"
              >
                <img
                  :src="preview"
                  :alt="'New image ' + (index + 1)"
                  class="w-full h-20 object-cover rounded-md border border-green-300"
                />
                <button
                  type="button"
                  @click="removeNewImage(index)"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Upload area -->
          <div
            class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md relative hover:border-blue-400 transition-colors cursor-pointer"
            @click="fileInput?.click()"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <div class="space-y-1 text-center">
              <div class="flex flex-col items-center py-4">
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
                    Добавить изображения
                  </span>
                  <p class="pl-1">или перетащите</p>
                </div>
                <p class="text-xs text-gray-500 mt-1">PNG, JPG, GIF до 3MB каждый (макс. 10 изображений)</p>
              </div>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              @change="handleImageChange"
              accept="image/*"
              multiple
              @click.stop
            />
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button
            v-if="step === 2 && !editingItem"
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
            v-if="step === 1 && !editingItem"
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
      title="Удалить товар?"
      @close="isDeleteModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Вы уверены, что хотите удалить товар <b>{{ itemToDelete?.title }}</b
          >?
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
