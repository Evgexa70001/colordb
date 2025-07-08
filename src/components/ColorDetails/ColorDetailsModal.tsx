import { Dialog } from '@headlessui/react'
import {
	X,
	Beaker,
	StickyNote,
	Link2,
	ImagePlus,
	History,
	Eye,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import {
	getColorInfo,
	normalizeHexColor,
	hexToLab,
	labToHex,
	calculateDeltaE,
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS,
} from '@utils/colorUtils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs'
import { uploadToImgur } from '@lib/imgur'
import { toast } from 'react-hot-toast'
import MetamerismAnalyzer from '../MetamerismAnalysis/MetamerismAnalyzer'

import ColorInfo from './ColorInfo'
import type { PantoneColor, Recipe } from '@/types'
import SimilarColorCard from './SimilarColorCard'
import SimilarRecipeCard from './SimilarRecipeCard'

interface ColorDetailsModalProps {
	color: PantoneColor & {
		labValues?: { l: number; a: number; b: number }
		labSource?: 'manual' | 'converted'
	}
	isOpen: boolean
	onClose: () => void
	similarColors: (PantoneColor & {
		distance?: {
			deltaE2000: number
			deltaE76: number
		}
		matchingColor?: {
			name: string
			hex: string
			isAdditional: boolean
		}
		matchedWith?: {
			name: string
			hex: string
			isAdditional: boolean
		}
	})[]
	similarRecipes: Array<{
		color: PantoneColor
		similarRecipes: Array<{
			recipe: Recipe
			differences: Array<{ paint: string; difference: number }>
		}>
	}>
	colors: PantoneColor[]
	onUpdate?: (id: string, update: Partial<PantoneColor>) => Promise<void>
}

export default function ColorDetailsModal({
	color,
	isOpen,
	onClose,
	similarColors,
	similarRecipes,
	colors,
	onUpdate,
}: ColorDetailsModalProps) {
	const { isDark } = useTheme()
	const normalizedHex = normalizeHexColor(color.hex)
	const colorInfo = getColorInfo(normalizedHex)

	// Используем сохраненные LAB координаты, если они есть
	const colorLab = color.labValues || hexToLab(color.hex)

	// Дополнительный поиск похожих цветов по LAB координатам
	const findSimilarColorsByLAB = () => {
		if (!colorLab) return []

		const LAB_TOLERANCE = 10 // Увеличиваем порог для включения цветов с дельта E 2.7
		const results: (PantoneColor & {
			distance: { deltaE2000: number; deltaE76: number }
		})[] = []

		colors.forEach(otherColor => {
			if (otherColor.id === color.id) return

			const otherLab = otherColor.labValues || hexToLab(otherColor.hex)
			
			// Используем калиброванный дельта E если доступен
			let deltaE = calculateDeltaE(colorLab, otherLab)
			if (otherColor.labValues && color.labValues) {
				const calibratedDeltaE = calculateDeltaEWithCalibration(
					colorLab,
					otherLab,
					SPECTROPHOTOMETER_CALIBRATIONS.xrite
				)
				deltaE = Math.min(deltaE, calibratedDeltaE)
			}

			if (deltaE <= LAB_TOLERANCE) {
				results.push({
					...otherColor,
					distance: {
						deltaE2000: deltaE,
						deltaE76: calculateDeltaE(colorLab, otherLab, 'CIEDE76')
					}
				})
			}
		})

		return results
			.sort((a, b) => a.distance.deltaE2000 - b.distance.deltaE2000)
			.slice(0, 8) // Показываем до 8 дополнительных результатов
	}

	// Объединяем результаты из пропсов и дополнительного поиска
	const allSimilarColors = [...similarColors]
	const labSimilarColors = findSimilarColorsByLAB()
	
	// Добавляем цвета, найденные по LAB, которые не дублируются
	labSimilarColors.forEach(labColor => {
		const exists = allSimilarColors.some(existing => existing.id === labColor.id)
		if (!exists) {
			allSimilarColors.push(labColor)
		}
	})

	// Удаляем дубликаты по ID и сортируем по дельта E
	const uniqueSimilarColors = allSimilarColors.filter((color, index, self) => 
		index === self.findIndex(c => c.id === color.id)
	)

	// Сортируем по дельта E и ограничиваем количество
	const finalSimilarColors = uniqueSimilarColors
		.sort((a, b) => (a.distance?.deltaE2000 || 0) - (b.distance?.deltaE2000 || 0))
		.slice(0, 12)

	const formatRecipe = (recipe: string) => {
		const lines = recipe.split('\n')
		const recipes: {
			totalAmount: number
			material: string
			comment?: string
			name?: string
			items: { paint: string; amount: number }[]
		}[] = []
		let currentRecipe: {
			totalAmount: number
			material: string
			comment?: string
			name?: string
			items: { paint: string; amount: number }[]
		} | null = null

		lines.forEach(line => {
			const totalAmountMatch = line.match(/Общее количество: (\d+)/)
			const materialMatch = line.match(/Материал: (.+)/)
			const commentMatch = line.match(
				/Комментарий:\n([\s\S]+?)(?=\nОбщее количество:|$)/
			)
			const paintMatch = line.match(/Краска: (.+), Количество: (\d+)/)
			const nameMatch = line.match(/Название: (.+)/)

			if (totalAmountMatch) {
				if (currentRecipe) {
					recipes.push(currentRecipe)
				}
				currentRecipe = {
					totalAmount: parseInt(totalAmountMatch[1]),
					material: '',
					comment: '',
					name: '',
					items: [],
				}
			} else if (materialMatch && currentRecipe) {
				currentRecipe.material = materialMatch[1]
			} else if (commentMatch && currentRecipe) {
				currentRecipe.comment = commentMatch[1].trim()
			} else if (nameMatch && currentRecipe) {
				currentRecipe.name = nameMatch[1].trim()
			} else if (paintMatch && currentRecipe) {
				currentRecipe.items.push({
					paint: paintMatch[1],
					amount: parseInt(paintMatch[2]),
				})
			}
		})

		if (currentRecipe) {
			recipes.push(currentRecipe)
		}

		const validRecipes = recipes.filter(
			recipe =>
				recipe.material.trim() !== '' &&
				recipe.items.length > 0 &&
				recipe.items.some(item => item.paint.trim() !== '' && item.amount > 0)
		)

		return validRecipes.map((recipe, index) => (
			<div
				key={index}
				className={`${
					index > 0 ? 'mt-3 pt-3 border-t border-blue-400/30' : ''
				}`}
			>
				<div
					className={`text-xs uppercase tracking-wider mb-1 ${
						isDark ? 'text-blue-300/70' : 'text-blue-600/70'
					}`}
				>
					{recipe.name || `Рецепт ${index + 1}`}
				</div>
				<span className='block font-medium'>Материал: {recipe.material}</span>
				{recipe.comment && (
					<div className='block italic text-sm'>
						<span className='font-medium'>Комментарий:</span>
						<pre className='mt-1 whitespace-pre-wrap font-sans'>
							{recipe.comment}
						</pre>
					</div>
				)}
				{recipe.items
					.filter(item => item.paint.trim() !== '' && item.amount > 0)
					.map((item, itemIndex) => {
						const percentage = (
							(item.amount / recipe.totalAmount) *
							100
						).toFixed(1)
						return (
							<span key={itemIndex} className='block text-sm'>
								{item.paint} - {percentage}% ({item.amount} гр.)
							</span>
						)
					})}
			</div>
		))
	}

	const handleImageUpload = async (file: File) => {
		try {
			const MAX_SIZE = 10 * 1024 * 1024 // 10MB
			if (file.size > MAX_SIZE) {
				toast.error('Размер файла не должен превышать 10MB')
				return
			}

			const allowedTypes = ['image/jpeg', 'image/png']
			if (!allowedTypes.includes(file.type)) {
				toast.error('Поддерживаются только форматы JPG и PNG')
				return
			}

			toast.loading('Загрузка изображения...', { id: 'uploadImage' })
			const imageUrl = await uploadToImgur(file)

			// Обновляем данные, сохраняя все существующие поля
			await onUpdate?.(color.id, {
				...color,
				images: [...(color.images || []), imageUrl],
			})

			toast.success('Изображение успешно загружено', { id: 'uploadImage' })
		} catch (error) {
			console.error('Ошибка при загрузке изображения:', error)
			toast.error(
				error instanceof Error
					? error.message
					: 'Ошибка при загрузке изображения',
				{ id: 'uploadImage' }
			)
		}
	}

	const handleRemoveImage = async (imageUrl: string) => {
		try {
			await onUpdate?.(color.id, {
				...color,
				images: (color.images || []).filter(url => url !== imageUrl),
			})
			toast.success('Изображение удалено')
		} catch (error) {
			console.error('Ошибка при удалении изображения:', error)
			toast.error('Ошибка при удалении изображения')
		}
	}

	const formatDate = (
		dateValue: string | { seconds: number; nanoseconds: number }
	) => {
		let date: Date

		if (typeof dateValue === 'string') {
			date = new Date(dateValue)
		} else {
			date = new Date(dateValue.seconds * 1000)
		}

		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const formatHistoryRecipe = (recipe: string) => {
		const lines = recipe.split('\n')
		const recipes: {
			totalAmount: number
			material: string
			comment?: string
			name?: string
			items: { paint: string; amount: number }[]
		}[] = []
		let currentRecipe: {
			totalAmount: number
			material: string
			comment?: string
			name?: string
			items: { paint: string; amount: number }[]
		} | null = null

		lines.forEach(line => {
			const totalAmountMatch = line.match(/Общее количество: (\d+)/)
			const materialMatch = line.match(/Материал: (.+)/)
			const commentMatch = line.match(
				/Комментарий:\n([\s\S]+?)(?=\nОбщее количество:|$)/
			)
			const paintMatch = line.match(/Краска: (.+), Количество: (\d+)/)
			const nameMatch = line.match(/Название: (.+)/)

			if (totalAmountMatch) {
				if (currentRecipe) {
					recipes.push(currentRecipe)
				}
				currentRecipe = {
					totalAmount: parseInt(totalAmountMatch[1]),
					material: '',
					comment: '',
					name: '',
					items: [],
				}
			} else if (materialMatch && currentRecipe) {
				currentRecipe.material = materialMatch[1]
			} else if (commentMatch && currentRecipe) {
				currentRecipe.comment = commentMatch[1].trim()
			} else if (nameMatch && currentRecipe) {
				currentRecipe.name = nameMatch[1].trim()
			} else if (paintMatch && currentRecipe) {
				currentRecipe.items.push({
					paint: paintMatch[1],
					amount: parseInt(paintMatch[2]),
				})
			}
		})

		if (currentRecipe) {
			recipes.push(currentRecipe)
		}

		const validRecipes = recipes.filter(
			recipe =>
				recipe.material.trim() !== '' &&
				recipe.items.length > 0 &&
				recipe.items.some(item => item.paint.trim() !== '' && item.amount > 0)
		)

		return validRecipes.map((recipe, index) => (
			<div
				key={index}
				className={`${
					index > 0 ? 'mt-2 pt-2 border-t border-purple-400/30' : ''
				}`}
			>
				<div
					className={`text-xs uppercase tracking-wider mb-1 ${
						isDark ? 'text-purple-300/70' : 'text-purple-600/70'
					}`}
				>
					{recipe.name || `Рецепт ${index + 1}`}
				</div>
				<span className='block font-medium text-sm'>
					Материал: {recipe.material}
				</span>
				{recipe.comment && (
					<div className='block italic text-xs'>
						<span className='font-medium'>Комментарий:</span>
						<pre className='mt-1 whitespace-pre-wrap font-sans text-xs'>
							{recipe.comment}
						</pre>
					</div>
				)}
				{recipe.items
					.filter(item => item.paint.trim() !== '' && item.amount > 0)
					.map((item, itemIndex) => {
						const percentage = (
							(item.amount / recipe.totalAmount) *
							100
						).toFixed(1)
						return (
							<span key={itemIndex} className='block text-xs'>
								{item.paint} - {percentage}% ({item.amount} гр.)
							</span>
						)
					})}
			</div>
		))
	}

	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div
				className='fixed inset-0 bg-black/50 backdrop-blur-sm'
				aria-hidden='true'
			/>
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel
					className={`mx-auto max-w-4xl w-full rounded-xl p-8 shadow-2xl ${
						isDark ? 'bg-gray-800/95' : 'bg-white/95'
					} max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-md border ${
						isDark ? 'border-gray-700' : 'border-gray-200'
					}`}
				>
					<div className='flex justify-between items-start mb-8'>
						<Dialog.Title
							className={`text-3xl font-bold ${
								isDark ? 'text-gray-100' : 'text-gray-900'
							}`}
						>
							{color.name}
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

					<div className='space-y-8'>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
							{/* Color Preview */}
							<div className='space-y-4'>
								<div
									className='w-full aspect-square rounded-xl shadow-2xl ring-4 ring-opacity-20'
									style={{
										backgroundColor: color.labValues
											? labToHex(color.labValues)
											: normalizedHex,
									}}
								/>
								<div className='space-y-2'>
									<p
										className={`text-xl font-mono text-center font-semibold ${
											isDark ? 'text-gray-300' : 'text-gray-600'
										}`}
									>
										{normalizedHex}
									</p>
								</div>
							</div>

							{/* Color Information */}
							<ColorInfo
								colorInfo={colorInfo}
								labValues={colorLab}
								isLabManual={color.labSource === 'manual'}
							/>
						</div>

						{/* Category */}
						<div
							className={`p-6 rounded-xl transition-colors ${
								isDark
									? 'bg-gray-700/50 hover:bg-gray-700/70'
									: 'bg-gray-50 hover:bg-gray-100/70'
							}`}
						>
							<h3
								className={`text-lg font-semibold mb-3 ${
									isDark ? 'text-gray-200' : 'text-gray-700'
								}`}
							>
								Категория
							</h3>
							<p
								className={`${
									isDark ? 'text-gray-300' : 'text-gray-600'
								} text-lg`}
							>
								{color.category}
							</p>
						</div>

						{/* Recipe */}
						{color.recipe && (
							<div
								className={`p-6 rounded-xl transition-colors ${
									isDark
										? 'bg-blue-900/20 hover:bg-blue-900/30'
										: 'bg-blue-50 hover:bg-blue-100/70'
								}`}
							>
								<div className='flex items-center gap-3 mb-4'>
									<Beaker
										className={`w-5 h-5 ${
											isDark ? 'text-blue-400' : 'text-blue-600'
										}`}
									/>
									<p
										className={`text-lg font-semibold ${
											isDark ? 'text-blue-300' : 'text-blue-700'
										}`}
									>
										Рецепт:
									</p>
								</div>
								{formatRecipe(color.recipe)}
							</div>
						)}

						{/* Recipe History */}
						{color.recipeHistory && color.recipeHistory.length > 0 && (
							<div
								className={`p-6 rounded-xl transition-colors ${
									isDark
										? 'bg-purple-900/20 hover:bg-purple-900/30'
										: 'bg-purple-50 hover:bg-purple-100/70'
								}`}
							>
								<div className='flex items-center gap-3 mb-4'>
									<History
										className={`w-5 h-5 ${
											isDark ? 'text-purple-400' : 'text-purple-600'
										}`}
									/>
									<p
										className={`text-lg font-semibold ${
											isDark ? 'text-purple-300' : 'text-purple-700'
										}`}
									>
										История изменений рецепта:
									</p>
								</div>
								<div className='space-y-4'>
									{color.recipeHistory.map((historyEntry, index) => (
										<div
											key={index}
											className={`p-4 rounded-lg border-l-4 ${
												isDark
													? 'bg-purple-900/10 border-purple-500/50'
													: 'bg-purple-50/50 border-purple-400'
											}`}
										>
											<div className='flex items-center justify-between mb-2'>
												<span
													className={`text-sm font-medium ${
														isDark ? 'text-purple-300' : 'text-purple-700'
													}`}
												>
													Изменение #{index + 1}
												</span>
												<div
													className={`text-xs ${
														isDark ? 'text-purple-400' : 'text-purple-600'
													}`}
												>
													{formatDate(historyEntry.updatedAt)}
													{historyEntry.updatedBy && (
														<span className='ml-2'>
															• {historyEntry.updatedBy}
														</span>
													)}
												</div>
											</div>
											<div
												className={`${
													isDark ? 'text-purple-200' : 'text-purple-800'
												}`}
											>
												{formatHistoryRecipe(historyEntry.recipe)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Notes */}
						{color.notes && (
							<div
								className={`p-6 rounded-xl transition-colors ${
									isDark
										? 'bg-amber-900/20 hover:bg-amber-900/30'
										: 'bg-amber-50 hover:bg-amber-100/70'
								}`}
							>
								<div className='flex items-center gap-3 mb-4'>
									<StickyNote
										className={`w-5 h-5 ${
											isDark ? 'text-amber-400' : 'text-amber-600'
										}`}
									/>
									<p
										className={`text-lg font-semibold ${
											isDark ? 'text-amber-300' : 'text-amber-700'
										}`}
									>
										Заметки:
									</p>
								</div>
								<p
									className={`text-base whitespace-pre-wrap ${
										isDark ? 'text-amber-200' : 'text-amber-900'
									}`}
								>
									{color.notes}
								</p>
							</div>
						)}

						{/* Status */}
						<div
							className={`p-6 rounded-xl transition-colors ${
								isDark
									? 'bg-gray-700/50 hover:bg-gray-700/70'
									: 'bg-gray-50 hover:bg-gray-100/70'
							}`}
						>
							<h3
								className={`text-lg font-semibold mb-4 ${
									isDark ? 'text-gray-200' : 'text-gray-700'
								}`}
							>
								Статус
							</h3>
							<span
								className={`inline-flex px-4 py-2 rounded-lg text-base font-medium ${
									color.inStock
										? isDark
											? 'bg-green-900/50 text-green-300'
											: 'bg-green-100 text-green-800'
										: isDark
										? 'bg-red-900/50 text-red-300'
										: 'bg-red-100 text-red-800'
								}`}
							>
								{color.inStock ? 'В наличии' : 'Нет в наличии'}
							</span>
						</div>

						{/* Секция изображений */}
						<div
							className={`p-6 rounded-xl transition-colors ${
								isDark
									? 'bg-gray-700/50 hover:bg-gray-700/70'
									: 'bg-gray-50 hover:bg-gray-100/70'
							}`}
						>
							<h3
								className={`text-lg font-semibold mb-4 ${
									isDark ? 'text-gray-200' : 'text-gray-700'
								}`}
							>
								Фотографии этикеток
							</h3>

							<div className='grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4'>
								{color.images?.map((imageUrl, index) => (
									<div key={index} className='relative group aspect-square'>
										<img
											src={imageUrl}
											alt={`Этикетка ${index + 1}`}
											className='w-full h-full object-cover rounded-lg'
										/>
										{onUpdate && (
											<button
												onClick={() => handleRemoveImage(imageUrl)}
												className={`absolute top-2 right-2 p-1.5 rounded-full 
													opacity-0 group-hover:opacity-100 transition-opacity
													${isDark ? 'bg-red-500/90' : 'bg-red-500'} 
													text-white hover:bg-red-600`}
											>
												<X className='w-4 h-4' />
											</button>
										)}
									</div>
								))}
							</div>

							{onUpdate && (
								<div className='flex items-center gap-4'>
									<input
										type='file'
										accept='image/jpeg,image/png'
										onChange={e => {
											const files = e.target.files
											if (files && files.length > 0) {
												handleImageUpload(files[0])
											}
										}}
										className={`flex-1 px-4 py-2 rounded-xl border ${
											isDark
												? 'bg-gray-700 border-gray-600 text-white'
												: 'bg-white border-gray-300 text-gray-900'
										} focus:outline-none focus:ring-2 focus:ring-blue-500`}
									/>
									<button
										onClick={() =>
											(
												document.querySelector(
													'input[type="file"]'
												) as HTMLInputElement
											)?.click()
										}
										className={`p-2 rounded-lg transition-colors ${
											isDark
												? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
												: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
										}`}
									>
										<ImagePlus className='w-5 h-5' />
									</button>
								</div>
							)}
						</div>

						<Tabs defaultValue='similar' className='w-full'>
							<TabsList className='w-full flex flex-col sm:flex-row gap-2 sm:gap-0 p-1 mb-6'>
								<TabsTrigger
									value='similar'
									className='w-full sm:w-auto justify-center px-4 py-2 mb-2 sm:mb-0'
								>
									Похожие цвета
								</TabsTrigger>
								<TabsTrigger
									value='recipes'
									className='w-full sm:w-auto justify-center px-4 py-2 mb-2 sm:mb-0'
								>
									Похожие рецепты
								</TabsTrigger>
								<TabsTrigger
									value='metamerism'
									className='w-full sm:w-auto justify-center px-4 py-2 mb-2 sm:mb-0'
								>
									<div className='flex items-center gap-2'>
										<Eye className='w-4 h-4' />
										<span>Метамеризм</span>
									</div>
								</TabsTrigger>
								<TabsTrigger
									value='linked'
									className='w-full sm:w-auto justify-center px-4 py-2 mb-2 sm:mb-0'
								>
									<div className='flex items-center gap-2'>
										<Link2 className='w-4 h-4' />
										<span>Связанные цвета</span>
									</div>
								</TabsTrigger>
							</TabsList>

							<TabsContent value='similar' className='overflow-x-hidden mt-6'>
								{/* Результаты поиска или обычные похожие цвета */}
								{color.name.includes('P130') && (
									<div className={`mb-4 p-3 rounded-lg text-sm ${
										isDark ? 'bg-yellow-900/20 text-yellow-200' : 'bg-yellow-100/50 text-yellow-800'
									}`}>
										<strong>Отладка для P130:</strong> Найдено {finalSimilarColors.length} похожих цветов
									</div>
								)}
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									{finalSimilarColors.length > 0 ? (
										finalSimilarColors.map(similarColor => (
											<SimilarColorCard
												key={similarColor.id}
												color={similarColor}
												originalColor={color}
											/>
										))
									) : (
										<p
											className={`col-span-full text-center py-8 ${
												isDark ? 'text-gray-400' : 'text-gray-600'
											}`}
										>
											Похожих цветов не найдено
										</p>
									)}
								</div>
							</TabsContent>

							<TabsContent value='recipes' className='overflow-x-hidden mt-6'>
								<div className='space-y-4'>
									{similarRecipes.length > 0 ? (
										similarRecipes.map(item => (
											<SimilarRecipeCard
												key={item.color.id}
												color={item.color}
												recipes={item.similarRecipes}
											/>
										))
									) : (
										<p
											className={`text-center py-8 ${
												isDark ? 'text-gray-400' : 'text-gray-600'
											}`}
										>
											Похожих рецептов не найдено
										</p>
									)}
								</div>
							</TabsContent>

							<TabsContent
								value='metamerism'
								className='overflow-x-hidden mt-6'
							>
								<div
									className={`rounded-xl ${
										isDark ? 'bg-gray-700/30' : 'bg-gray-50/50'
									}`}
								>
									<MetamerismAnalyzer
										color={{
											hex: normalizedHex,
											lab: colorLab,
											name: color.name,
										}}
									/>
								</div>
							</TabsContent>

							<TabsContent value='linked' className='overflow-x-hidden mt-6'>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									{color.linkedColors && color.linkedColors.length > 0 ? (
										color.linkedColors.map(linkedId => {
											const linkedColor = colors.find(c => c.id === linkedId)
											if (!linkedColor) return null

											return (
												<div
													key={linkedId}
													className={`p-4 rounded-xl transition-all duration-200 ${
														isDark
															? 'bg-indigo-900/20 border-indigo-800/30'
															: 'bg-indigo-50/80 border-indigo-200'
													} border`}
												>
													<div className='flex items-center gap-3'>
														<div
															className='w-12 h-12 rounded-lg border shadow-sm'
															style={{ backgroundColor: linkedColor.hex }}
														/>
														<div>
															<h3
																className={`font-medium ${
																	isDark ? 'text-indigo-200' : 'text-indigo-900'
																}`}
															>
																{linkedColor.name}
															</h3>
															<p
																className={`text-sm font-mono ${
																	isDark ? 'text-indigo-300' : 'text-indigo-700'
																}`}
															>
																{linkedColor.hex}
															</p>
														</div>
													</div>
													{linkedColor.alternativeName && (
														<p
															className={`mt-2 text-sm ${
																isDark ? 'text-indigo-300' : 'text-indigo-700'
															}`}
														>
															{linkedColor.alternativeName}
														</p>
													)}
												</div>
											)
										})
									) : (
										<p
											className={`col-span-full text-center py-8 ${
												isDark ? 'text-gray-400' : 'text-gray-600'
											}`}
										>
											Связанных цветов не найдено
										</p>
									)}
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
