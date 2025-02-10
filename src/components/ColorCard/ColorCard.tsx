import { useState } from 'react'
import {
	Edit,
	Trash2,
	Beaker,
	Users,
	StickyNote,
	UserCircle,
	ChevronDown,
	ChevronUp,
	Calendar,
	Printer,
	Plus,
	Link2,
	X,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import type { PantoneColor } from '@/types'
import { incrementUsageCount } from '@lib/colors'
import toast from 'react-hot-toast'

interface ColorCardProps {
	color: PantoneColor
	colors: PantoneColor[]
	onEdit: () => void
	onClick: () => void
	onDelete: () => void
	isAdmin: boolean
	onUpdate: () => void
	isLinkingMode?: boolean
	selectedForLink?: PantoneColor | null
	onLink?: (color: PantoneColor) => void
	onUnlink?: (linkedColorId: string) => void
}

function formatDate(
	dateString?: string | { seconds: number; nanoseconds: number }
): string {
	if (!dateString) return ''

	// Handle Firestore Timestamp
	if (typeof dateString === 'object' && 'seconds' in dateString) {
		const timestamp = dateString as { seconds: number; nanoseconds: number }
		const date = new Date(timestamp.seconds * 1000)
		return date.toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		})
	}

	// Handle string date
	const date = new Date(dateString)
	if (isNaN(date.getTime())) return ''

	return date.toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

