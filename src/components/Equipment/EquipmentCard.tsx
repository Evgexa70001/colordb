import { Plus } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';

interface EquipmentCardProps {
  isAddCard?: boolean;
  onClick: () => void;
}

export default function EquipmentCard({ isAddCard, onClick }: EquipmentCardProps) {
  const { isDark } = useTheme();

  if (isAddCard) {
    return (
      <button
        onClick={onClick}
        className={`w-full h-[300px] rounded-2xl transition-all duration-200 flex items-center justify-center ${
          isDark
            ? 'bg-gray-800/50 hover:bg-gray-800 border-gray-700'
            : 'bg-white hover:bg-gray-50 border-gray-200'
        } border shadow-sm hover:shadow-md`}>
        <Plus
          className={`w-16 h-16 ${
            isDark
              ? 'text-gray-400 group-hover:text-gray-300'
              : 'text-gray-600 group-hover:text-gray-700'
          }`}
        />
      </button>
    );
  }

  return null;
}
