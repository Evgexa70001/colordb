import { Dialog } from '@headlessui/react'
import { X, Info, BarChart3, Package, CheckCircle, Repeat } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { useState, useEffect } from 'react'
import { Button } from '@components/ui/Button'
import { DropdownSelect } from '@components/ui/DropdownSelect/DropdownSelect'
import { getColors } from '@lib/colors'
import { getCategories } from '@lib/categories'
import type { PantoneColor } from '@/types'

interface CategoryInfoModalProps {
	isOpen: boolean
	onClose: () => void
}

interface CategoryStats {
	total: number
	inStock: number
	verified: number
	duplicates: number
	duplicateDetails: Array<{
		name: string
		count: number
		locations: Array<{
			colorName: string
			alternativeName?: string
			isAdditional: boolean
		}>
	}>
}

export default function CategoryInfoModal({ isOpen, onClose }: CategoryInfoModalProps) {
	const { isDark } = useTheme()
	const [selectedCategory, setSelectedCategory] = useState<string>('')
	const [categories, setCategories] = useState<string[]>([])
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [stats, setStats] = useState<CategoryStats | null>(null)
	const [loading, setLoading] = useState(false)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false) // Добавить это состояние

	useEffect(() => {
		if (isOpen) {
			loadData()
		}
	}, [isOpen])

	const loadData = async () => {
		setLoading(true)
		try {
			const [categoriesData, colorsData] = await Promise.all([
				getCategories(),
				getColors()
			])
			setCategories(categoriesData)
			setColors(colorsData)
		} catch (error) {
			console.error('Error loading data:', error)
		} finally {
			setLoading(false)
		}
	}

	const calculateStats = (category: string): CategoryStats => {
		const categoryColors = colors.filter(color => color.category === category)
		
		// Подсчет основных метрик
		const total = categoryColors.length
		const inStock = categoryColors.filter(color => color.inStock).length
		const verified = categoryColors.filter(color => color.isVerified).length

		// Подсчет дубликатов
		const nameCounts = new Map<string, Array<{
			colorName: string
			alternativeName?: string
			isAdditional: boolean
		}>>()

		categoryColors.forEach(color => {
			// Основное название
			if (nameCounts.has(color.name)) {
				nameCounts.get(color.name)!.push({
					colorName: color.name,
					alternativeName: color.alternativeName,
					isAdditional: false
				})
			} else {
				nameCounts.set(color.name, [{
					colorName: color.name,
					alternativeName: color.alternativeName,
					isAdditional: false
				}])
			}

			// Альтернативное название (если есть)
			if (color.alternativeName && color.alternativeName.trim()) {
				if (nameCounts.has(color.alternativeName)) {
					nameCounts.get(color.alternativeName)!.push({
						colorName: color.name,
						alternativeName: color.alternativeName,
						isAdditional: false
					})
				} else {
					nameCounts.set(color.alternativeName, [{
						colorName: color.name,
						alternativeName: color.alternativeName,
						isAdditional: false
					}])
				}
			}

			// Дополнительные цвета
			if (color.additionalColors) {
				color.additionalColors.forEach(additionalColor => {
					if (nameCounts.has(additionalColor.name)) {
						nameCounts.get(additionalColor.name)!.push({
							colorName: color.name,
							alternativeName: color.alternativeName,
							isAdditional: true
						})
					} else {
						nameCounts.set(additionalColor.name, [{
							colorName: color.name,
							alternativeName: color.alternativeName,
							isAdditional: true
						}])
					}
				})
			}
		})

		// Фильтруем только дубликаты
		const duplicateDetails = Array.from(nameCounts.entries())
			.filter(([_, locations]) => locations.length > 1)
			.map(([name, locations]) => ({
				name,
				count: locations.length,
				locations
			}))

		const duplicates = duplicateDetails.reduce((sum, item) => sum + item.count, 0)

		return {
			total,
			inStock,
			verified,
			duplicates,
			duplicateDetails
		}
	}

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category)
		setIsDropdownOpen(false) // Закрыть dropdown после выбора
		if (category) {
			const categoryStats = calculateStats(category)
			setStats(categoryStats)
		} else {
			setStats(null)
		}
	}

	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div
				className='fixed inset-0 bg-black/50 backdrop-blur-sm'
				aria-hidden='true'
			/>
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel
					className={`mx-auto max-w-2xl w-full rounded-xl p-6 shadow-2xl ${
						isDark ? 'bg-gray-800/95' : 'bg-white/95'
					} max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-md border ${
						isDark ? 'border-gray-700' : 'border-gray-200'
					}`}
				>
					<div className='flex justify-between items-start mb-6'>
						<Dialog.Title
							className={`text-2xl font-bold flex items-center gap-3 ${
								isDark ? 'text-gray-100' : 'text-gray-900'
							}`}
						>
							<Info className='w-6 h-6 text-blue-500' />
							Информация по категориям
						</Dialog.Title>
						<button
							onClick={onClose}
							className={`p-2 rounded-full transition-colors duration-200 ${
								isDark
									? 'hover:bg-gray-700/70 text-gray-400 hover:text-gray-200'
									: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
							}`}
						>
							<X className='w-6 h-6' />
						</button>
					</div>

					<div className='space-y-6'>
						{/* Выбор категории */}
						<div>
							<label className={`block text-sm font-medium mb-2 ${
								isDark ? 'text-gray-300' : 'text-gray-700'
							}`}>
								Выберите категорию
							</label>
							<DropdownSelect
								options={categories.map(cat => ({ id: cat, label: cat }))}
								value={selectedCategory}
								onChange={handleCategoryChange}
								label={loading ? "Загрузка..." : "Выберите категорию..."}
								isOpen={isDropdownOpen}
								onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
								id="category-select"
							/>
						</div>

						{/* Статистика */}
						{stats && (
							<div className='space-y-4'>
								<h3 className={`text-lg font-semibold ${
									isDark ? 'text-gray-200' : 'text-gray-800'
								}`}>
									Статистика по категории "{selectedCategory}"
								</h3>

								{/* Основные метрики */}
								<div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
									<div className={`p-4 rounded-lg border ${
										isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
									}`}>
										<div className='flex items-center gap-2 mb-2'>
											<BarChart3 className='w-4 h-4 text-blue-500' />
											<span className={`text-sm font-medium ${
												isDark ? 'text-gray-300' : 'text-gray-600'
											}`}>
												Всего
											</span>
										</div>
										<div className={`text-2xl font-bold ${
											isDark ? 'text-white' : 'text-gray-900'
										}`}>
											{stats.total}
										</div>
									</div>

									<div className={`p-4 rounded-lg border ${
										isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
									}`}>
										<div className='flex items-center gap-2 mb-2'>
											<Package className='w-4 h-4 text-green-500' />
											<span className={`text-sm font-medium ${
												isDark ? 'text-gray-300' : 'text-gray-600'
											}`}>
												В наличии
											</span>
										</div>
										<div className={`text-2xl font-bold ${
											isDark ? 'text-white' : 'text-gray-900'
										}`}>
											{stats.inStock}
										</div>
									</div>

									<div className={`p-4 rounded-lg border ${
										isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
									}`}>
										<div className='flex items-center gap-2 mb-2'>
											<CheckCircle className='w-4 h-4 text-emerald-500' />
											<span className={`text-sm font-medium ${
												isDark ? 'text-gray-300' : 'text-gray-600'
											}`}>
												Проверено
											</span>
										</div>
										<div className={`text-2xl font-bold ${
											isDark ? 'text-white' : 'text-gray-900'
										}`}>
											{stats.verified}
										</div>
									</div>

									<div className={`p-4 rounded-lg border ${
										isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
									}`}>
										<div className='flex items-center gap-2 mb-2'>
											<Repeat className='w-4 h-4 text-orange-500' />
											<span className={`text-sm font-medium ${
												isDark ? 'text-gray-300' : 'text-gray-600'
											}`}>
												Повторяющиеся
											</span>
										</div>
										<div className={`text-2xl font-bold ${
											isDark ? 'text-white' : 'text-gray-900'
										}`}>
											{stats.duplicates}
										</div>
									</div>
								</div>

								{/* Детали дубликатов */}
								{stats.duplicateDetails.length > 0 && (
									<div className={`p-4 rounded-lg border ${
										isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
									}`}>
										<h4 className={`text-md font-semibold mb-3 ${
											isDark ? 'text-gray-200' : 'text-gray-800'
										}`}>
											Детали повторяющихся названий
										</h4>
										<div className='space-y-2'>
											{stats.duplicateDetails.map((duplicate, index) => (
												<div key={index} className={`p-3 rounded border ${
													isDark ? 'bg-gray-800/50 border-gray-600' : 'bg-white border-gray-200'
												}`}>
													<div className='flex items-center justify-between mb-2'>
														<span className={`font-medium ${
															isDark ? 'text-gray-200' : 'text-gray-800'
														}`}>
															{duplicate.name}
														</span>
														<span className={`px-2 py-1 rounded text-xs font-medium ${
															isDark ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-800'
														}`}>
															{duplicate.count} раз
														</span>
													</div>
													<div className='space-y-1'>
														{duplicate.locations.map((location, locIndex) => (
															<div key={locIndex} className={`text-sm ${
																isDark ? 'text-gray-400' : 'text-gray-600'
															}`}>
																<div className='flex items-center gap-2'>
																	<span>• {location.colorName}</span>
																	{location.alternativeName && (
																		<span className={`px-1.5 py-0.5 rounded text-xs ${
																			isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
																		}`}>
																			{location.alternativeName}
																		</span>
																	)}
																	{location.isAdditional && (
																		<span className={`px-1.5 py-0.5 rounded text-xs ${
																			isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
																		}`}>
																			доп. цвет
																		</span>
																	)}
																</div>
															</div>
														))}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{/* Кнопки */}
						<div className='flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
							<Button
								variant='outline'
								onClick={onClose}
								className='hover:scale-105 active:scale-95 transition-transform duration-200'
							>
								Закрыть
							</Button>
						</div>
					</div>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