export default function ColorCard({
	color,
	colors,
	onEdit,
	onClick,
	onDelete,
	isAdmin,
	onUpdate,
	isLinkingMode,
	selectedForLink,
	onLink,
	onUnlink,
}: ColorCardProps) {
	const { isDark } = useTheme()
	const [expandedRecipes, setExpandedRecipes] = useState<number[]>([])

	const toggleRecipe = (index: number) => {
		setExpandedRecipes(prev =>
			prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
		)
	}

	const parseRecipes = (recipeString: string) => {
		const lines = recipeString.split('\n')
		const recipes: Array<{
			totalAmount: number
			material: string
			comment?: string
			items: Array<{ paint: string; amount: number }>
		}> = []

		let currentRecipe: (typeof recipes)[0] | null = null

		lines.forEach(line => {
			const totalAmountMatch = line.match(/^Общее количество: (\d+)/)
			const materialMatch = line.match(/^Материал: (.+)/)
			const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)
			const commentMatch = line.match(/^Комментарий: (.+)/)

			if (totalAmountMatch) {
				if (currentRecipe) recipes.push(currentRecipe)
				currentRecipe = {
					totalAmount: parseInt(totalAmountMatch[1]),
					material: '',
					items: [],
				}
			} else if (materialMatch && currentRecipe) {
				currentRecipe.material = materialMatch[1]
			} else if (commentMatch && currentRecipe) {
				currentRecipe.comment = commentMatch[1]
			} else if (paintMatch && currentRecipe) {
				currentRecipe.items.push({
					paint: paintMatch[1],
					amount: parseInt(paintMatch[2]),
				})
			}
		})

		if (currentRecipe) recipes.push(currentRecipe)
		return recipes
	}

	const handlePrint = (e: React.MouseEvent) => {
		e.stopPropagation()

		const recipes = parseRecipes(color.recipe || '')

		// Создаем содержимое для печати с таблицей
		const printContent = `
      <html>
        <head>
          <title>Рецепт ${color.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 20px;
              color: #333;
            }
            .recipe-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin-bottom: 20px;
              overflow: hidden;
            }
            .recipe-header {
              background-color: #f8fafc;
              padding: 12px 16px;
              border-bottom: 1px solid #e2e8f0;
            }
            .recipe-body {
              padding: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              padding: 8px 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            th {
              background-color: #f8fafc;
              font-weight: 600;
            }
            .info-row {
              display: flex;
              gap: 16px;
              margin-bottom: 8px;
            }
            .info-label {
              font-weight: 600;
              color: #4a5568;
            }
            .color-preview {
              width: 40px;
              height: 40px;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              margin-bottom: 12px;
            }
            @media print {
              .recipe-card {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="color-preview" style="background-color: ${
						color.hex
					}"></div>
          <h1>Рецепт для цвета: ${color.name}</h1>
          <div class="info-row">
            <span class="info-label">Код цвета:</span>
            <span>${color.hex}</span>
          </div>
          ${
						color.manager
							? `
          <div class="info-row">
            <span class="info-label">Менеджер:</span>
            <span>${color.manager}</span>
          </div>
          `
							: ''
					}
          ${recipes
						.map(
							(recipe, index) => `
            <div class="recipe-card">
              <div class="recipe-header">
                <h2>Рецепт ${index + 1}</h2>
              </div>
              <div class="recipe-body">
                <div class="info-row">
                  <span class="info-label">Материал:</span>
                  <span>${recipe.material}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Общее количество:</span>
                  <span>${recipe.totalAmount} гр.</span>
                </div>
                ${
									recipe.comment
										? `
                <div class="info-row">
                  <span class="info-label">Комментарий:</span>
                  <span>${recipe.comment}</span>
                </div>
                `
										: ''
								}
                <table>
                  <thead>
                    <tr>
                      <th>Краска</th>
                      <th>Количество (гр.)</th>
                      <th>Процент (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recipe.items
											.map(item => {
												const percentage = (
													(item.amount / recipe.totalAmount) *
													100
												).toFixed(1)
												return `
                        <tr>
                          <td>${item.paint}</td>
                          <td>${item.amount}</td>
                          <td>${percentage}%</td>
                        </tr>
                      `
											})
											.join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `
						)
						.join('')}
        </body>
      </html>
    `

		// Создаем новое окно для печати
		const printWindow = window.open('', '_blank')
		if (printWindow) {
			printWindow.document.write(printContent)
			printWindow.document.close()
			printWindow.focus()

			// Даем время на загрузку стилей
			setTimeout(() => {
				printWindow.print()
				printWindow.close()
			}, 250)
		}
	}

	// Функция для проверки наличия похожих рецептов
	const hasMatchingRecipes = (recipe: string) => {
		const recipes = parseRecipes(recipe)
		return recipes.some(recipe => {
			const totalItems = recipe.items.length
			if (totalItems === 0) return false

			// Получаем карту процентов для текущего рецепта
			const recipePercentages = new Map<string, number>()
			const recipePaints = new Set<string>()
			recipe.items.forEach(item => {
				const percentage = (item.amount / recipe.totalAmount) * 100
				recipePercentages.set(item.paint, percentage)
				recipePaints.add(item.paint)
			})

			// Проверяем все другие рецепты в базе
			const otherColors = colors.filter(c => c.id !== color.id && c.recipe)
			return otherColors.some(otherColor => {
				const otherRecipes = parseRecipes(otherColor.recipe!)
				return otherRecipes.some(otherRecipe => {
					// Создаем карту процентов для сравниваемого рецепта
					const otherPercentages = new Map<string, number>()
					const otherPaints = new Set<string>()
					otherRecipe.items.forEach(item => {
						const percentage = (item.amount / otherRecipe.totalAmount) * 100
						otherPercentages.set(item.paint, percentage)
						otherPaints.add(item.paint)
					})

					// Проверяем, что наборы компонентов идентичны
					const recipePaintsArray = Array.from(recipePaints)
					const otherPaintsArray = Array.from(otherPaints)

					if (
						recipePaintsArray.length === otherPaintsArray.length &&
						recipePaintsArray.every(paint => otherPaints.has(paint))
					) {
						// Если наборы компонентов совпадают, проверяем разницу в процентах
						return recipePaintsArray.every(paint => {
							const recipePercentage = recipePercentages.get(paint) || 0
							const otherPercentage = otherPercentages.get(paint) || 0
							const difference = Math.abs(recipePercentage - otherPercentage)
							return difference <= 3 // Разница не более 3%
						})
					}
					return false
				})
			})
		})
	}

	const hasSimilarRecipes = color.recipe && hasMatchingRecipes(color.recipe)

	const handleIncrementUsage = async (e: React.MouseEvent) => {
		e.stopPropagation()
		try {
			await incrementUsageCount(color.id)
			onUpdate()
			toast.success('Счетчик использований обновлен')
		} catch (error) {
			toast.error('Ошибка при обновлении счетчика')
		}
	}

	const handleCardClick = (_: React.MouseEvent) => {
		if (isLinkingMode && onLink) {
			onLink(color)
		} else {
			onClick()
		}
	}

	return (
		<div
			className={`relative group cursor-pointer rounded-xl shadow-lg overflow-hidden 
      transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl
      ${
				isLinkingMode && selectedForLink?.id === color.id
					? 'ring-2 ring-blue-500'
					: ''
			}
      ${
				isDark
					? 'bg-gray-800/90 backdrop-blur-sm'
					: 'bg-white/90 backdrop-blur-sm'
			} 
      border ${
				hasSimilarRecipes
					? isDark
						? 'border-rose-500/50'
						: 'border-rose-400'
					: isDark
					? 'border-gray-700/50'
					: 'border-gray-200/50'
			} ${hasSimilarRecipes ? 'border-2' : 'border'}
      before:absolute before:inset-0 before:rounded-xl before:transition-all before:duration-500
      before:opacity-0 group-hover:before:opacity-100
      ${
				isDark
					? 'before:bg-gradient-to-t before:from-blue-500/10 before:via-transparent before:to-transparent'
					: 'before:bg-gradient-to-t before:from-blue-500/5 before:via-transparent before:to-transparent'
			}
      `}
			onClick={handleCardClick}
		>
			<div
				className='h-32 sm:h-40 relative transition-all duration-500 ease-out
        group-hover:shadow-[inset_0_-20px_30px_-10px_rgba(0,0,0,0.2)]'
				style={{ backgroundColor: color.hex }}
			>
				<div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/20 backdrop-blur-[2px]'>
					<p className='text-white text-lg font-mono font-bold tracking-wider shadow-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500'>
						{color.hex}
					</p>
				</div>
			</div>

			<div className='p-4 sm:p-5 space-y-4'>
				<div>
					<h3
						className={`text-base sm:text-lg font-semibold ${
							isDark ? 'text-gray-100' : 'text-gray-900'
						}`}
					>
						{color.name}
					</h3>
					{color.alternativeName && (
						<p
							className={`text-base font-medium mt-1 ${
								isDark ? 'text-gray-400' : 'text-gray-600'
							}`}
						>
							{color.alternativeName}
						</p>
					)}
					<p
						className={`text-xs sm:text-sm font-mono ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						{color.hex}
					</p>
					{color.createdAt && (
						<div className='flex items-center gap-1.5 mt-2'>
							<Calendar
								className={`w-3.5 h-3.5 ${
									isDark ? 'text-gray-400' : 'text-gray-500'
								}`}
							/>
							<p
								className={`text-xs ${
									isDark ? 'text-gray-400' : 'text-gray-500'
								}`}
							>
								{formatDate(color.createdAt)}
								{color.updatedAt && ` (изм. ${formatDate(color.updatedAt)})`}
							</p>
						</div>
					)}
				</div>

				{color.recipe &&
					parseRecipes(color.recipe).map((recipe, index) => (
						<div
							key={index}
							className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
								isDark
									? 'bg-blue-900/20 hover:bg-blue-900/30 border border-blue-800/30'
									: 'bg-blue-50/80 hover:bg-blue-50 border border-blue-100'
							}`}
						>
							<button
								onClick={e => {
									e.stopPropagation()
									toggleRecipe(index)
								}}
								className='w-full relative z-10'
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<Beaker
											className={`w-4 h-4 ${
												isDark ? 'text-blue-400' : 'text-blue-600'
											}`}
										/>
										<p
											className={`text-xs sm:text-sm font-medium ${
												isDark ? 'text-blue-300' : 'text-blue-700'
											}`}
										>
											Рецепт {index + 1}
										</p>
									</div>
									{expandedRecipes.includes(index) ? (
										<ChevronUp
											className={`w-4 h-4 ${
												isDark ? 'text-blue-400' : 'text-blue-600'
											}`}
										/>
									) : (
										<ChevronDown
											className={`w-4 h-4 ${
												isDark ? 'text-blue-400' : 'text-blue-600'
											}`}
										/>
									)}
								</div>
							</button>

							{/* Добавляем анимацию для выпадающего списка */}
							<div
								className={`transform transition-all duration-300 ease-out origin-top
                ${
									expandedRecipes.includes(index)
										? 'opacity-100 scale-y-100 translate-y-0'
										: 'opacity-0 scale-y-0 -translate-y-2 h-0'
								}`}
							>
								{expandedRecipes.includes(index) && (
									<div
										className={`mt-3 text-xs sm:text-sm space-y-2 ${
											isDark ? 'text-blue-200' : 'text-blue-800'
										}`}
									>
										<div className='space-y-1'>
											<p className='font-medium'>Материал: {recipe.material}</p>
											{recipe.comment && (
												<p className='mt-2 italic text-sm px-3 py-2 rounded-lg bg-blue-900/20'>
													{recipe.comment}
												</p>
											)}
										</div>

										<div className='space-y-1.5 mt-3'>
											{recipe.items.map((item, itemIndex) => {
												const percentage = (
													(item.amount / recipe.totalAmount) *
													100
												).toFixed(1)
												return (
													<div
														key={itemIndex}
														className='flex justify-between items-center'
													>
														<span>{item.paint}</span>
														<span className='font-medium'>
															{percentage}% ({item.amount} гр.)
														</span>
													</div>
												)
											})}
										</div>
									</div>
								)}
							</div>
						</div>
					))}

				{color.customers && color.customers.length > 0 && (
					<div
						className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
							isDark
								? 'bg-purple-900/20 hover:bg-purple-900/30 border border-purple-800/30'
								: 'bg-purple-50/80 hover:bg-purple-50 border border-purple-100'
						}`}
					>
						<div className='flex items-center gap-2 mb-3'>
							<Users
								className={`w-4 h-4 ${
									isDark ? 'text-purple-400' : 'text-purple-600'
								}`}
							/>
							<p
								className={`text-xs sm:text-sm font-medium ${
									isDark ? 'text-purple-300' : 'text-purple-700'
								}`}
							>
								Клиенты:
							</p>
						</div>
						<div className='flex flex-wrap gap-1.5 sm:gap-2'>
							{color.customers.map((customer, index) => (
								<span
									key={index}
									className={`px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
										isDark
											? 'bg-purple-900/30 text-purple-200 border-purple-700/50'
											: 'bg-purple-50 text-purple-900 border-purple-200'
									} border`}
								>
									{customer}
								</span>
							))}
						</div>
					</div>
				)}

				{color.manager && (
					<div
						className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
							isDark
								? 'bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-800/30'
								: 'bg-emerald-50/80 hover:bg-emerald-50 border border-emerald-100'
						}`}
					>
						<div className='flex items-center gap-2'>
							<UserCircle
								className={`w-4 h-4 ${
									isDark ? 'text-emerald-400' : 'text-emerald-600'
								}`}
							/>
							<p
								className={`text-xs sm:text-sm font-medium ${
									isDark ? 'text-emerald-300' : 'text-emerald-700'
								}`}
							>
								Менеджер: {color.manager}
							</p>
						</div>
					</div>
				)}

				{color.notes && (
					<div
						className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
							isDark
								? 'bg-amber-900/20 hover:bg-amber-900/30 border border-amber-800/30'
								: 'bg-amber-50/80 hover:bg-amber-50 border border-amber-100'
						}`}
					>
						<div className='flex items-center gap-2 mb-2'>
							<StickyNote
								className={`w-4 h-4 ${
									isDark ? 'text-amber-400' : 'text-amber-600'
								}`}
							/>
							<p
								className={`text-xs sm:text-sm font-medium ${
									isDark ? 'text-amber-300' : 'text-amber-700'
								}`}
							>
								Заметки:
							</p>
						</div>
						<p
							className={`text-xs sm:text-sm whitespace-pre-wrap ${
								isDark ? 'text-amber-200' : 'text-amber-900'
							}`}
						>
							{color.notes}
						</p>
					</div>
				)}

				{color.linkedColors && color.linkedColors.length > 0 && (
					<div
						className={`p-3 sm:p-4 rounded-xl transition-all duration-200 ${
							isDark
								? 'bg-indigo-900/20 hover:bg-indigo-900/30 border border-indigo-800/30'
								: 'bg-indigo-50/80 hover:bg-indigo-50 border border-indigo-100'
						}`}
					>
						<div className='flex items-center gap-2 mb-3'>
							<Link2
								className={`w-4 h-4 ${
									isDark ? 'text-indigo-400' : 'text-indigo-600'
								}`}
							/>
							<p
								className={`text-xs sm:text-sm font-medium ${
									isDark ? 'text-indigo-300' : 'text-indigo-700'
								}`}
							>
								Связанные цвета:
							</p>
						</div>
						<div className='flex flex-wrap gap-1.5 sm:gap-2'>
							{color.linkedColors.map(linkedId => {
								const linkedColor = colors.find(c => c.id === linkedId)
								if (!linkedColor) return null

								return (
									<div
										key={linkedId}
										className={`group/link relative flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
											isDark
												? 'bg-indigo-900/30 text-indigo-200 border-indigo-700/50'
												: 'bg-indigo-50 text-indigo-900 border-indigo-200'
										} border`}
									>
										<div
											className='w-3 h-3 rounded-full border'
											style={{ backgroundColor: linkedColor.hex }}
										/>
										<span>{linkedColor.name}</span>
										{isAdmin && (
											<button
												onClick={e => {
													e.stopPropagation()
													onUnlink?.(linkedId)
												}}
												className='relative z-20 ml-1 p-1 -mr-1 rounded-lg transition-colors duration-200 opacity-0 group-hover/link:opacity-100 hover:bg-red-500/10'
											>
												<X className='w-3 h-3 text-red-500 hover:text-red-600' />
											</button>
										)}
									</div>
								)
							})}
						</div>
					</div>
				)}

				<div className='flex items-center justify-between pt-2 relative z-10'>
					<div className='flex items-center space-x-2'>
						<span
							className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
								color.inStock
									? isDark
										? 'bg-green-900/30 text-green-300 border border-green-800/30'
										: 'bg-green-50 text-green-800 border border-green-200'
									: isDark
									? 'bg-red-900/30 text-red-300 border border-red-800/30'
									: 'bg-red-50 text-red-800 border border-red-200'
							}`}
						>
							{color.inStock ? 'В наличии' : 'Нет в наличии'}
						</span>
						<div
							className={`w-3 h-3 rounded-full ${
								color.isVerified
									? isDark
										? 'bg-green-500'
										: 'bg-green-500'
									: isDark
									? 'bg-red-500'
									: 'bg-red-500'
							}`}
							title={color.isVerified ? 'Проверен' : 'Не проверен'}
						/>
						<span
							className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium ${
								isDark
									? 'bg-gray-700/50 text-gray-300'
									: 'bg-gray-100 text-gray-700'
							}`}
							title='Количество использований'
						>
							{color.usageCount || 0}
						</span>
					</div>

					<div className='flex items-center gap-1 sm:gap-2 relative z-20'>
						{color.recipe && (
							<button
								onClick={e => {
									e.stopPropagation()
									handlePrint(e)
								}}
								className={`p-2 rounded-lg transition-all duration-200 ${
									isDark
										? 'hover:bg-gray-700/50 text-gray-300 hover:text-gray-100'
										: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
								}`}
							>
								<Printer className='w-4 h-4' />
							</button>
						)}

						<button
							onClick={handleIncrementUsage}
							className={`p-2 rounded-lg transition-all duration-200 ${
								isDark
									? 'hover:bg-blue-900/30 text-blue-400 hover:text-blue-300'
									: 'hover:bg-blue-50 text-blue-600 hover:text-blue-700'
							}`}
							title='Увеличить счетчик использований'
						>
							<Plus className='w-4 h-4' />
						</button>

						{isAdmin && (
							<>
								<button
									onClick={e => {
										e.stopPropagation()
										onEdit()
									}}
									className={`p-2 rounded-lg transition-all duration-200 ${
										isDark
											? 'hover:bg-gray-700/50 text-gray-300 hover:text-gray-100'
											: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
									}`}
								>
									<Edit className='w-4 h-4' />
								</button>
								<button
									onClick={e => {
										e.stopPropagation()
										onDelete()
									}}
									className={`p-2 rounded-lg transition-all duration-200 ${
										isDark
											? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
											: 'hover:bg-red-50 text-red-600 hover:text-red-700'
									}`}
								>
									<Trash2 className='w-4 h-4' />
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
