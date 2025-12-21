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
  category?: Category;
}

export interface Lending {
  id: number;
  title: string;
  value: string;
  valueAz: string;
}
