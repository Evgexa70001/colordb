export interface PantoneColor {
  id: string;
  name: string;
  hex: string;
  category: string;
  recipe?: string;
  customers?: string[];
  inStock: boolean;
  notes?: string;
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
