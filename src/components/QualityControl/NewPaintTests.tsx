import { useState, useEffect } from 'react'
import {
	Plus,
	Eye,
	CheckCircle,
	XCircle,
	Clock,
	AlertTriangle,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { ReferencePaint, NewPaintTest } from '@/types'
import { 
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS
} from '@/utils/colorUtils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface NewPaintTestsProps {
	referencePaints: ReferencePaint[]
	newPaintTests: NewPaintTest[]
	onAdd: (test: Omit<NewPaintTest, 'id' | 'testedAt' | 'testedBy'>) => void
	onDelete: (id: string) => void
}

const NewPaintTests: React.FC<NewPaintTestsProps> = ({
	referencePaints,
	newPaintTests,
	onAdd,
	onDelete,
}) => {
	const { isDark } = useTheme()
	const [isAddModalOpen, setIsAddModalOpen] = useState(false)
	const [viewingTest, setViewingTest] = useState<NewPaintTest | null>(null)
	const [formData, setFormData] = useState({
		name: '',
		supplier: '',
		expiryDate: '',
		l: '',
		a: '',
		b: '',
		referencePaintId: '',
		notes: '',
	})
	const [calculatedDeltaE, setCalculatedDeltaE] = useState<number | null>(null)
	const [selectedCalibration, setSelectedCalibration] = useState<string>('xrite')

	useEffect(() => {
		if (formData.referencePaintId && formData.l && formData.a && formData.b) {
			const referencePaint = referencePaints.find(
				p => p.id === formData.referencePaintId
			)
			if (referencePaint) {
				const deltaE = calculateDeltaEWithCalibration(
					{
						l: parseFloat(formData.l),
						a: parseFloat(formData.a),
						b: parseFloat(formData.b),
					},
					referencePaint.labValues,
					SPECTROPHOTOMETER_CALIBRATIONS[selectedCalibration]
				)
				setCalculatedDeltaE(deltaE)
			}
		} else {
			setCalculatedDeltaE(null)
		}
	}, [
		formData.referencePaintId,
		formData.l,
		formData.a,
		formData.b,
		referencePaints,
		selectedCalibration,
	])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const labValues = {
			l: parseFloat(formData.l),
			a: parseFloat(formData.a),
			b: parseFloat(formData.b),
		}

		const status =
			calculatedDeltaE !== null && calculatedDeltaE <= 2 ? 'passed' : 'failed'

		onAdd({
			name: formData.name,
			supplier: formData.supplier,
			expiryDate: new Date(formData.expiryDate),
			labValues,
			referencePaintId: formData.referencePaintId || undefined,
			deltaE2000: calculatedDeltaE || undefined,
			status,
			notes: formData.notes || undefined,
		})

		setIsAddModalOpen(false)
		setFormData({
			name: '',
			supplier: '',
			expiryDate: '',
			l: '',
			a: '',
			b: '',
			referencePaintId: '',
			notes: '',
		})
		setCalculatedDeltaE(null)
		setSelectedCalibration('xrite')
	}

	const handleDelete = (id: string) => {
		if (confirm('Вы уверены, что хотите удалить этот тест?')) {
			onDelete(id)
		}
	}

	const getStatusIcon = (status: 'pending' | 'passed' | 'failed') => {
		switch (status) {
			case 'passed':
				return <CheckCircle className='w-4 h-4 text-green-500' />
			case 'failed':
				return <XCircle className='w-4 h-4 text-red-500' />
			default:
				return <Clock className='w-4 h-4 text-yellow-500' />
		}
	}

	const getStatusText = (status: 'pending' | 'passed' | 'failed') => {
		switch (status) {
			case 'passed':
				return 'Прошел'
			case 'failed':
				return 'Не прошел'
			default:
				return 'В ожидании'
		}
	}

	const getDeltaEColor = (deltaE: number) => {
		if (deltaE <= 1) return 'text-green-500'
		if (deltaE <= 2) return 'text-yellow-500'
		return 'text-red-500'
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
					Тестирование новых красок
				</h3>
				<Button
					onClick={() => setIsAddModalOpen(true)}
					className='flex items-center gap-2'
				>
					<Plus className='w-4 h-4' />
					Новый тест
				</Button>
			</div>

			{/* Список тестов */}
			<div className='grid gap-4'>
				{newPaintTests.map(test => {
					const referencePaint = test.referencePaintId
						? referencePaints.find(p => p.id === test.referencePaintId)
						: null

					return (
						<div
							key={test.id}
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
											{test.name}
										</h4>
										{getStatusIcon(test.status)}
									</div>
									<p
										className={`text-sm ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										Поставщик: {test.supplier}
									</p>
									<p
										className={`text-sm ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										LAB: L={test.labValues.l.toFixed(2)}, a=
										{test.labValues.a.toFixed(2)}, b=
										{test.labValues.b.toFixed(2)}
									</p>
									{test.deltaE2000 && (
										<p
											className={`text-sm font-medium ${getDeltaEColor(
												test.deltaE2000
											)}`}
										>
											ΔE 2000: {test.deltaE2000.toFixed(2)}
										</p>
									)}
									{referencePaint && (
										<p
											className={`text-sm ${
												isDark ? 'text-gray-400' : 'text-gray-600'
											}`}
										>
											Эталон: {referencePaint.name}
										</p>
									)}
									<p
										className={`text-xs ${
											isDark ? 'text-gray-500' : 'text-gray-500'
										}`}
									>
										Протестирован:{' '}
										{new Date(test.testedAt).toLocaleDateString('ru-RU')}
									</p>
									<p
										className={`text-xs ${
											isDark ? 'text-gray-500' : 'text-gray-500'
										}`}
									>
										Срок годности:{' '}
										{new Date(test.expiryDate).toLocaleDateString('ru-RU')}
									</p>
									{test.notes && (
										<p
											className={`text-sm mt-2 ${
												isDark ? 'text-gray-400' : 'text-gray-600'
											}`}
										>
											{test.notes}
										</p>
									)}
								</div>
								<div className='flex gap-2'>
									<button
										onClick={() => setViewingTest(test)}
										className={`p-2 rounded-lg ${
											isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
										}`}
										title='Просмотр'
									>
										<Eye className='w-4 h-4' />
									</button>
									<button
										onClick={() => handleDelete(test.id)}
										className={`p-2 rounded-lg text-red-500 ${
											isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
										}`}
										title='Удалить'
									>
										<AlertTriangle className='w-4 h-4' />
									</button>
								</div>
							</div>
						</div>
					)
				})}
			</div>

			{/* Модальное окно добавления */}
			{isAddModalOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div
						className={`p-6 rounded-lg w-full max-w-md ${
							isDark ? 'bg-gray-800' : 'bg-white'
						}`}
					>
						<h3
							className={`text-lg font-semibold mb-4 ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							Новый тест краски
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
									Срок годности
								</label>
								<input
									type='date'
									value={formData.expiryDate}
									onChange={e =>
										setFormData({ ...formData, expiryDate: e.target.value })
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
									Эталон для сравнения
								</label>
								<select
									value={formData.referencePaintId}
									onChange={e =>
										setFormData({
											...formData,
											referencePaintId: e.target.value,
										})
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								>
									<option value=''>Выберите эталон</option>
									{referencePaints
										.filter(p => p.status === 'active')
										.map(paint => (
											<option key={paint.id} value={paint.id}>
												{paint.name} ({paint.supplier})
											</option>
										))}
								</select>
							</div>
							
							{calculatedDeltaE !== null && (
								<div
									className={`p-3 rounded-lg ${
										isDark ? 'bg-gray-700' : 'bg-gray-50'
									}`}
								>
									<p
										className={`text-sm font-medium ${getDeltaEColor(
											calculatedDeltaE
										)}`}
									>
										ΔE с калибровкой: {calculatedDeltaE.toFixed(2)}
									</p>
									<p
										className={`text-xs ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										{calculatedDeltaE <= 1
											? 'Отличное совпадение'
											: calculatedDeltaE <= 2
											? 'Хорошее совпадение'
											: 'Плохое совпадение'}
									</p>
								</div>
							)}
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
										setFormData({
											name: '',
											supplier: '',
											expiryDate: '',
											l: '',
											a: '',
											b: '',
											referencePaintId: '',
											notes: '',
										})
										setCalculatedDeltaE(null)
									}}
								>
									Отмена
								</Button>
								<Button type='submit'>Добавить тест</Button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Модальное окно просмотра */}
			{viewingTest && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
					<div
						className={`p-6 rounded-lg w-full max-w-md ${
							isDark ? 'bg-gray-800' : 'bg-white'
						}`}
					>
						<div className='flex justify-between items-start mb-4'>
							<h3
								className={`text-lg font-semibold ${
									isDark ? 'text-white' : 'text-gray-900'
								}`}
							>
								{viewingTest.name}
							</h3>
							{getStatusIcon(viewingTest.status)}
						</div>
						<div className='space-y-3'>
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>Поставщик:</strong> {viewingTest.supplier}
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
									L: {viewingTest.labValues.l.toFixed(2)}
								</p>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									a: {viewingTest.labValues.a.toFixed(2)}
								</p>
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									b: {viewingTest.labValues.b.toFixed(2)}
								</p>
							</div>
							{viewingTest.deltaE2000 && (
								<p
									className={`text-sm font-medium ${getDeltaEColor(
										viewingTest.deltaE2000
									)}`}
								>
									<strong>ΔE 2000:</strong> {viewingTest.deltaE2000.toFixed(2)}
								</p>
							)}
							{viewingTest.referencePaintId && (
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									<strong>Эталон:</strong>{' '}
									{
										referencePaints.find(
											p => p.id === viewingTest.referencePaintId
										)?.name
									}
								</p>
							)}
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>Статус:</strong> {getStatusText(viewingTest.status)}
							</p>
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>Протестирован:</strong>{' '}
								{new Date(viewingTest.testedAt).toLocaleDateString('ru-RU')}
							</p>
							<p
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								<strong>Срок годности:</strong>{' '}
								{new Date(viewingTest.expiryDate).toLocaleDateString('ru-RU')}
							</p>
							{viewingTest.notes && (
								<p
									className={`text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									<strong>Заметки:</strong> {viewingTest.notes}
								</p>
							)}
						</div>
						<div className='flex justify-end mt-6'>
							<Button onClick={() => setViewingTest(null)} variant='outline'>
								Закрыть
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default NewPaintTests
