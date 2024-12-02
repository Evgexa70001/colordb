import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import EquipmentCard from './Equipment/EquipmentCard';
import EquipmentDataCard from './Equipment/EquipmentDataCard';
import NewEquipmentModal from './Equipment/NewEquipmentModal';
import { getEquipment } from '../lib/equipment';
import type { Equipment } from '../types';
import toast from 'react-hot-toast';
import SkeletonEquipmentCard from './Equipment/SkeletonEquipmentCard';

export default function Equipment() {
  const { isDark } = useTheme();
  const [isNewEquipmentModalOpen, setIsNewEquipmentModalOpen] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | undefined>(undefined);
  const [cardCount, setCardCount] = useState(5);

  const loadEquipment = async () => {
    try {
      setIsLoading(true);
      const data = await getEquipment();
      setEquipment(data);
      setCardCount(data.length);
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    loadEquipment();
  };

  const handleEdit = (item: Equipment) => {
    setSelectedEquipment(item);
    setIsNewEquipmentModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsNewEquipmentModalOpen(false);
    setSelectedEquipment(undefined);
    loadEquipment();
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <EquipmentCard isAddCard onClick={() => setIsNewEquipmentModalOpen(true)} />
            {isLoading
              ? [...Array(cardCount)].map((_, index) => <SkeletonEquipmentCard key={index} />)
              : equipment.map((item) => (
                  <EquipmentDataCard
                    key={item.id}
                    equipment={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={handleDelete}
                  />
                ))}
          </div>
        </div>
      </main>

      <NewEquipmentModal
        isOpen={isNewEquipmentModalOpen}
        onClose={handleCloseModal}
        initialData={selectedEquipment}
      />
    </div>
  );
}
