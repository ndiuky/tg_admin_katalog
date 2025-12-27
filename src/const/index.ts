export const API_BASE_URL = "https://ndiuky.site:20000/api";
export const MEDIA_BASE_URL = "https://ndiuky.site:20000";

/**
 * Resolve image URL - handles both external URLs and local uploads
 * @param imageUrl - URL from database (can be external https:// or local /uploads/...)
 * @returns Full URL ready for use in img src
 */
export function resolveImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    return "/media/default_item_image.png";
  }

  // If it's already an external URL (http:// or https://), use as-is
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // If it's a local path, prepend the base URL
  // Handle both /uploads/... and uploads/... formats
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${MEDIA_BASE_URL}${path}`;
}

/**
 * Product types with their available sizes
 */
export interface ProductType {
  id: string;
  label: string;
  labelAz: string;
  sizes: string[];
}

export const PRODUCT_TYPES: ProductType[] = [
  {
    id: "clothing",
    label: "Одежда (верх)",
    labelAz: "Geyim (üst)",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  },
  {
    id: "pants",
    label: "Брюки/Джинсы",
    labelAz: "Şalvar/Cins",
    sizes: [
      "26",
      "27",
      "28",
      "29",
      "30",
      "31",
      "32",
      "33",
      "34",
      "36",
      "38",
      "40",
    ],
  },
  {
    id: "shoes",
    label: "Обувь",
    labelAz: "Ayaqqabı",
    sizes: [
      "35",
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
      "43",
      "44",
      "45",
      "46",
    ],
  },
  {
    id: "accessories",
    label: "Аксессуары",
    labelAz: "Aksesuarlar",
    sizes: ["One Size"],
  },
  {
    id: "rings",
    label: "Кольца",
    labelAz: "Üzüklər",
    sizes: ["15", "16", "17", "18", "19", "20", "21", "22"],
  },
  {
    id: "other",
    label: "Другое",
    labelAz: "Digər",
    sizes: [],
  },
];

/**
 * Get sizes for a specific product type
 */
export function getSizesForType(typeId: string): string[] {
  const productType = PRODUCT_TYPES.find((t) => t.id === typeId);
  return productType?.sizes || [];
}

/**
 * Get product type by ID
 */
export function getProductType(typeId: string): ProductType | undefined {
  return PRODUCT_TYPES.find((t) => t.id === typeId);
}
