<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import {
  getSocialLinks,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} from "../../api/social";
import type { SocialLink } from "../../types";
import Modal from "../../components/Modal/Modal.vue";
import { z } from "zod";

const items = ref<SocialLink[]>([]);
const loading = ref(false);

// Modal state
const isModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const editingItem = ref<SocialLink | null>(null);
const itemToDelete = ref<SocialLink | null>(null);

// Form state
const form = ref({
  platform: "",
  url: "",
  isActive: true,
  order: 0,
});
const formErrors = ref<Record<string, string>>({});
const formLoading = ref(false);

// Available platforms with SVG icons
const PLATFORMS: {
  id: string;
  label: string;
  icon: string;
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.684-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.684.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 8.468a3.333 3.333 0 1 0 0-6.666 3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z"/></svg>`,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  },
  {
    id: "tiktok",
    label: "TikTok",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`,
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  },
  {
    id: "vk",
    label: "VKontakte",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.339-3.202-2.17-3.04-2.763-5.32-2.763-5.793 0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z"/></svg>`,
  },
  {
    id: "phone",
    label: "Телефон",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`,
  },
  {
    id: "email",
    label: "Email",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
  },
];

const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;

const getPlatformInfo = (platformId: string) => {
  return (
    PLATFORMS.find((p) => p.id === platformId) || {
      id: platformId,
      label: platformId,
      icon: DEFAULT_ICON,
    }
  );
};

const schema = z.object({
  platform: z.string().min(1, "Платформа обязательна"),
  url: z.string().min(1, "URL/Ссылка обязательна"),
});

const fetchData = async () => {
  loading.value = true;
  try {
    items.value = await getSocialLinks();
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  editingItem.value = null;
  form.value = {
    platform: "",
    url: "",
    isActive: true,
    order: items.value.length,
  };
  formErrors.value = {};
  isModalOpen.value = true;
};

const openEditModal = (item: SocialLink) => {
  editingItem.value = item;
  form.value = {
    platform: item.platform,
    url: item.url,
    isActive: item.isActive,
    order: item.order,
  };
  formErrors.value = {};
  isModalOpen.value = true;
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
    if (editingItem.value) {
      await updateSocialLink(editingItem.value.id, form.value);
    } else {
      await createSocialLink(form.value);
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

const toggleActive = async (item: SocialLink) => {
  try {
    await updateSocialLink(item.id, { isActive: !item.isActive });
    await fetchData();
  } catch (e) {
    console.error(e);
    alert("Ошибка обновления");
  }
};

const confirmDelete = (item: SocialLink) => {
  itemToDelete.value = item;
  isDeleteModalOpen.value = true;
};

const handleDelete = async () => {
  if (!itemToDelete.value) return;

  try {
    await deleteSocialLink(itemToDelete.value.id);
    await fetchData();
    isDeleteModalOpen.value = false;
    itemToDelete.value = null;
  } catch (e) {
    console.error(e);
    alert("Ошибка удаления");
  }
};

// Filter available platforms (not already used)
const availablePlatforms = computed(() => {
  const usedPlatforms = items.value.map((i) => i.platform);
  if (editingItem.value) {
    // When editing, include current platform
    return PLATFORMS.filter(
      (p) =>
        !usedPlatforms.includes(p.id) || p.id === editingItem.value?.platform
    );
  }
  return PLATFORMS.filter((p) => !usedPlatforms.includes(p.id));
});

onMounted(fetchData);
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
    >
      <h2 class="text-2xl font-bold text-gray-800">Социальные сети</h2>
      <button
        @click="openCreateModal"
        class="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        :disabled="availablePlatforms.length === 0"
      >
        Добавить ссылку
      </button>
    </div>

    <div v-if="loading" class="text-center py-8">
      <p class="text-gray-500">Загрузка...</p>
    </div>

    <!-- Desktop Table View -->
    <div v-else class="hidden md:block bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Платформа
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Ссылка
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Статус
            </th>
            <th
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Действия
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="item in items" :key="item.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <span
                  class="w-5 h-5 mr-2 text-gray-700"
                  v-html="getPlatformInfo(item.platform).icon"
                ></span>
                <span class="text-sm font-medium text-gray-900">
                  {{ getPlatformInfo(item.platform).label }}
                </span>
              </div>
            </td>
            <td class="px-6 py-4">
              <a
                :href="item.url"
                target="_blank"
                class="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate block max-w-xs"
              >
                {{ item.url }}
              </a>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <button
                @click="toggleActive(item)"
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  item.isActive
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ]"
              >
                {{ item.isActive ? "Активна" : "Скрыта" }}
              </button>
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
          <tr v-if="items.length === 0">
            <td colspan="4" class="px-6 py-4 text-center text-gray-500">
              Социальные сети не добавлены
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards View -->
    <div v-if="!loading" class="md:hidden space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-white rounded-lg shadow p-4"
      >
        <div class="mb-3">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span
                class="w-5 h-5 text-gray-700"
                v-html="getPlatformInfo(item.platform).icon"
              ></span>
              <span class="text-sm font-semibold text-gray-900">
                {{ getPlatformInfo(item.platform).label }}
              </span>
            </div>
            <button
              @click="toggleActive(item)"
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium transition-colors',
                item.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600',
              ]"
            >
              {{ item.isActive ? "Активна" : "Скрыта" }}
            </button>
          </div>
          <a
            :href="item.url"
            target="_blank"
            class="text-xs text-blue-600 hover:underline break-all block"
          >
            {{ item.url }}
          </a>
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
        v-if="items.length === 0"
        class="bg-white rounded-lg shadow p-8 text-center text-gray-500"
      >
        Социальные сети не добавлены
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      :isOpen="isModalOpen"
      :title="editingItem ? 'Редактировать ссылку' : 'Добавить ссылку'"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700"
            >Платформа</label
          >
          <div class="mt-1 grid grid-cols-3 gap-2">
            <button
              v-for="platform in availablePlatforms"
              :key="platform.id"
              type="button"
              @click="form.platform = platform.id"
              :class="[
                'flex items-center gap-2 p-2 border rounded-md text-sm transition-colors',
                form.platform === platform.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700',
              ]"
            >
              <span class="w-4 h-4 flex-shrink-0" v-html="platform.icon"></span>
              <span class="truncate">{{ platform.label }}</span>
            </button>
          </div>
          <p v-if="formErrors.platform" class="text-red-500 text-xs mt-1">
            {{ formErrors.platform }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700"
            >URL / Ссылка</label
          >
          <input
            v-model="form.url"
            type="text"
            placeholder="https://instagram.com/yourpage"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p v-if="formErrors.url" class="text-red-500 text-xs mt-1">
            {{ formErrors.url }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            Для телефона: tel:+79001234567, для email: mailto:email@example.com
          </p>
        </div>

        <div class="flex items-center">
          <input
            id="isActive"
            v-model="form.isActive"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="isActive" class="ml-2 block text-sm text-gray-700">
            Активна (отображается на сайте)
          </label>
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
      title="Удалить ссылку?"
      @close="isDeleteModalOpen = false"
    >
      <div class="space-y-4">
        <p class="text-gray-600">
          Вы уверены, что хотите удалить ссылку на
          <b>{{ getPlatformInfo(itemToDelete?.platform || "").label }}</b
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
