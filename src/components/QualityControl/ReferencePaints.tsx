import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { ReferencePaint } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface ReferencePaintsProps {
	referencePaints: ReferencePaint[]
	onAdd: (paint: Omit<ReferencePaint, 'id' | 'createdBy'>) => void
	onUpdate: (id: string, paint: Partial<ReferencePaint>) => void
	onDelete: (id: string) => void
}

const ReferencePaints: React.FC<ReferencePaintsProps> = ({
	referencePaints,
	onAdd,
	onUpdate,
	onDelete,
}) => {
	const { isDark } = useTheme()
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [editingPaint, setEditingPaint] = useState<ReferencePaint | null>(null)
	const [viewingPaint, setViewingPaint] = useState<ReferencePaint | null>(null)
	const [formData, setFormData] = useState({
		name: '',
		supplier: '',
		createdAt: new Date().toISOString().split('T')[0], // Текущая дата по умолчанию
		l: '',
		a: '',
		b: '',
		notes: '',
	})

	useEffect(() => {
		if (editingPaint) {
			setFormData({
				name: editingPaint.name,
				supplier: editingPaint.supplier,
				createdAt: new Date(editingPaint.createdAt).toISOString().split('T')[0],
				l: editingPaint.labValues.l.toString(),
				a: editingPaint.labValues.a.toString(),
				b: editingPaint.labValues.b.toString(),
				notes: editingPaint.notes || '',
			})
		}
	}, [editingPaint])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const labValues = {
			l: parseFloat(formData.l),
			a: parseFloat(formData.a),
			b: parseFloat(formData.b),
		}

		if (editingPaint) {
			onUpdate(editingPaint.id, {
				name: formData.name,
				supplier: formData.supplier,
				labValues,
				notes: formData.notes || undefined,
			})
			setEditingPaint(null)
		} else {
			onAdd({
				name: formData.name,
				supplier: formData.supplier,
				labValues,
				notes: formData.notes || undefined,
				status: 'active',
				createdAt: new Date(formData.createdAt),
			})
			setIsAddModalOpen(false)
		}

		setFormData({
			name: '',
			supplier: '',
			createdAt: new Date().toISOString().split('T')[0],
			l: '',
			a: '',
			b: '',
			notes: '',
		})
	}

	const handleDelete = (id: string) => {
		if (confirm('Вы уверены, что хотите удалить этот эталон?')) {
			onDelete(id)
		}
	}

	const getStatusIcon = (status: 'active' | 'inactive') => {
		return status === 'active' ? (
			<CheckCircle className='w-4 h-4 text-green-500' />
		) : (
			<XCircle className='w-4 h-4 text-red-500' />
		)
	}

	return (
		<div className='space-y-4'>
			{/* Заголовок и кнопка добавления */}
			<div className='flex justify-between items-center'>
				<h3
					className={`text-lg font-semibold ${
						isDark ? 'text-white' : 'text-gray-900'
					}`}
				>
					Эталонные краски
				</h3>
				<Button
					onClick={() => setIsAddModalOpen(true)}
					className='flex items-center gap-2'
				>
					<Plus className='w-4 h-4' />
					Добавить эталон
				</Button>
			</div>

			{/* Список эталонов */}
			<div className='grid gap-4'>
				{referencePaints.map(paint => (
					<div
						key={paint.id}
						className={`p-4 rounded-lg border ${
							isDark
								? 'bg-gray-800 border-gray-700'
								: 'bg-white border-gray-200'
						} shadow-sm`}
					>
						<div className='flex justify-between items-start'>
							<div className='flex-1'>
								<div className='flex items-center gap-2 mb-2'>
									<h4
										className={`font-medium ${
											isDark ? 'text-white' : 'text-gray-900'
										}`}
									>
										{paint.name}
									</h4>
									{getStatusIcon(paint.status)}
								</div>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									Поставщик: {paint.supplier}
								</p>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									LAB: L={paint.labValues.l.toFixed(2)}, a=
									{paint.labValues.a.toFixed(2)}, b=
									{paint.labValues.b.toFixed(2)}
								</p>
								<p
									className={`text-xs ${
										isDark ? 'text-gray-500' : 'text-gray-500'
									}`}
								>
									Создан:{' '}
									{new Date(paint.createdAt).toLocaleDateString('ru-RU')}
								</p>
								{paint.notes && (
									<p
										className={`text-sm mt-2 ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										{paint.notes}
									</p>
								)}
							</div>
							<div className='flex gap-2'>
								<button
									onClick={() => setViewingPaint(paint)}
									className={`p-2 rounded-lg ${
										isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
									}`}
									title='Просмотр'
								>
									<Eye className='w-4 h-4' />
								</button>
								<button
									onClick={() => setEditingPaint(paint)}
									className={`p-2 rounded-lg ${
										isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
									}`}
									title='Редактировать'
								>
									<Edit className='w-4 h-4' />
								</button>
								<button
									onClick={() => handleDelete(paint.id)}
									className={`p-2 rounded-lg text-red-500 ${
										isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
									}`}
									title='Удалить'
								>
									<Trash2 className='w-4 h-4' />
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Модальное окно добавления/редактирования */}
			{(isAddModalOpen || editingPaint) && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div
						className={`p-6 rounded-lg w-full max-w-md ${
							isDark ? 'bg-gray-800' : 'bg-white'
						} max-h-[90vh] overflow-y-auto`}
					>
						<h3
							className={`text-lg font-semibold mb-4 ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							{editingPaint ? 'Редактировать эталон' : 'Добавить эталон'}
						</h3>
						<form onSubmit={handleSubmit} className='space-y-4'>
							<Input
								label='Название краски'
								value={formData.name}
								onChange={e =>
									setFormData({ ...formData, name: e.target.value })
								}
								required
							/>
							<Input
								label='Поставщик'
								value={formData.supplier}
								onChange={e =>
									setFormData({ ...formData, supplier: e.target.value })
								}
								required
							/>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Дата создания эталона
								</label>
								<input
									type='date'
									value={formData.createdAt}
									onChange={e =>
										setFormData({ ...formData, createdAt: e.target.value })
									}
									required
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								/>
							</div>
							<div className='grid grid-cols-3 gap-4'>
								<Input
									label='L'
									type='number'
									step='0.01'
									value={formData.l}
									onChange={e =>
										setFormData({ ...formData, l: e.target.value })
									}
									required
								/>
								<Input
									label='a'
									type='number'
									step='0.01'
									value={formData.a}
									onChange={e =>
										setFormData({ ...formData, a: e.target.value })
									}
									required
								/>
								<Input
									label='b'
									type='number'
									step='0.01'
									value={formData.b}
									onChange={e =>
										setFormData({ ...formData, b: e.target.value })
									}
									required
								/>
							</div>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Заметки
								</label>
								<textarea
									value={formData.notes}
									onChange={e =>
										setFormData({ ...formData, notes: e.target.value })
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none`}
									rows={3}
								/>
							</div>
							<div className='flex gap-2 justify-end'>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										setIsAddModalOpen(false)
										setEditingPaint(null)
										setFormData({
											name: '',
											supplier: '',
											createdAt: new Date().toISOString().split('T')[0],
											l: '',
											a: '',
											b: '',
											notes: '',
										})
									}}
								>
									Отмена
								</Button>
								<Button type='submit'>
									{editingPaint ? 'Сохранить' : 'Добавить'}
								</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Модальное окно просмотра */}
			{viewingPaint && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div
						className={`p-6 rounded-lg w-full max-w-md 
							${isDark ? 'bg-gray-800' : 'bg-white'}
							max-h-[90vh] overflow-y-auto`}
					>
						<div className='flex justify-between items-start mb-4'>
							<h3
								className={`text-lg font-semibold ${
									isDark ? 'text-white' : 'text-gray-900'
								}`}
							>
								{viewingPaint.name}
							</h3>
							{getStatusIcon(viewingPaint.status)}
						</div>
						<div className='space-y-3'>
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>Поставщик:</strong> {viewingPaint.supplier}
							</p>
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>LAB координаты:</strong>
							</p>
							<div className='ml-4 space-y-1'>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									L: {viewingPaint.labValues.l.toFixed(2)}
								</p>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									a: {viewingPaint.labValues.a.toFixed(2)}
								</p>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									b: {viewingPaint.labValues.b.toFixed(2)}
								</p>
							</div>
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>Создан:</strong>{' '}
								{new Date(viewingPaint.createdAt).toLocaleDateString('ru-RU')}
							</p>
							{viewingPaint.notes && (
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									<strong>Заметки:</strong> {viewingPaint.notes}
								</p>
							)}
						</div>
						<div className='flex justify-end mt-6'>
							<Button onClick={() => setViewingPaint(null)} variant='outline'>
								Закрыть
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default ReferencePaints
