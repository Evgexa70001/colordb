import Equipment from '../../components/Equipment';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export default function EquipmentPage() {
  return (
    <ProtectedRoute>
      <Equipment />
    </ProtectedRoute>
  );
}
