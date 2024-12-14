import Equipment from '../../components/Equipments';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function EquipmentPage() {
  return (
    <ProtectedRoute>
      <Equipment />
    </ProtectedRoute>
  );
}
