import { useState, useEffect } from 'react'
import { X, AlertTriangle, Search } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import type { ColorDeviation, PantoneColor } from '@/types'
import { getColors } from '@/lib/colors'
import { saveDeviation } from '@/lib/deviations'
import toast from 'react-hot-toast'

interface NewDeviationModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (deviation: ColorDeviation) => void
}

const NewDeviationModal: React.FC<NewDeviationModalProps> = ({
	isOpen,
	onClose,
	onSave,
}) => {
	const { isDark } = useTheme()
	const [loading, setLoading] = useState(false)
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [filteredColors, setFilteredColors] = useState<PantoneColor[]>([])
	const [colorSearchTerm, setColorSearchTerm] = useState('')
	const [showColorDropdown, setShowColorDropdown] = useState(false)
	const [formData, setFormData] = useState({
		colorId: '',
		colorName: '',
		deviationType: 'color_mismatch' as ColorDeviation['deviationType'],
		techCardNumber: '',
		description: '',
		originalValues: {
			hex: '',
			lab: { l: 0, a: 0, b: 0 },
			recipe: '',
		},
		targetValues: {
			hex: '',
			lab: { l: 0, a: 0, b: 0 },
			recipe: '',
		},
		referenceCoordinates: {
			l: 0,
			a: 0,
			b: 0,
		},
		currentCoordinates: {
			l: 0,
			a: 0,
			b: 0,
		},
		deltaE: {
			deltaE2000: 0,
		},
		assignedTo: '',
	})

	useEffect(() => {
		if (isOpen) {
			loadColors()
		}
	}, [isOpen])

	useEffect(() => {
		if (colorSearchTerm.trim() === '') {
			setFilteredColors(colors)
		} else {
			const filtered = colors.filter(
				color =>
					color.name.toLowerCase().includes(colorSearchTerm.toLowerCase()) ||
					(color.alternativeName &&
						color.alternativeName
							.toLowerCase()
							.includes(colorSearchTerm.toLowerCase()))
			)
			setFilteredColors(filtered)
		}
	}, [colorSearchTerm, colors])

	const loadColors = async () => {
		try {
			const colorsData = await getColors()
			setColors(colorsData)
			setFilteredColors(colorsData)
		} catch (error) {
			console.error('Error loading colors:', error)
			toast.error('Ошибка загрузки цветов')
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		if (!formData.colorId || !formData.description) {
			toast.error('Заполните обязательные поля')
			setLoading(false)
			return
		}

		try {
			const selectedColor = colors.find(c => c.id === formData.colorId)

			const newDeviation: Omit<ColorDeviation, 'id'> = {
				...formData,
				colorName: selectedColor?.name || formData.colorName,
				detectedAt: new Date(),
				detectedBy: 'current-user', // В реальном приложении получать из контекста аутентификации
				correctionApplied: false,
				status: 'open',
			}

			const docRef = await saveDeviation(newDeviation)

			// Создаем объект с ID для обновления состояния
			const savedDeviation: ColorDeviation = {
				...newDeviation,
				id: docRef.id,
			}

			onSave(savedDeviation)
			onClose()
			resetForm()
			toast.success('Отклонение добавлено в журнал')
		} catch (error) {
			console.error('Error saving deviation:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при сохранении отклонения')
			}
		} finally {
			setLoading(false)
		}
	}

	const resetForm = () => {
		setFormData({
			colorId: '',
			colorName: '',
			deviationType: 'color_mismatch',
			techCardNumber: '',
			description: '',
			originalValues: {
				hex: '',
				lab: { l: 0, a: 0, b: 0 },
				recipe: '',
			},
			targetValues: {
				hex: '',
				lab: { l: 0, a: 0, b: 0 },
				recipe: '',
			},
			referenceCoordinates: {
				l: 0,
				a: 0,
				b: 0,
			},
			currentCoordinates: {
				l: 0,
				a: 0,
				b: 0,
			},
			deltaE: {
				deltaE2000: 0,
			},
			assignedTo: '',
		})
		setColorSearchTerm('')
		setShowColorDropdown(false)
	}

	const handleColorSelect = (color: PantoneColor) => {
		setFormData(prev => ({
			...prev,
			colorId: color.id,
			colorName: color.name,
			originalValues: {
				...prev.originalValues,
				hex: color.hex,
				lab: color.labValues || { l: 0, a: 0, b: 0 },
			},
		}))
		setColorSearchTerm(color.name)
		setShowColorDropdown(false)
	}

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 z-50 overflow-y-auto'>
			<div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
				<div
					className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
					onClick={onClose}
				/>

				<div
					className={`inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-xl shadow-xl ${
						isDark ? 'bg-gray-800' : 'bg-white'
					}`}
				>
					<div className='flex items-center justify-between mb-6'>
						<h3
							className={`text-lg font-medium flex items-center ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							<AlertTriangle className='w-5 h-5 mr-2 text-orange-500' />
							Новое отклонение
						</h3>
						<button
							onClick={onClose}
							className={`p-2 rounded-lg transition-colors ${
								isDark
									? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
									: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
							}`}
						>
							<X className='w-5 h-5' />
						</button>
					</div>

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							{/* Поиск и выбор цвета */}
							<div className='relative'>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									Цвет *
								</label>
								<div className='relative'>
									<div className='relative'>
										<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
										<input
											type='text'
											value={colorSearchTerm}
											onChange={e => {
												setColorSearchTerm(e.target.value)
												setShowColorDropdown(true)
											}}
											onFocus={() => setShowColorDropdown(true)}
											placeholder='Поиск цвета...'
											required
											className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
													: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
											} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
										/>
									</div>

									{showColorDropdown && filteredColors.length > 0 && (
										<div
											className={`absolute z-10 w-full mt-1 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
												isDark
													? 'bg-gray-700 border-gray-600'
													: 'bg-white border-gray-300'
											}`}
										>
											{filteredColors.slice(0, 10).map(color => (
												<button
													key={color.id}
													type='button'
													onClick={() => handleColorSelect(color)}
													className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-3 ${
														isDark ? 'text-white' : 'text-gray-900'
													}`}
												>
													<div
														className='w-4 h-4 rounded border'
														style={{ backgroundColor: color.hex }}
													/>
													<div>
														<div className='font-medium'>{color.name}</div>
														{color.alternativeName && (
															<div className='text-xs text-gray-500'>
																{color.alternativeName}
															</div>
														)}
													</div>
												</button>
											))}
										</div>
									)}
								</div>
							</div>

							{/* Тип отклонения */}
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									Тип отклонения
								</label>
								<select
									value={formData.deviationType}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											deviationType: e.target.value as any,
										}))
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								>
									<option value='color_mismatch'>Несоответствие цвета</option>
									<option value='recipe_adjustment'>
										Корректировка рецептуры
									</option>
									<option value='quality_issue'>Проблема качества</option>
		
									<option value='production_error'>Ошибка производства</option>
								</select>
							</div>

							{/* Номер тех.карты */}
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									Номер тех.карты
								</label>
								<input
									type='text'
									value={formData.techCardNumber}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											techCardNumber: e.target.value,
										}))
									}
									placeholder='Например: ТК-001'
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								/>
							</div>

							{/* ΔE 2000 */}
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									ΔE 2000
								</label>
								<input
									type='number'
									step='0.1'
									min='0'
									value={formData.deltaE.deltaE2000}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											deltaE: {
												deltaE2000: parseFloat(e.target.value) || 0,
											},
										}))
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								/>
							</div>
						</div>

						{/* Описание */}
						<div>
							<label
								className={`block text-sm font-medium mb-2 ${
									isDark ? 'text-gray-200' : 'text-gray-700'
								}`}
							>
								Описание отклонения *
							</label>
							<textarea
								value={formData.description}
								onChange={e =>
									setFormData(prev => ({
										...prev,
										description: e.target.value,
									}))
								}
								required
								rows={3}
								placeholder='Подробное описание обнаруженного отклонения...'
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
										: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
							/>
						</div>

						{/* Координаты эталона и текущего образца */}
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
							{/* Координаты эталона */}
							<div>
								<h4
									className={`text-sm font-medium mb-3 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									Координаты эталона (LAB)
								</h4>
								<div className='grid grid-cols-3 gap-2'>
									<div>
										<label className='block text-xs text-gray-500 mb-1'>
											L*
										</label>
										<input
											type='number'
											step='0.01'
											min='0'
											max='100'
											value={formData.referenceCoordinates.l}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													referenceCoordinates: {
														...prev.referenceCoordinates,
														l: parseFloat(e.target.value) || 0,
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-1 focus:ring-blue-500`}
										/>
									</div>
									<div>
										<label className='block text-xs text-gray-500 mb-1'>
											a*
										</label>
										<input
											type='number'
											step='0.01'
											min='-128'
											max='127'
											value={formData.referenceCoordinates.a}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													referenceCoordinates: {
														...prev.referenceCoordinates,
														a: parseFloat(e.target.value) || 0,
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-1 focus:ring-blue-500`}
										/>
									</div>
									<div>
										<label className='block text-xs text-gray-500 mb-1'>
											b*
										</label>
										<input
											type='number'
											step='0.01'
											min='-128'
											max='127'
											value={formData.referenceCoordinates.b}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													referenceCoordinates: {
														...prev.referenceCoordinates,
														b: parseFloat(e.target.value) || 0,
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-1 focus:ring-blue-500`}
										/>
									</div>
								</div>
							</div>

							{/* Координаты текущего образца */}
							<div>
								<h4
									className={`text-sm font-medium mb-3 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									Координаты текущего образца (LAB)
								</h4>
								<div className='grid grid-cols-3 gap-2'>
									<div>
										<label className='block text-xs text-gray-500 mb-1'>
											L*
										</label>
										<input
											type='number'
											step='0.01'
											min='0'
											max='100'
											value={formData.currentCoordinates.l}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													currentCoordinates: {
														...prev.currentCoordinates,
														l: parseFloat(e.target.value) || 0,
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-1 focus:ring-blue-500`}
										/>
									</div>
									<div>
										<label className='block text-xs text-gray-500 mb-1'>
											a*
										</label>
										<input
											type='number'
											step='0.01'
											min='-128'
											max='127'
											value={formData.currentCoordinates.a}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													currentCoordinates: {
														...prev.currentCoordinates,
														a: parseFloat(e.target.value) || 0,
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-1 focus:ring-blue-500`}
										/>
									</div>
									<div>
										<label className='block text-xs text-gray-500 mb-1'>
											b*
										</label>
										<input
											type='number'
											step='0.01'
											min='-128'
											max='127'
											value={formData.currentCoordinates.b}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													currentCoordinates: {
														...prev.currentCoordinates,
														b: parseFloat(e.target.value) || 0,
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-1 focus:ring-blue-500`}
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Кнопки действий */}
						<div className='flex justify-end space-x-3 pt-4'>
							<Button type='button' variant='outline' onClick={onClose}>
								Отмена
							</Button>
							<Button
								type='submit'
								disabled={loading}
								className='bg-orange-500 hover:bg-orange-600 text-white'
							>
								{loading ? 'Сохранение...' : 'Создать отклонение'}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

export default NewDeviationModal
