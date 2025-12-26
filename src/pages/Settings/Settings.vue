<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { getSettings, updateSettings, type Color } from "../../api/color";

const loading = ref(false);
const saving = ref(false);
const settings = ref<Color>({
  id: 0,
  primaryColor: "#000000",
  secondaryColor: "#000000",
  accentColor: "#000000",
});

type ColorKey = "primaryColor" | "secondaryColor" | "accentColor";
const colorConfigs: Array<{
  key: ColorKey;
  label: string;
  description: string;
}> = [
  {
    key: "primaryColor",
    label: "Основной цвет",
    description: "Цвет хедера, кнопок и акцентов",
  },
  {
    key: "secondaryColor",
    label: "Вторичный цвет",
    description: "Цвет текста и иконок",
  },
  {
    key: "accentColor",
    label: "Акцентный цвет",
    description: "Цвет ховеров и выделений",
  },
];

const fetchSettings = async () => {
  loading.value = true;
  try {
    const data = await getSettings();
    settings.value = { ...data };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  saving.value = true;
  try {
    const { id, ...colorDto } = settings.value;
    await updateSettings(id, colorDto);
    alert("Настройки сохранены!");
  } catch (e) {
    console.error(e);
    alert("Ошибка сохранения");
  } finally {
    saving.value = false;
  }
};

const hsvToRgb = (
  h: number,
  s: number,
  v: number
): [number, number, number] => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
};

const handleWheelClick = (event: MouseEvent, key: ColorKey) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const x = event.clientX - rect.left - centerX;
  const y = event.clientY - rect.top - centerY;

  const angle = Math.atan2(y, x) * (180 / Math.PI) + 180;
  const distance = Math.sqrt(x * x + y * y);
  const maxDistance = rect.width / 2;
  const saturation = Math.min(distance / maxDistance, 1);

  const [r, g, b] = hsvToRgb(angle, saturation, 1);
  settings.value[key] = rgbToHex(r, g, b);
};

watch(settings, () => {
  console.log(settings);
});

onMounted(fetchSettings);
</script>

<template>
  <div>
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
    >
      <h2 class="text-2xl font-bold text-gray-800">Настройки цветов</h2>
      <button
        @click="handleSave"
        :disabled="saving"
        class="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {{ saving ? "Сохранение..." : "Сохранить" }}
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">Загрузка настроек...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div
        v-for="config in colorConfigs"
        :key="config.key"
        class="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 class="font-semibold text-gray-800 mb-1">{{ config.label }}</h3>
        <p class="text-sm text-gray-500 mb-4">{{ config.description }}</p>

        <!-- Color wheel -->
        <div
          @click="(e) => handleWheelClick(e, config.key)"
          class="relative w-48 h-48 mx-auto mb-4 rounded-full cursor-crosshair"
          :style="{
            background: `conic-gradient(
              hsl(0, 100%, 50%),
              hsl(60, 100%, 50%),
              hsl(120, 100%, 50%),
              hsl(180, 100%, 50%),
              hsl(240, 100%, 50%),
              hsl(300, 100%, 50%),
              hsl(360, 100%, 50%)
            )`,
          }"
        >
          <!-- White to transparent overlay for saturation -->
          <div
            class="absolute inset-0 rounded-full"
            style="
              background: radial-gradient(circle, white 0%, transparent 70%);
            "
          ></div>
          <!-- Center preview -->
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-4 border-white shadow-lg"
            :style="{ backgroundColor: settings[config.key] }"
          ></div>
        </div>

        <!-- Current color display -->
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-10 h-10 rounded-lg border border-gray-300 shadow-inner"
            :style="{ backgroundColor: settings[config.key] }"
          ></div>
          <input
            type="text"
            v-model="settings[config.key]"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="#000000"
          />
        </div>

        <!-- Native color picker fallback -->
        <div class="flex items-center gap-2">
          <input
            type="color"
            v-model="settings[config.key]"
            class="w-10 h-10 rounded cursor-pointer border-0"
          />
          <span class="text-sm text-gray-500">или выберите из палитры</span>
        </div>
      </div>
    </div>

    <!-- Preview section -->
    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h3 class="font-semibold text-gray-800 mb-4">Предпросмотр</h3>
      <div class="flex flex-wrap gap-4">
        <div
          class="px-6 py-3 rounded-lg text-white font-medium"
          :style="{ backgroundColor: settings.primaryColor }"
        >
          Основная кнопка
        </div>
        <div
          class="px-6 py-3 rounded-lg text-white font-medium"
          :style="{ backgroundColor: settings.secondaryColor }"
        >
          Вторичная кнопка
        </div>
        <div
          class="px-6 py-3 rounded-lg border-2 font-medium"
          :style="{
            borderColor: settings.accentColor,
            color: settings.accentColor,
          }"
        >
          Акцентная кнопка
        </div>
      </div>
      <div
        class="mt-4 p-4 rounded-lg"
        :style="{ backgroundColor: settings.primaryColor }"
      >
        <p class="text-white">Пример хедера с основным цветом</p>
      </div>
    </div>
  </div>
</template>
