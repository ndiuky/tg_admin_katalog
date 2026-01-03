<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getStyles,
  createStyle,
  updateStyle,
  deleteStyle,
  uploadStyleImage,
  type Style,
} from "../../api/styles";
import Modal from "../../components/Modal/Modal.vue";
import { z } from "zod";
import { resolveImageUrl } from "../../const";

const styles = ref<Style[]>([]);
const loading = ref(false);
const searchQuery = ref("");

// Modal state
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const editingStyle = ref<Style | null>(null);
const styleToDelete = ref<Style | null>(null);
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

const fetchStyles = async () => {
  loading.value = true;
  try {
    styles.value = await getStyles();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const filteredStyles = computed(() => {
  if (!searchQuery.value) return styles.value;
  const query = searchQuery.value.toLowerCase();
  return styles.value.filter(
    (s: Style) =>
      s.title.toLowerCase().includes(query) ||
      s.titleAz.toLowerCase().includes(query)
  );
});

const openCreateModal = () => {
  editingStyle.value = null;
  step.value = 1;
  form.value = { title: "", titleAz: "", image: null };
  imagePreview.value = null;
  formErrors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (style: Style) => {
  editingStyle.value = style;
  step.value = 1;
  form.value = {
    title: style.title,
    titleAz: style.titleAz,
    image: null,
  };
  imagePreview.value = style.imageUrl ? resolveImageUrl(style.imageUrl) : null;
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
  if (editingStyle.value && editingStyle.value.imageUrl) {
    imagePreview.value = resolveImageUrl(editingStyle.value.imageUrl);
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
    let styleId: number;

    if (editingStyle.value) {
      await updateStyle(editingStyle.value.id, {
        title: form.value.title,
        titleAz: form.value.titleAz,
      });
      styleId = editingStyle.value.id;
    } else {
      const newStyle = await createStyle({
        title: form.value.title,
        titleAz: form.value.titleAz,
      });
      styleId = newStyle.id;
    }

    if (form.value.image) {
      await uploadStyleImage(styleId, form.value.image);
    }

    await fetchStyles();
    isModalOpen.value = false;
  } catch (e) {
    console.error(e);
    alert("Ошибка сохранения");
  } finally {
    formLoading.value = false;
  }
};

const confirmDelete = (style: Style) => {
  styleToDelete.value = style;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!styleToDelete.value) return;

  try {
    await deleteStyle(styleToDelete.value.id);
    await fetchStyles();
    isDeleteModalOpen.value = false;
    styleToDelete.value = null;
  } catch (e) {
    console.error(e);
    alert("Ошибка удаления");
  }
};

onMounted(fetchStyles);
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
    >
      <h2 class="text-2xl font-bold text-gray-800">Стили</h2>
      <button
        @click="openCreateModal"
        class="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Добавить стиль
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
          <tr v-for="style in filteredStyles" :key="style.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ style.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <img
                :src="resolveImageUrl(style.imageUrl)"
                alt="Style"
                class="h-10 w-10 rounded-full object-cover"
              />
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
            >
              {{ style.title }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ style.titleAz }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
            >
              <button
                @click="openEditModal(style)"
                class="text-indigo-600 hover:text-indigo-900 mr-4"
              >
                Редактировать
              </button>
              <button
                @click="confirmDelete(style)"
                class="text-red-600 hover:text-red-900"
              >
                Удалить
              </button>
            </td>
          </tr>
          <tr v-if="filteredStyles.length === 0">
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
              Стили не найдены
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards View -->
    <div class="md:hidden space-y-4">
      <div
        v-for="style in filteredStyles"
        :key="style.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="flex items-start gap-4">
          <img
            :src="resolveImageUrl(style.imageUrl)"
            alt="Style"
            class="h-16 w-16 rounded-lg object-cover flex-shrink-0"
          />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <p class="text-xs text-gray-500">ID: {{ style.id }}</p>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 mb-1">
              {{ style.title }}
            </h3>
            <p class="text-sm text-gray-600">{{ style.titleAz }}</p>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <button
            @click="openEditModal(style)"
            class="flex-1 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Редактировать
          </button>
          <button
            @click="confirmDelete(style)"
            class="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
      <div
        v-if="filteredStyles.length === 0"
        class="bg-white rounded-lg shadow p-8 text-center text-gray-500"
      >
        Стили не найдены
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      :isOpen="isModalOpen"
      :title="editingStyle ? 'Редактировать стиль' : 'Создать стиль'"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="step === 1 || editingStyle">
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

        <div v-if="step === 2 || editingStyle">
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

        <div class="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-6">
          <button
            v-if="step === 2 && !editingStyle"
            type="button"
            @click="step = 1"
            class="w-full sm:w-auto px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Назад
          </button>
          <button
            type="button"
            @click="isModalOpen = false"
            class="w-full sm:w-auto px-4 py-2 border border-gray-400 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Отмена
          </button>
          <button
            v-if="step === 1 && !editingStyle"
            type="button"
            @click="handleNextStep"
            class="w-full sm:w-auto px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
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
      title="Удалить стиль?"
      @close="isDeleteModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Вы уверены, что хотите удалить стиль <b>{{ styleToDelete?.title }}</b
          >?
        </p>
        <p class="text-yellow-600 text-sm">
          Примечание: Стиль будет удален у всех связанных товаров.
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
