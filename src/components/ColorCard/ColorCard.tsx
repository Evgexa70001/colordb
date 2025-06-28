import { useState, useCallback, useEffect } from 'react'
import {
	Edit,
	Trash2,
	Beaker,
	Users,
	StickyNote,
	UserCircle,
	ChevronDown,
	Calendar,
	Printer,
	Plus,
	Link2,
	X,
	Tag,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import type { PantoneColor } from '@/types'
// import { doc, updateDoc, increment } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { incrementUsageCount, updateColorTasks } from '@lib/colors'
import {
	findPantoneByHex,
	findClosestPantoneByLab,
	hexToLab,
	hexToRgb,
	rgbToCmyk,
} from '@/utils/colorUtils'

interface ColorCardProps {
	color: PantoneColor & { labValues?: { l: number; a: number; b: number } }
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
	const [expandedAdditionalColors, setExpandedAdditionalColors] =
		useState(false)
	const [localTasks, setLocalTasks] = useState<
		Array<{ id: string; text: string; status: 'open' | 'done' }>
	>(
		(color.tasks as Array<{
			id: string
			text: string
			status: 'open' | 'done'
		}>) || []
	)

	// Синхронизируем локальные задачи при изменении color.tasks
	useEffect(() => {
		setLocalTasks(
			(color.tasks as Array<{
				id: string
				text: string
				status: 'open' | 'done'
			}>) || []
		)
	}, [color.tasks])

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
			anilox?: string
			items: Array<{ paint: string; amount: number }>
		}> = []

		let currentRecipe: (typeof recipes)[0] | null = null

		lines.forEach(line => {
			const totalAmountMatch = line.match(/^Общее количество: (\d+)/)
			const materialMatch = line.match(/^Материал: (.+)/)
			const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)
			const commentMatch = line.match(/^Комментарий: (.+)/)
			const aniloxMatch = line.match(/^Анилокс: (.+)/)

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
			} else if (aniloxMatch && currentRecipe) {
				currentRecipe.anilox = aniloxMatch[1]
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
            .tech-steps {
              margin-top: 18px;
              padding: 12px 0 0 0;
              border-top: 1px solid #e2e8f0;
            }
            .tech-steps h3 {
              font-size: 16px;
              margin-bottom: 8px;
              color: #333;
            }
            .tech-steps ol {
              padding-left: 20px;
            }
            .tech-steps li {
              margin-bottom: 4px;
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
							recipe => `
            <div class="recipe-card">
              <div class="recipe-header">
                <h2>Рецепт</h2>
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
                <div class="tech-steps">
                  <h3>Технологическая карта:</h3>
                  <ol>
                    ${generateTechSteps(recipe)
											.map(step => `<li>${step}</li>`)
											.join('')}
                  </ol>
                </div>
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

	// Функция для печати стикера
	const handlePrintSticker = (e: React.MouseEvent) => {
		e.stopPropagation()

		const recipes = parseRecipes(color.recipe || '')
		const firstRecipe = recipes[0]

		// Извлекаем анилокс из первого дополнительного цвета или рецепта
		const anilox =
			color.additionalColors?.[0]?.anilox || firstRecipe?.anilox || '-'

		// Формируем сокращенное местоположение (стеллаж + полка/секция без ряда и позиции)
		const getShortLocation = (location?: string) => {
			if (!location) return '-'
			const normalized = location.replace(/\\/g, '/').trim()

			// Для формата с частью: "2 Левая 1/4/1/1" → "2 Левая 1/4"
			const partMatch = normalized.match(
				/^(\d+)\s+(Левая|Правая)\s+(\d+)\/(\d+)(?:\/.*)?$/
			)
			if (partMatch) {
				return `${partMatch[1]} ${partMatch[2]} ${partMatch[3]}/${partMatch[4]}`
			}

			// Для простого формата: "1 1/4/1/1" → "1 1/4"
			const simpleMatch = normalized.match(/^(\d+)\s+(\d+)\/(\d+)(?:\/.*)?$/)
			if (simpleMatch) {
				return `${simpleMatch[1]} ${simpleMatch[2]}/${simpleMatch[3]}`
			}

			return location
		}

		const shortLocation = getShortLocation(color.shelfLocation)

		// Формируем информацию о дополнительных цветах в формате "анилокс - цвет"
		const additionalColorsText =
			color.additionalColors && color.additionalColors.length > 0
				? color.additionalColors
						.map(
							additionalColor =>
								`${additionalColor.anilox} - ${additionalColor.name}`
						)
						.join(', ')
				: anilox

		// Формируем строку рецепта в компактном виде - каждая краска с новой строки
		const recipeText = firstRecipe
			? firstRecipe.items
					.map(
						item =>
							`${item.paint.replace('Краска ', '').replace('краска ', '')} - ${
								item.amount
							}`
					)
					.join('<br>')
			: 'Нет рецепта'

		// Создаем содержимое стикера
		const stickerContent = `
      <html>
        <head>
          <title>Стикер ${color.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              background: white;
            }
            .sticker {
              width: 85mm;
              height: 55mm;
              border: 2px solid #000;
              border-radius: 3px;
              display: block;
              margin: 0 auto;
              overflow: hidden;
            }
            .sticker-table {
              width: 100%;
              height: 100%;
              border-collapse: collapse;
              font-size: 11px;
              line-height: 1.2;
            }
            .sticker-table td {
              border: 1px solid #000;
              padding: 2px 4px;
              vertical-align: middle;
              font-weight: bold;
            }
            .label-cell {
              background-color: #e8e8e8;
              width: 35%;
              text-align: center;
              font-size: 10px;
            }
            .value-cell {
              text-align: center;
              font-size: 12px;
            }
            .recipe-cell {
              font-size: 10px;
              line-height: 1.1;
            }
            @media print {
              body { margin: 0; padding: 5mm; }
              .sticker { 
                width: 85mm; 
                height: 55mm; 
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="sticker">
            <table class="sticker-table">
              <tr style="height: 15%;">
                <td class="label-cell">Номер тарного места</td>
                <td class="label-cell">Материал</td>
              </tr>
              <tr style="height: 15%;">
                <td class="value-cell">${shortLocation}</td>
                <td class="value-cell">${firstRecipe?.material || 'Бумага'}</td>
              </tr>
              <tr style="height: 15%;">
                <td class="label-cell">Номер Pantone</td>
                <td class="label-cell">Анилокс</td>
              </tr>
              <tr style="height: 15%;">
                <td class="value-cell">${color.name}${
			color.alternativeName ? ` (${color.alternativeName})` : ''
		}</td>
                <td class="value-cell">${additionalColorsText}</td>
              </tr>
              <tr style="height: 20%;">
                <td class="label-cell">Образец</td>
                <td class="label-cell">Рецепт</td>
              </tr>
              <tr style="height: 35%;">
                <td style="padding: 5px;">
                  <!-- Пустое место для приклеивания образца -->
                </td>
                <td class="recipe-cell">${recipeText}</td>
              </tr>
            </table>
          </div>
        </body>
      </html>
    `

		// Создаем новое окно для печати стикера
		const printWindow = window.open('', '_blank')
		if (printWindow) {
			printWindow.document.write(stickerContent)
			printWindow.document.close()
			printWindow.focus()

			// Даем время на загрузку стилей
			setTimeout(() => {
				printWindow.print()
				printWindow.close()
			}, 250)
		}
	}

	// Обновляем функцию hasMatchingRecipes
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
				// Проверяем, не связан ли уже этот цвет
				const isLinked =
					color.linkedColors?.includes(otherColor.id) ||
					otherColor.linkedColors?.includes(color.id)

				// Если цвета уже связаны, пропускаем проверку
				if (isLinked) return false

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
						// Проверяем совпадение процентов с допуском 0.3%
						return recipePaintsArray.every(paint => {
							const recipePercentage = recipePercentages.get(paint) || 0
							const otherPercentage = otherPercentages.get(paint) || 0
							const difference = Math.abs(recipePercentage - otherPercentage)
							return difference <= 0.3 // Допуск 0.3%
						})
					}
					return false
				})
			})
		})
	}

	const hasSimilarRecipes = color.recipe && hasMatchingRecipes(color.recipe)
	const hasRecipeHistory = color.recipeHistory && color.recipeHistory.length > 0

	// Функция для определения стиля обводки карточки
	const getBorderStyle = () => {
		// Если есть и похожие рецепты, и история - используем градиент
		if (hasSimilarRecipes && hasRecipeHistory) {
			return isDark
				? 'border-transparent bg-gradient-to-br from-rose-500/50 via-purple-500/50 to-rose-500/50 bg-clip-border border-2'
				: 'border-transparent bg-gradient-to-br from-rose-500/80 via-purple-500/80 to-rose-500/80 bg-clip-border border-2'
		}
		// Только история изменений - фиолетовая обводка
		if (hasRecipeHistory) {
			return isDark ? 'border-purple-500/60' : 'border-purple-500/80'
		}
		// Только похожие рецепты - красная обводка
		if (hasSimilarRecipes) {
			return isDark ? 'border-rose-500/50' : 'border-rose-500/80'
		}
		// Обычная обводка
		return isDark ? 'border-gray-700' : 'border-gray-200'
	}

	const handleIncrementUsage = async (e: React.MouseEvent) => {
		e.stopPropagation()
		try {
			await incrementUsageCount(color.id)
			onUpdate()

			// Трекинг использования цвета (не блокируем основную функциональность при ошибке)
			try {
				const { trackColorUsage } = await import('@lib/analytics')
				if (typeof trackColorUsage === 'function') {
					await trackColorUsage(
						color.id,
						color.name,
						1,
						undefined,
						color.recipe
					)
				}
			} catch (analyticsError) {
				// Тихо игнорируем ошибки аналитики
			}

			toast.success('Счетчик использований обновлен')
		} catch (error) {
			console.error('Error updating usage count:', error)
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

	// Pantone logic
	const pantoneMatch = findPantoneByHex(color.hex)
	const lab = color.labValues || hexToLab(color.hex)
	const closestPantone = pantoneMatch ? null : findClosestPantoneByLab(lab)
	const rgb = hexToRgb(color.hex)
	const cmyk = rgbToCmyk(...rgb)



	// Функция генерации технологических шагов
	function generateTechSteps(recipe: ReturnType<typeof parseRecipes>[0]) {
		const steps = []
		if (recipe.material) {
			steps.push(`Подготовьте материал: ${recipe.material}.`)
		}
		recipe.items.forEach(item => {
			steps.push(
				`Взвесьте и добавьте краску "${item.paint}" — ${item.amount} г.`
			)
		})
		steps.push(`Перемешайте до однородности.`)
		if (recipe.anilox) {
			steps.push(`Используйте анилокс: ${recipe.anilox}.`)
		}
		if (recipe.comment) {
			steps.push(`Примечание: ${recipe.comment}`)
		}
		return steps
	}

	const handleTaskDone = useCallback(
		async (taskId: string) => {
			const updatedTasks = localTasks.map(task =>
				task.id === taskId ? { ...task, status: 'done' as 'done' } : task
			)
			setLocalTasks(updatedTasks)
			try {
				await updateColorTasks(color.id, updatedTasks)
				// onUpdate нужен только если хотим перезагрузить все данные (например, если есть другие поля)
				// Можно не вызывать onUpdate, если только задачи меняются
			} catch (error) {
				toast.error('Ошибка при обновлении задачи')
				// Откатываем локально, если ошибка
				setLocalTasks(
					(color.tasks as Array<{
						id: string
						text: string
						status: 'open' | 'done'
					}>) || []
				)
			}
		},
		[color.id, localTasks]
	)

	function parseShelfLocation(loc?: string) {
		if (!loc) return null
		const normalized = loc.replace(/\\/g, '/').trim()
		// Сначала ищем часть
		const partMatch = normalized.match(
			/^(\d+)\s+(Левая|Правая)\s+(\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/
		)
		if (partMatch) {
			return {
				labels: ['Стеллаж', 'Часть', 'Секция/полка', 'Ряд', 'Позиция'],
				values: [
					partMatch[1],
					partMatch[2] + ' часть',
					partMatch[3] + '/' + partMatch[4],
					partMatch[5] || '',
					partMatch[6] || '',
				],
			}
		}
		// Без части
		const simpleMatch = normalized.match(
			/^(\d+)\s+(\d+)\/(\d+)(?:\/(\d+))?(?:\/(\d+))?$/
		)
		if (simpleMatch) {
			return {
				labels: ['Стеллаж', 'Секция/полка', 'Ряд', 'Позиция'],
				values: [
					simpleMatch[1],
					simpleMatch[2] + '/' + simpleMatch[3],
					simpleMatch[4] || '',
					simpleMatch[5] || '',
				],
			}
		}
		return null
	}
	const parsedLocation = parseShelfLocation(color.shelfLocation)

	const handleCopyId = (e: React.MouseEvent) => {
		e.stopPropagation()
		navigator.clipboard.writeText(color.id)
		toast.success('ID скопирован в буфер обмена!')
	}

	// Функция для получения подсказки об обводке
	const getBorderTooltip = () => {
		if (hasSimilarRecipes && hasRecipeHistory) {
			return 'У цвета есть похожие рецепты и история изменений'
		}
		if (hasRecipeHistory) {
			return 'У цвета есть история изменений рецепта'
		}
		if (hasSimilarRecipes) {
			return 'У цвета есть похожие рецепты в базе'
		}
		return ''
	}

	return (
		<div
			className={`relative group cursor-pointer rounded-2xl shadow-md overflow-hidden 
      transition-all duration-300 ease-out transform hover:scale-[1.03] hover:-translate-y-2 hover:shadow-2xl
      ${
				isLinkingMode && selectedForLink?.id === color.id
					? 'ring-4 ring-blue-500/50 shadow-blue-500/25'
					: ''
			}
      ${
				isDark
					? 'bg-gray-800/95 backdrop-blur-lg'
					: 'bg-white/95 backdrop-blur-lg'
			} 
      border-2 ${getBorderStyle()}`}
			onClick={handleCardClick}
			title={getBorderTooltip()}
		>
			{/* Color Preview Section */}
			<div className='relative overflow-hidden'>
				<div
					className='h-36 sm:h-44 relative transition-all duration-300 ease-out
					group-hover:shadow-[inset_0_-30px_40px_-15px_rgba(0,0,0,0.3)]
					before:absolute before:inset-0 before:bg-gradient-to-t before:from-black/20 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100'
					style={{
						backgroundColor: color.labValues
							? `lab(${color.labValues.l}% ${color.labValues.a} ${color.labValues.b})`
							: color.hex,
						background: `linear-gradient(135deg, ${color.hex} 0%, ${color.hex}dd 100%)`,
					}}
				>
					{/* Hex Code Overlay */}
					<div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/30 backdrop-blur-sm'>
						<div className='text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300'>
							<p className='text-white text-2xl font-mono font-bold tracking-wider drop-shadow-lg'>
								{color.hex}
							</p>
							<p className='text-white/90 text-sm font-medium mt-2'>
								Наведите курсор для увеличения
							</p>
						</div>
					</div>

					{/* Status Indicators */}
					<div className='absolute top-3 left-3 flex gap-2'>
						<div
							className={`w-5 h-5 rounded-full border-2 border-white shadow-lg ${
								color.isVerified ? 'bg-green-500' : 'bg-red-500'
							}`}
							title={color.isVerified ? 'Проверен' : 'Не проверен'}
						/>
						{(hasSimilarRecipes || hasRecipeHistory) && (
							<div
								className={`w-3 h-3 rounded-full border-2 border-white shadow-lg ${
									hasSimilarRecipes && hasRecipeHistory 
										? 'bg-gradient-to-r from-rose-500 to-purple-500'
										: hasRecipeHistory 
										? 'bg-purple-500' 
										: 'bg-rose-500'
								}`}
								title={getBorderTooltip()}
							/>
						)}
					</div>

					{/* Usage Count Badge */}
					<div className='absolute top-3 right-3'>
						<div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
							isDark
								? 'bg-gray-900/70 text-gray-100 border border-gray-700/50'
								: 'bg-white/70 text-gray-900 border border-gray-300/50'
						} shadow-lg`}>
							{color.usageCount || 0}
						</div>
					</div>
				</div>
			</div>

			{/* Content Section */}
			<div className='p-5 space-y-4'>
				{/* Title and Info */}
				<div className='space-y-2'>
					<div className='flex items-start justify-between gap-3'>
						<div className='flex-1 min-w-0'>
							<h3 className={`text-lg font-bold leading-tight ${
								isDark ? 'text-gray-100' : 'text-gray-900'
							}`}>
								{color.name}
							</h3>
							{color.alternativeName && (
								<p className={`text-sm font-medium mt-1 ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}>
									{color.alternativeName}
								</p>
							)}
						</div>
						
						{/* Stock Status */}
						<div className={`px-3 py-1 rounded-full text-xs font-medium border-2 ${
							color.inStock
								? isDark
									? 'bg-emerald-900/30 text-emerald-300 border-emerald-500/50'
									: 'bg-emerald-50 text-emerald-700 border-emerald-200'
								: isDark
								? 'bg-red-900/30 text-red-300 border-red-500/50'
								: 'bg-red-50 text-red-700 border-red-200'
						}`}>
							{color.inStock ? 'В наличии' : 'Нет в наличии'}
						</div>
					</div>

					{/* Development ID */}
					{process.env.NODE_ENV === 'development' && (
						<button
							onClick={handleCopyId}
							className={`text-xs font-mono opacity-60 hover:opacity-100 transition-opacity cursor-pointer ${
								isDark
									? 'text-yellow-400 hover:text-yellow-300'
									: 'text-orange-600 hover:text-orange-500'
							}`}
							title='ID цвета (клик для копирования)'
						>
							ID: {color.id}
						</button>
					)}

					{/* Color Values */}
					<div className={`grid grid-cols-2 gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
						<div>
							<span className='font-medium'>HEX:</span> <span className='font-mono'>{color.hex}</span>
						</div>
						<div>
							<span className='font-medium'>CMYK:</span> <span className='font-mono'>{cmyk[0]}, {cmyk[1]}, {cmyk[2]}, {cmyk[3]}</span>
						</div>
						<div className='col-span-2'>
							<span className='font-medium'>LAB:</span> <span className='font-mono'>{lab.l.toFixed(1)}, {lab.a.toFixed(1)}, {lab.b.toFixed(1)}</span>
						</div>
					</div>

					{/* Creation Date */}
					{color.createdAt && (
						<div className='flex items-center gap-2'>
							<Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
							<p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
								{formatDate(color.createdAt)}
								{color.updatedAt && ` • изм. ${formatDate(color.updatedAt)}`}
							</p>
						</div>
					)}
				</div>

				{/* Recipe */}
				{color.recipe &&
					parseRecipes(color.recipe).map((recipe, index) => (
						<div
							key={index}
							className={`group/recipe relative rounded-xl overflow-hidden transition-all duration-300 ${
								isDark
									? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 hover:from-blue-900/30 hover:to-blue-800/20 border border-blue-700/30 hover:border-blue-600/50'
									: 'bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 border border-blue-200/50 hover:border-blue-300/50'
							} shadow-sm hover:shadow-md`}
						>
							<button
								onClick={e => {
									e.stopPropagation()
									toggleRecipe(index)
								}}
								className='w-full p-4 text-left relative z-10'
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										<div className={`p-2 rounded-lg ${
											isDark ? 'bg-blue-800/40' : 'bg-blue-200/60'
										}`}>
											<Beaker className={`w-4 h-4 ${
												isDark ? 'text-blue-300' : 'text-blue-700'
											}`} />
										</div>
										<div>
											<p className={`text-sm font-semibold ${
												isDark ? 'text-blue-200' : 'text-blue-800'
											}`}>
												Рецепт {index + 1}
											</p>
											<p className={`text-xs opacity-75 ${
												isDark ? 'text-blue-300' : 'text-blue-600'
											}`}>
												{recipe.material} • {recipe.items.length} компонентов
											</p>
										</div>
									</div>
									<div className={`p-1 rounded-lg transition-transform duration-200 ${
										expandedRecipes.includes(index) ? 'rotate-180' : ''
									}`}>
										<ChevronDown className={`w-4 h-4 ${
											isDark ? 'text-blue-400' : 'text-blue-600'
										}`} />
									</div>
								</div>
							</button>

							{/* Expanded Recipe Content */}
							<div className={`overflow-hidden transition-all duration-300 ease-out ${
								expandedRecipes.includes(index) 
									? 'max-h-96 opacity-100' 
									: 'max-h-0 opacity-0'
							}`}>
								<div className='px-4 pb-4 space-y-3'>
									<div className={`h-px ${isDark ? 'bg-blue-700/30' : 'bg-blue-300/30'}`} />
									
									{recipe.anilox && (
										<div className={`text-xs font-medium ${
											isDark ? 'text-blue-300' : 'text-blue-700'
										}`}>
											Анилокс: {recipe.anilox}
										</div>
									)}
									
									{recipe.comment && (
										<div className={`p-3 rounded-lg italic text-sm ${
											isDark 
												? 'bg-blue-900/30 text-blue-200 border-l-4 border-blue-600' 
												: 'bg-blue-100/50 text-blue-800 border-l-4 border-blue-400'
										}`}>
											{recipe.comment}
										</div>
									)}

									<div className='space-y-2'>
										{recipe.items.map((item, itemIndex) => {
											const percentage = ((item.amount / recipe.totalAmount) * 100).toFixed(1)
											return (
												<div key={itemIndex} className={`flex justify-between items-center p-2 rounded-lg ${
													isDark ? 'bg-blue-900/20' : 'bg-white/50'
												}`}>
													<span className={`text-sm ${
														isDark ? 'text-blue-200' : 'text-blue-800'
													}`}>
														{item.paint}
													</span>
													<div className='text-right'>
														<div className={`text-sm font-semibold ${
															isDark ? 'text-blue-100' : 'text-blue-900'
														}`}>
															{percentage}%
														</div>
														<div className={`text-xs opacity-70 ${
															isDark ? 'text-blue-300' : 'text-blue-600'
														}`}>
															{item.amount} гр.
														</div>
													</div>
												</div>
											)
										})}
									</div>
								</div>
							</div>
						</div>
					))}

				{color.customers && color.customers.length > 0 && (
					<div className={`group/customers rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 hover:from-purple-900/30 hover:to-purple-800/20 border border-purple-700/30 hover:border-purple-600/50'
							: 'bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 border border-purple-200/50 hover:border-purple-300/50'
					} shadow-sm hover:shadow-md`}>
						<div className='p-4'>
							<div className='flex items-center gap-3 mb-3'>
								<div className={`p-2 rounded-lg ${
									isDark ? 'bg-purple-800/40' : 'bg-purple-200/60'
								}`}>
									<Users className={`w-4 h-4 ${
										isDark ? 'text-purple-300' : 'text-purple-700'
									}`} />
								</div>
								<div>
									<p className={`text-sm font-semibold ${
										isDark ? 'text-purple-200' : 'text-purple-800'
									}`}>
										Клиенты
									</p>
									<p className={`text-xs opacity-75 ${
										isDark ? 'text-purple-300' : 'text-purple-600'
									}`}>
										{color.customers.length} клиентов
									</p>
								</div>
							</div>
							<div className='flex flex-wrap gap-2'>
								{color.customers.map((customer, index) => (
									<span
										key={index}
										className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
											isDark
												? 'bg-purple-900/40 text-purple-200 border border-purple-700/50 hover:bg-purple-900/60'
												: 'bg-purple-100/80 text-purple-800 border border-purple-300/50 hover:bg-purple-200/80'
										} hover:scale-105`}
									>
										{customer}
									</span>
								))}
							</div>
						</div>
					</div>
				)}

				{color.manager && (
					<div className={`group/manager rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 hover:from-emerald-900/30 hover:to-emerald-800/20 border border-emerald-700/30 hover:border-emerald-600/50'
							: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 border border-emerald-200/50 hover:border-emerald-300/50'
					} shadow-sm hover:shadow-md`}>
						<div className='p-4'>
							<div className='flex items-center gap-3'>
								<div className={`p-2 rounded-lg ${
									isDark ? 'bg-emerald-800/40' : 'bg-emerald-200/60'
								}`}>
									<UserCircle className={`w-4 h-4 ${
										isDark ? 'text-emerald-300' : 'text-emerald-700'
									}`} />
								</div>
								<div>
									<p className={`text-xs font-medium ${
										isDark ? 'text-emerald-400' : 'text-emerald-600'
									}`}>
										Менеджер
									</p>
									<p className={`text-sm font-semibold ${
										isDark ? 'text-emerald-200' : 'text-emerald-800'
									}`}>
										{color.manager}
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{color.notes && (
					<div className={`group/notes rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-amber-900/20 to-amber-800/10 hover:from-amber-900/30 hover:to-amber-800/20 border border-amber-700/30 hover:border-amber-600/50'
							: 'bg-gradient-to-br from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50 border border-amber-200/50 hover:border-amber-300/50'
					} shadow-sm hover:shadow-md`}>
						<div className='p-4'>
							<div className='flex items-center gap-3 mb-3'>
								<div className={`p-2 rounded-lg ${
									isDark ? 'bg-amber-800/40' : 'bg-amber-200/60'
								}`}>
									<StickyNote className={`w-4 h-4 ${
										isDark ? 'text-amber-300' : 'text-amber-700'
									}`} />
								</div>
								<p className={`text-sm font-semibold ${
									isDark ? 'text-amber-200' : 'text-amber-800'
								}`}>
									Заметки
								</p>
							</div>
							<p className={`text-sm whitespace-pre-wrap leading-relaxed ${
								isDark ? 'text-amber-100' : 'text-amber-900'
							}`}>
								{color.notes}
							</p>
						</div>
					</div>
				)}

				{color.shelfLocation && (
					<div className={`group/location rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-teal-900/20 to-teal-800/10 hover:from-teal-900/30 hover:to-teal-800/20 border border-teal-700/30 hover:border-teal-600/50'
							: 'bg-gradient-to-br from-teal-50 to-teal-100/50 hover:from-teal-100 hover:to-teal-200/50 border border-teal-200/50 hover:border-teal-300/50'
					} shadow-sm hover:shadow-md`}>
						<div className='p-4'>
							<div className='flex items-center gap-3 mb-3'>
								<div className={`p-2 rounded-lg ${
									isDark ? 'bg-teal-800/40' : 'bg-teal-200/60'
								}`}>
									<svg className={`w-4 h-4 ${
										isDark ? 'text-teal-300' : 'text-teal-700'
									}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</div>
								<p className={`text-sm font-semibold ${
									isDark ? 'text-teal-200' : 'text-teal-800'
								}`}>
									Расположение
								</p>
							</div>
							{parsedLocation ? (
								<div className='space-y-2'>
									<div className='grid grid-cols-2 gap-2'>
										{parsedLocation.labels.map((label, i) => (
											parsedLocation.values[i] && (
												<div key={i} className={`p-2 rounded-lg ${
													isDark ? 'bg-teal-900/20' : 'bg-white/50'
												}`}>
													<div className={`text-xs opacity-75 ${
														isDark ? 'text-teal-400' : 'text-teal-600'
													}`}>
														{label}
													</div>
													<div className={`text-sm font-semibold font-mono ${
														isDark ? 'text-teal-100' : 'text-teal-900'
													}`}>
														{parsedLocation.values[i]}
													</div>
												</div>
											)
										))}
									</div>
								</div>
							) : (
								<div className={`p-3 rounded-lg text-sm font-mono ${
									isDark ? 'bg-teal-900/20 text-teal-100' : 'bg-white/50 text-teal-900'
								}`}>
									{color.shelfLocation}
								</div>
							)}
						</div>
					</div>
				)}

				{localTasks && localTasks.length > 0 && (
					<div className={`group/tasks rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-orange-900/20 to-orange-800/10 hover:from-orange-900/30 hover:to-orange-800/20 border border-orange-700/30 hover:border-orange-600/50'
							: 'bg-gradient-to-br from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 border border-orange-200/50 hover:border-orange-300/50'
					} shadow-sm hover:shadow-md`}>
						<div className='p-4'>
							<div className='flex items-center gap-3 mb-3'>
								<div className={`p-2 rounded-lg ${
									isDark ? 'bg-orange-800/40' : 'bg-orange-200/60'
								}`}>
									<StickyNote className={`w-4 h-4 ${
										isDark ? 'text-orange-300' : 'text-orange-700'
									}`} />
								</div>
								<div>
									<p className={`text-sm font-semibold ${
										isDark ? 'text-orange-200' : 'text-orange-800'
									}`}>
										Задачи/замечания
									</p>
									<p className={`text-xs opacity-75 ${
										isDark ? 'text-orange-300' : 'text-orange-600'
									}`}>
										{localTasks.filter(t => t.status === 'done').length} из {localTasks.length} выполнено
									</p>
								</div>
							</div>
							<div className='space-y-2'>
								{localTasks.map(task => (
									<div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
										isDark ? 'bg-orange-900/20 hover:bg-orange-900/30' : 'bg-white/50 hover:bg-white/80'
									}`}>
										<button
											className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
												task.status === 'done'
													? 'border-green-500 bg-green-500 text-white shadow-lg'
													: isDark
													? 'border-orange-600 hover:border-orange-500'
													: 'border-orange-400 hover:border-orange-500'
											}`}
											disabled={task.status === 'done'}
											onClick={e => {
												e.stopPropagation()
												if (task.status !== 'done') handleTaskDone(task.id)
											}}
											title={task.status === 'done' ? 'Выполнено' : 'Отметить как выполнено'}
										>
											{task.status === 'done' && (
												<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
												</svg>
											)}
										</button>
										<span className={`text-sm leading-relaxed flex-1 ${
											task.status === 'done' 
												? 'line-through opacity-60' 
												: isDark ? 'text-orange-100' : 'text-orange-900'
										}`}>
											{task.text}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				{color.linkedColors && color.linkedColors.length > 0 && (
					<div className={`group/linked rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 hover:from-indigo-900/30 hover:to-indigo-800/20 border border-indigo-700/30 hover:border-indigo-600/50'
							: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/50 border border-indigo-200/50 hover:border-indigo-300/50'
					} shadow-sm hover:shadow-md`}>
						<div className='p-4'>
							<div className='flex items-center gap-3 mb-3'>
								<div className={`p-2 rounded-lg ${
									isDark ? 'bg-indigo-800/40' : 'bg-indigo-200/60'
								}`}>
									<Link2 className={`w-4 h-4 ${
										isDark ? 'text-indigo-300' : 'text-indigo-700'
									}`} />
								</div>
								<div>
									<p className={`text-sm font-semibold ${
										isDark ? 'text-indigo-200' : 'text-indigo-800'
									}`}>
										Связанные цвета
									</p>
									<p className={`text-xs opacity-75 ${
										isDark ? 'text-indigo-300' : 'text-indigo-600'
									}`}>
										{color.linkedColors.length} связанных цветов
									</p>
								</div>
							</div>
							<div className='space-y-2'>
								{color.linkedColors.map(linkedId => {
									const linkedColor = colors.find(c => c.id === linkedId)
									if (!linkedColor) return null

									return (
										<div
											key={linkedId}
											className={`group/link flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
												isDark 
													? 'bg-indigo-900/20 hover:bg-indigo-900/30' 
													: 'bg-white/50 hover:bg-white/80'
											}`}
										>
											<div
												className='w-6 h-6 rounded-full border-2 border-white shadow-sm'
												style={{ backgroundColor: linkedColor.hex }}
											/>
											<div className='flex-1 min-w-0'>
												<p className={`text-sm font-medium truncate ${
													isDark ? 'text-indigo-100' : 'text-indigo-900'
												}`}>
													{linkedColor.name}
												</p>
												{linkedColor.alternativeName && (
													<p className={`text-xs opacity-75 truncate ${
														isDark ? 'text-indigo-300' : 'text-indigo-600'
													}`}>
														{linkedColor.alternativeName}
													</p>
												)}
											</div>
											{isAdmin && (
												<button
													onClick={e => {
														e.stopPropagation()
														onUnlink?.(linkedId)
													}}
													className={`p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover/link:opacity-100 hover:scale-110 ${
														isDark
															? 'hover:bg-red-900/30 text-red-400 hover:text-red-300'
															: 'hover:bg-red-50 text-red-500 hover:text-red-600'
													}`}
													title="Удалить связь"
												>
													<X className='w-4 h-4' />
												</button>
											)}
										</div>
									)
								})}
							</div>
						</div>
					</div>
				)}

				{/* Additional Colors Section */}
				{color.additionalColors && color.additionalColors.length > 0 && (
					<div className={`group/additional rounded-xl overflow-hidden transition-all duration-300 ${
						isDark
							? 'bg-gradient-to-br from-violet-900/20 to-violet-800/10 hover:from-violet-900/30 hover:to-violet-800/20 border border-violet-700/30 hover:border-violet-600/50'
							: 'bg-gradient-to-br from-violet-50 to-violet-100/50 hover:from-violet-100 hover:to-violet-200/50 border border-violet-200/50 hover:border-violet-300/50'
					} shadow-sm hover:shadow-md`}>
						<button
							onClick={e => {
								e.stopPropagation()
								setExpandedAdditionalColors(!expandedAdditionalColors)
							}}
							className='w-full p-4 text-left relative z-10'
						>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-3'>
									<div className={`p-2 rounded-lg ${
										isDark ? 'bg-violet-800/40' : 'bg-violet-200/60'
									}`}>
										<Beaker className={`w-4 h-4 ${
											isDark ? 'text-violet-300' : 'text-violet-700'
										}`} />
									</div>
									<div>
										<p className={`text-sm font-semibold ${
											isDark ? 'text-violet-200' : 'text-violet-800'
										}`}>
											Дополнительные цвета
										</p>
										<p className={`text-xs opacity-75 ${
											isDark ? 'text-violet-300' : 'text-violet-600'
										}`}>
											{color.additionalColors.length} дополнительных цветов
										</p>
									</div>
								</div>
								<div className={`p-1 rounded-lg transition-transform duration-200 ${
									expandedAdditionalColors ? 'rotate-180' : ''
								}`}>
									<ChevronDown className={`w-4 h-4 ${
										isDark ? 'text-violet-400' : 'text-violet-600'
									}`} />
								</div>
							</div>
						</button>

						{/* Expanded Additional Colors Content */}
						<div className={`overflow-hidden transition-all duration-300 ease-out ${
							expandedAdditionalColors 
								? 'max-h-96 opacity-100' 
								: 'max-h-0 opacity-0'
						}`}>
							<div className='px-4 pb-4 space-y-3'>
								<div className={`h-px ${isDark ? 'bg-violet-700/30' : 'bg-violet-300/30'}`} />
								{color.additionalColors.map((additionalColor, index) => {
									// Pantone info for additional color
									const pantoneMatch = findPantoneByHex(additionalColor.hex)
									const lab = additionalColor.labValues || hexToLab(additionalColor.hex)
									const closestPantone = pantoneMatch ? null : findClosestPantoneByLab(lab)

									return (
										<div key={index} className={`p-3 rounded-lg ${
											isDark ? 'bg-violet-900/20' : 'bg-white/50'
										}`}>
											<div className='flex items-center gap-3 mb-2'>
												<div
													className='w-8 h-8 rounded-lg border-2 border-white shadow-sm'
													style={{ backgroundColor: additionalColor.hex }}
												/>
												<div className='flex-1'>
													<p className={`text-sm font-semibold ${
														isDark ? 'text-violet-100' : 'text-violet-900'
													}`}>
														{additionalColor.name}
													</p>
													<p className={`text-xs opacity-75 ${
														isDark ? 'text-violet-300' : 'text-violet-600'
													}`}>
														Анилокс: {additionalColor.anilox} • {additionalColor.hex}
													</p>
												</div>
											</div>
											
											{additionalColor.labValues && (
												<div className={`text-xs space-x-3 mb-2 ${
													isDark ? 'text-violet-300' : 'text-violet-600'
												}`}>
													<span>L: {additionalColor.labValues.l.toFixed(1)}</span>
													<span>a: {additionalColor.labValues.a.toFixed(1)}</span>
													<span>b: {additionalColor.labValues.b.toFixed(1)}</span>
												</div>
											)}
											
											{/* Pantone info for additional color */}
											{pantoneMatch ? (
												<div className={`text-xs p-2 rounded-lg ${
													isDark 
														? 'bg-blue-900/30 text-blue-200' 
														: 'bg-blue-100/50 text-blue-800'
												}`}>
													<strong>Pantone:</strong> {pantoneMatch.pantone} • {pantoneMatch.hex}
												</div>
											) : closestPantone ? (
												<div className={`text-xs p-2 rounded-lg ${
													isDark 
														? 'bg-yellow-900/30 text-yellow-200' 
														: 'bg-yellow-100/50 text-yellow-800'
												}`}>
													<strong>Ближайший Pantone:</strong> {closestPantone.pantone} • {closestPantone.hex} • ΔE={closestPantone.deltaE.toFixed(2)}
												</div>
											) : null}
										</div>
									)
								})}
							</div>
						</div>
					</div>
				)}

				{/* Pantone Information */}
				{(pantoneMatch || closestPantone) && (
					<div className={`rounded-xl overflow-hidden transition-all duration-300 ${
						pantoneMatch 
							? isDark
								? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30'
								: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50'
							: isDark
								? 'bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border border-yellow-700/30'
								: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/50'
					} shadow-sm`}>
						<div className='p-4'>
							<div className='flex items-center gap-3'>
								<div className={`p-2 rounded-lg ${
									pantoneMatch 
										? isDark ? 'bg-blue-800/40' : 'bg-blue-200/60'
										: isDark ? 'bg-yellow-800/40' : 'bg-yellow-200/60'
								}`}>
									<svg className={`w-4 h-4 ${
										pantoneMatch 
											? isDark ? 'text-blue-300' : 'text-blue-700'
											: isDark ? 'text-yellow-300' : 'text-yellow-700'
									}`} fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
								</div>
								<div>
									{pantoneMatch ? (
										<>
											<p className={`text-sm font-semibold ${
												isDark ? 'text-blue-200' : 'text-blue-800'
											}`}>
												Точное совпадение Pantone
											</p>
											<p className={`text-xs ${
												isDark ? 'text-blue-300' : 'text-blue-600'
											}`}>
												{pantoneMatch.pantone} • {pantoneMatch.hex}
											</p>
										</>
									) : (
										<>
											<p className={`text-sm font-semibold ${
												isDark ? 'text-yellow-200' : 'text-yellow-800'
											}`}>
												Ближайший Pantone
											</p>
											<p className={`text-xs ${
												isDark ? 'text-yellow-300' : 'text-yellow-600'
											}`}>
												{closestPantone!.pantone} • {closestPantone!.hex} • ΔE={closestPantone!.deltaE.toFixed(2)}
											</p>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className={`flex items-center justify-between p-4 rounded-xl mt-4 ${
					isDark
						? 'bg-gray-800/50 border border-gray-700/50'
						: 'bg-gray-50/80 border border-gray-200/50'
				} backdrop-blur-sm`}>
					{/* Quick Actions */}
					<div className='flex items-center gap-2'>
						<button
							onClick={handleIncrementUsage}
							className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
								isDark
									? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300'
									: 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700'
							} border border-current/20 hover:border-current/40`}
							title='Увеличить счетчик использований'
						>
							<Plus className='w-4 h-4' />
						</button>

						{color.recipe && (
							<>
								<button
									onClick={e => {
										e.stopPropagation()
										handlePrint(e)
									}}
									className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
										isDark
											? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-gray-100'
											: 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
									} border border-current/20 hover:border-current/40`}
									title='Печать рецепта'
								>
									<Printer className='w-4 h-4' />
								</button>
								<button
									onClick={e => {
										e.stopPropagation()
										handlePrintSticker(e)
									}}
									className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
										isDark
											? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-gray-100'
											: 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
									} border border-current/20 hover:border-current/40`}
									title='Печать стикера для ведра'
								>
									<Tag className='w-4 h-4' />
								</button>
							</>
						)}
					</div>

					{/* Admin Actions */}
					{isAdmin && (
						<div className='flex items-center gap-2'>
							<button
								onClick={e => {
									e.stopPropagation()
									onEdit()
								}}
								className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
									isDark
										? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-gray-100'
										: 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
								} border border-current/20 hover:border-current/40`}
								title='Редактировать'
							>
								<Edit className='w-4 h-4' />
							</button>
							<button
								onClick={e => {
									e.stopPropagation()
									onDelete()
								}}
								className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
									isDark
										? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300'
										: 'bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700'
								} border border-current/20 hover:border-current/40`}
								title='Удалить'
							>
								<Trash2 className='w-4 h-4' />
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
