export interface PantoneColor {
  id: string;
  name: string;
  hex: string;
  category: string;
  recipe?: string | undefined;
  customers?: string[];
  inStock: boolean;
  notes?: string | undefined;
  manager?: string | undefined;
}

export interface Recipe {
  totalAmount: number;
  material: string;
  anilox?: string;
  comment?: string;
  items: RecipeItem[];
}

export interface RecipeItem {
  paint: string;
  amount: number;
}

export interface ColorModalProps {
  color: PantoneColor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedColor: PantoneColor) => void;
  categories: string[];
}

export interface ColorDetailsModalProps {
  color: PantoneColor;
  isOpen: boolean;
  onClose: () => void;
  similarColors: PantoneColor[];
}

export interface NewColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newColor: Omit<PantoneColor, 'id'>) => void;
  categories: string[];
}

export interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: string) => void;
  existingCategories: string[];
}

export interface User {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}