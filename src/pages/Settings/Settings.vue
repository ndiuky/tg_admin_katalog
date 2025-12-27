<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getSettings, updateSettings, type ColorDto } from "../../api/color";

const loading = ref(false);
const saving = ref(false);
const colorId = ref<number | null>(null);
const settings = ref<ColorDto>({
  primaryColor: "#171717",
  secondaryColor: "#525252",
  accentColor: "#171717",
});

type ColorKey = keyof ColorDto;

const colorConfigs: { key: ColorKey; label: string; description: string }[] = [
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
    colorId.value = data.id;
    settings.value = {
      primaryColor: data.primaryColor || "#171717",
      secondaryColor: data.secondaryColor || "#525252",
      accentColor: data.accentColor || "#171717",
    };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// Валидация hex цвета
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

const handleSave = async () => {
  if (!colorId.value) {
    alert("Цветовые настройки не загружены");
    return;
  }

  // Валидация всех цветов перед отправкой
  const colors = [
    { name: "Основной цвет", value: settings.value.primaryColor },
    { name: "Вторичный цвет", value: settings.value.secondaryColor },
    { name: "Акцентный цвет", value: settings.value.accentColor },
  ];

  for (const color of colors) {
    if (!isValidHexColor(color.value)) {
      alert(
        `${color.name} имеет неверный формат. Используйте формат #RRGGBB (например #ff5500)`
      );
      return;
    }
  }

  saving.value = true;
  try {
    await updateSettings(colorId.value, settings.value);
    alert("Настройки сохранены!");
  } catch (e: any) {
    console.error(e);
    const message = e.response?.data?.message;
    if (Array.isArray(message)) {
      alert("Ошибка: " + message.join(", "));
    } else {
      alert("Ошибка сохранения: " + (message || "неизвестная ошибка"));
    }
  } finally {
    saving.value = false;
  }
};

// HSL to RGB conversion for the color wheel (CSS uses HSL in conic-gradient)
const hslToRgb = (
  h: number,
  s: number,
  l: number
): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
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

// Color wheel click handler
const handleWheelClick = (event: MouseEvent, key: ColorKey) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const x = event.clientX - rect.left - centerX;
  const y = event.clientY - rect.top - centerY;

  // CSS conic-gradient starts from top (12 o'clock) and goes clockwise
  // atan2 returns angle from positive X axis, so we need to adjust
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  // Convert from math angle (0° = right, counter-clockwise) to CSS angle (0° = top, clockwise)
  angle = (angle + 90 + 360) % 360;

  const distance = Math.sqrt(x * x + y * y);
  const maxDistance = rect.width / 2;
  // Distance from center determines how much white is mixed in (lightness)
  // Center = white (l=1), edge = pure color (l=0.5 for HSL)
  const distanceRatio = Math.min(distance / maxDistance, 1);
  const lightness = 1 - distanceRatio * 0.5; // 1.0 at center, 0.5 at edge

  const [r, g, b] = hslToRgb(angle, 1, lightness);
  settings.value[key] = rgbToHex(r, g, b);
};

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
            background: `conic-gradient(from 0deg,
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
          <!-- White to transparent overlay for lightness -->
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
            :style="{
              backgroundColor: isValidHexColor(settings[config.key])
                ? settings[config.key]
                : '#ffffff',
            }"
          ></div>
          <input
            type="text"
            v-model="settings[config.key]"
            :class="[
              'flex-1 px-3 py-2 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2',
              isValidHexColor(settings[config.key])
                ? 'border-gray-300 focus:ring-blue-500'
                : 'border-red-500 focus:ring-red-500 bg-red-50',
            ]"
            placeholder="#000000"
          />
        </div>
        <p
          v-if="!isValidHexColor(settings[config.key])"
          class="text-red-500 text-xs mb-2"
        >
          Введите цвет в формате #RRGGBB (например #ff5500)
        </p>

        <!-- Quick color presets -->
        <div class="flex items-center gap-2 mb-3">
          <span class="text-xs text-gray-500 mr-1">Быстрый выбор:</span>
          <button
            @click="settings[config.key] = '#000000'"
            class="w-6 h-6 rounded border border-gray-300 bg-black hover:ring-2 hover:ring-blue-400"
            title="Чёрный"
          ></button>
          <button
            @click="settings[config.key] = '#ffffff'"
            class="w-6 h-6 rounded border border-gray-300 bg-white hover:ring-2 hover:ring-blue-400"
            title="Белый"
          ></button>
          <button
            @click="settings[config.key] = '#171717'"
            class="w-6 h-6 rounded border border-gray-300 hover:ring-2 hover:ring-blue-400"
            style="background-color: #171717"
            title="Тёмно-серый"
          ></button>
          <button
            @click="settings[config.key] = '#525252'"
            class="w-6 h-6 rounded border border-gray-300 hover:ring-2 hover:ring-blue-400"
            style="background-color: #525252"
            title="Серый"
          ></button>
          <button
            @click="settings[config.key] = '#a3a3a3'"
            class="w-6 h-6 rounded border border-gray-300 hover:ring-2 hover:ring-blue-400"
            style="background-color: #a3a3a3"
            title="Светло-серый"
          ></button>
        </div>

        <!-- Native color picker -->
        <div class="flex items-center gap-2">
          <input
            type="color"
            v-model="settings[config.key]"
            class="w-10 h-10 rounded cursor-pointer border-0"
          />
          <span class="text-sm text-gray-500">полная палитра</span>
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
