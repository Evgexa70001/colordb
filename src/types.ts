// User types
export interface User {
  uid: string;
  email: string | null;
  isAdmin: boolean;
}

// Color types
export interface PantoneColor {
  id: string;
  name: string;
  hex: string;
  category: string;
  recipe?: string;
  customers?: string[];
  inStock: boolean;
  notes?: string;
  manager?: string;
}

// Modal Props
export interface ColorModalProps {
  color: PantoneColor;
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: PantoneColor) => void;
  categories: string[];
}

export interface NewColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (color: Omit<PantoneColor, 'id'>) => void;
  categories: string[];
}

export interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  existingCategories: string[];
}

export interface ColorDetailsModalProps {
  color: PantoneColor;
  isOpen: boolean;
  onClose: () => void;
  similarColors: (PantoneColor & { distance?: number })[];
}

// Recipe types
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

// Color info types
export interface ColorInfo {
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  cmyk: {
    c: number;
    m: number;
    y: number;
    k: number;
  };
  lab: {
    l: number;
    a: number;
    b: number;
  };
}