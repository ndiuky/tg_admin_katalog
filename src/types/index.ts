export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: number;
  title: string;
  titleAz: string;
  imageUrl?: string;
  items?: Item[];
}

export interface ItemImage {
  id: number;
  url: string;
  order: number;
  itemId: number;
}

export interface Item {
  id: number;
  title: string;
  titleAz: string;
  description?: string;
  descriptionAz?: string;
  price: number;
  imageUrl?: string;
  size?: string;
  type: string;
  categoryId: number;
  styleId?: number;
  category?: Category;
  images?: ItemImage[];
}

export interface Lending {
  id: number;
  title: string;
  value: string;
  valueAz: string;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
}

export interface Style {
  id: number;
  title: string;
  titleAz: string;
  imageUrl?: string;
}
