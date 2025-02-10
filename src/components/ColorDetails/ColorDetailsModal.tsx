import { Dialog } from '@headlessui/react'
import { X, Beaker, UserCircle, StickyNote, Link2 } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { getColorInfo, normalizeHexColor } from '@utils/colorUtils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui/Tabs'

import { ColorInfo } from '../ColorDetails'
import type { PantoneColor, Recipe } from '@/types'
import SimilarColorCard from './SimilarColorCard'
import SimilarRecipeCard from './SimilarRecipeCard'

interface ColorDetailsModalProps {
	color: PantoneColor
	isOpen: boolean
	onClose: () => void
	similarColors: (PantoneColor & { distance?: number })[]
	similarRecipes: Array<{
		color: PantoneColor
		similarRecipes: Array<{
			recipe: Recipe
			differences: Array<{ paint: string; difference: number }>
		}>
	}>
	colors: PantoneColor[]
}

export default function ColorDetailsModal({
	color,
	isOpen,
	onClose,
	similarColors,
	similarRecipes,
	colors,
}: ColorDetailsModalProps) {
	const { isDark } = useTheme()
	const normalizedHex = normalizeHexColor(color.hex)
	const colorInfo = getColorInfo(normalizedHex)

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
										backgroundColor: normalizedHex,
									}}
								/>
								<p
									className={`text-xl font-mono text-center font-semibold ${
										isDark ? 'text-gray-300' : 'text-gray-600'
									}`}
								>
									{normalizedHex}
								</p>
							</div>

							{/* Color Information */}
							<ColorInfo colorInfo={colorInfo} />
						</div>

						{/* Flexo Print Preview */}
						<div className='space-y-3 mt-6'>
							<h3
								className={`text-lg font-semibold ${
									isDark ? 'text-gray-200' : 'text-gray-700'
								}`}
							>
								Примерная визуализация
							</h3>
							<div className='grid grid-cols-2 gap-4'>
								{/* Paper Preview */}
								<div className='space-y-2'>
									<div
										className='h-20 rounded-lg'
										style={{
											backgroundColor: '#eeeeff', // Цвет бумаги
											position: 'relative',
											overflow: 'hidden',
										}}
									>
										<div
											className='absolute inset-0'
											style={{
												backgroundColor: normalizedHex,
												opacity: 0.85, // Имитация печати на бумаге
												mixBlendMode: 'multiply',
											}}
										/>
									</div>
									<p
										className={`text-sm text-center ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										На бумаге
									</p>
								</div>

								{/* White Film Preview */}
								<div className='space-y-2'>
									<div
										className='h-20 rounded-lg'
										style={{
											backgroundColor: '#FFFFFF', // Белая пленка
											position: 'relative',
											overflow: 'hidden',
										}}
									>
										<div
											className='absolute inset-0'
											style={{
												backgroundColor: normalizedHex,
												opacity: 0.9, // Имитация печати на пленке
												mixBlendMode: 'multiply',
											}}
										/>
									</div>
									<p
										className={`text-sm text-center ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										На белой пленке
									</p>
								</div>
							</div>
						</div>

						{/* Category and Group */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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
						</div>

						{/* Recipe */}
						{color.recipe && formatRecipe(color.recipe).length > 0 && (
							<div
								className={`p-6 rounded-xl ${
									isDark
										? 'bg-blue-900/20 hover:bg-blue-900/30'
										: 'bg-blue-50 hover:bg-blue-100/70'
								} transition-colors`}
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
										Рецепты:
									</p>
								</div>
								<div
									className={`text-base ${
										isDark ? 'text-blue-200' : 'text-blue-800'
									}`}
								>
									{formatRecipe(color.recipe)}
								</div>
							</div>
						)}

						{/* Manager */}
						{color.manager && (
							<div
								className={`p-6 rounded-xl transition-colors ${
									isDark
										? 'bg-emerald-900/20 hover:bg-emerald-900/30'
										: 'bg-emerald-50 hover:bg-emerald-100/70'
								}`}
							>
								<div className='flex items-center gap-3'>
									<UserCircle
										className={`w-5 h-5 ${
											isDark ? 'text-emerald-400' : 'text-emerald-600'
										}`}
									/>
									<p
										className={`text-lg font-semibold ${
											isDark ? 'text-emerald-300' : 'text-emerald-700'
										}`}
									>
										Менеджер: {color.manager}
									</p>
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

						{/* Customers */}
						{color.customers && color.customers.length > 0 && (
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
									Клиенты
								</h3>
								<div className='flex flex-wrap gap-3'>
									{color.customers.map((customer, index) => (
										<span
											key={index}
											className={`px-4 py-2 rounded-lg text-base font-medium ${
												isDark
													? 'bg-gray-600/70 text-gray-200'
													: 'bg-gray-200/70 text-gray-700'
											} hover:opacity-80 transition-opacity`}
										>
											{customer}
										</span>
									))}
								</div>
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

						<Tabs defaultValue='similar' className='w-full'>
							<TabsList>
								<TabsTrigger value='similar'>Похожие цвета</TabsTrigger>
								<TabsTrigger value='recipes'>Похожие рецепты</TabsTrigger>
								<TabsTrigger value='linked'>
									<div className='flex items-center gap-2'>
										<Link2 className='w-4 h-4' />
										<span>Связанные цвета</span>
									</div>
								</TabsTrigger>
							</TabsList>

							<TabsContent value='similar'>
								<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
									{similarColors.length > 0 ? (
										similarColors.map(similarColor => (
											<SimilarColorCard
												key={similarColor.id}
												color={similarColor}
												distance={similarColor.distance}
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

							<TabsContent value='recipes'>
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

							<TabsContent value='linked'>
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
