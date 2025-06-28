import React, { useRef, useEffect, useState, useCallback } from 'react'
import { PantoneColor } from '@/types'
import { calculateDeltaE } from '@/utils/colorUtils'
import { useTheme } from '@/contexts/ThemeContext'
import { Slider } from '@/components/ui/Slider'
import { Button } from '@/components/ui/Button/Button'

interface ColorMap2DProps {
	colors: PantoneColor[]
	selectedColor?: PantoneColor
	onColorSelect?: (color: PantoneColor) => void
	width?: number
	height?: number
}

interface ColorPoint {
	color: PantoneColor
	x: number
	y: number
	distance?: number
}

const ColorMap2D: React.FC<ColorMap2DProps> = ({
	colors,
	selectedColor,
	onColorSelect,
	width = 500,
	height = 500,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [lightness, setLightness] = useState(50) // L* значение от 0 до 100
	const [tolerance, setTolerance] = useState(10) // Допуск по L* для отображения цветов
	const [hoveredColor, setHoveredColor] = useState<PantoneColor | null>(null)
	const [showSimilarColors, setShowSimilarColors] = useState(false)
	const [similarityThreshold, setSimilarityThreshold] = useState(5)
	const [showAllColors, setShowAllColors] = useState(false)
	const { isDark } = useTheme()

	// Преобразование a*b* координат в координаты canvas
	const labToCanvas = useCallback(
		(a: number, b: number): { x: number; y: number } => {
			const centerX = width / 2
			const centerY = height / 2
			const scale = 2 // Масштаб для отображения

			return {
				x: centerX + a * scale,
				y: centerY - b * scale, // Инвертируем Y для правильной ориентации
			}
		},
		[width, height]
	)

	// Преобразование координат canvas в a*b*
	const canvasToLab = useCallback(
		(x: number, y: number): { a: number; b: number } => {
			const centerX = width / 2
			const centerY = height / 2
			const scale = 2

			return {
				a: (x - centerX) / scale,
				b: -(y - centerY) / scale, // Инвертируем Y
			}
		},
		[width, height]
	)

	// Фильтрация цветов по заданному уровню светлости
	const getVisibleColors = useCallback((): ColorPoint[] => {
		// Если включен режим "показать все", отображаем все цвета с LAB значениями
		if (showAllColors) {
			return colors
				.filter(color => color.labValues)
				.map(color => {
					const canvasPos = labToCanvas(color.labValues!.a, color.labValues!.b)
					const distance = selectedColor?.labValues
						? calculateDeltaE(color.labValues!, selectedColor.labValues)
						: undefined

					return {
						color,
						x: canvasPos.x,
						y: canvasPos.y,
						distance,
					}
				})
				.sort((a, b) => {
					// Сортируем по расстоянию от выбранного цвета
					if (a.distance !== undefined && b.distance !== undefined) {
						return a.distance - b.distance
					}
					return 0
				})
		}

		let filteredColors = colors.filter(color => {
			if (!color.labValues) return false
			return Math.abs(color.labValues.l - lightness) <= tolerance
		})

		// Если включен режим показа похожих цветов и выбран цвет, фильтруем только похожие
		if (showSimilarColors && selectedColor?.labValues) {
			filteredColors = filteredColors.filter(color => {
				if (color.id === selectedColor.id) return true // Всегда показываем выбранный цвет
				if (!color.labValues) return false
				const distance = calculateDeltaE(
					color.labValues,
					selectedColor.labValues!
				)
				return distance <= similarityThreshold
			})
		}

		return filteredColors
			.map(color => {
				const canvasPos = labToCanvas(color.labValues!.a, color.labValues!.b)
				const distance = selectedColor?.labValues
					? calculateDeltaE(color.labValues!, selectedColor.labValues)
					: undefined

				return {
					color,
					x: canvasPos.x,
					y: canvasPos.y,
					distance,
				}
			})
			.sort((a, b) => {
				// Сортируем по расстоянию от выбранного цвета
				if (a.distance !== undefined && b.distance !== undefined) {
					return a.distance - b.distance
				}
				return 0
			})
	}, [
		colors,
		lightness,
		tolerance,
		labToCanvas,
		selectedColor,
		calculateDeltaE,
		showSimilarColors,
		similarityThreshold,
		showAllColors,
	])

	// Рендеринг карты
	const render = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Очистка canvas
		ctx.fillStyle = isDark ? '#1f2937' : '#f9fafb'
		ctx.fillRect(0, 0, width, height)

		// Рисуем сетку
		drawGrid(ctx)

		// Рисуем оси координат
		drawAxes(ctx)

		// Получаем видимые цвета
		const visibleColors = getVisibleColors()

		// Рисуем цвета
		visibleColors.forEach(({ color, x, y, distance }) => {
			const isSelected = selectedColor?.id === color.id
			const isHovered = hoveredColor?.id === color.id
			// Все видимые цвета в режиме showSimilarColors уже отфильтрованы как похожие
			const isSimilar = showSimilarColors && selectedColor && !isSelected

			// Размер точки
			let radius = 4
			if (isSelected) radius = 8
			else if (isHovered) radius = 6
			else if (isSimilar) radius = 5

			// Рисуем точку
			ctx.beginPath()
			ctx.arc(x, y, radius, 0, 2 * Math.PI)
			ctx.fillStyle = color.hex
			ctx.fill()

			// Обводка
			if (isSelected || isHovered || isSimilar) {
				ctx.strokeStyle = isSelected
					? '#3b82f6'
					: isHovered
					? '#6b7280'
					: isSimilar
					? '#f59e0b'
					: '#6b7280'
				ctx.lineWidth = isSelected ? 3 : 2
				ctx.stroke()
			}

			// Подпись для выбранного цвета
			if (isSelected) {
				ctx.fillStyle = isDark ? '#ffffff' : '#000000'
				ctx.font = '12px system-ui'
				ctx.textAlign = 'center'
				ctx.fillText(color.name, x, y - 15)

				// Показываем LAB значения
				if (color.labValues) {
					ctx.fillText(
						`L*:${color.labValues.l.toFixed(0)} a*:${color.labValues.a.toFixed(
							0
						)} b*:${color.labValues.b.toFixed(0)}`,
						x,
						y + 25
					)
				}
			}

			// Показываем расстояние для похожих цветов
			if (isSimilar && distance !== undefined && distance > 0) {
				ctx.fillStyle = isDark ? '#f59e0b' : '#d97706'
				ctx.font = '10px system-ui'
				ctx.textAlign = 'center'
				ctx.fillText(`ΔE:${distance.toFixed(1)}`, x, y - 8)
			}
		})

		// Рисуем курсор для выбранного цвета
		if (selectedColor?.labValues) {
			const pos = labToCanvas(
				selectedColor.labValues.a,
				selectedColor.labValues.b
			)
			ctx.strokeStyle = '#3b82f6'
			ctx.lineWidth = 2
			ctx.setLineDash([5, 5])
			ctx.beginPath()
			ctx.arc(pos.x, pos.y, 15, 0, 2 * Math.PI)
			ctx.stroke()
			ctx.setLineDash([])
		}
	}, [
		colors,
		lightness,
		tolerance,
		selectedColor,
		hoveredColor,
		showSimilarColors,
		similarityThreshold,
		isDark,
		width,
		height,
		labToCanvas,
		getVisibleColors,
	])

	// Рисование сетки
	const drawGrid = useCallback(
		(ctx: CanvasRenderingContext2D) => {
			const step = 20 // Шаг сетки
			ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb'
			ctx.lineWidth = 1

			// Вертикальные линии
			for (let x = 0; x <= width; x += step) {
				ctx.beginPath()
				ctx.moveTo(x, 0)
				ctx.lineTo(x, height)
				ctx.stroke()
			}

			// Горизонтальные линии
			for (let y = 0; y <= height; y += step) {
				ctx.beginPath()
				ctx.moveTo(0, y)
				ctx.lineTo(width, y)
				ctx.stroke()
			}
		},
		[isDark, width, height]
	)

	// Рисование осей координат
	const drawAxes = useCallback(
		(ctx: CanvasRenderingContext2D) => {
			const centerX = width / 2
			const centerY = height / 2

			ctx.strokeStyle = isDark ? '#6b7280' : '#374151'
			ctx.lineWidth = 2

			// Горизонтальная ось (a*)
			ctx.beginPath()
			ctx.moveTo(0, centerY)
			ctx.lineTo(width, centerY)
			ctx.stroke()

			// Вертикальная ось (b*)
			ctx.beginPath()
			ctx.moveTo(centerX, 0)
			ctx.lineTo(centerX, height)
			ctx.stroke()

			// Подписи осей
			ctx.fillStyle = isDark ? '#ffffff' : '#000000'
			ctx.font = '14px system-ui'
			ctx.textAlign = 'center'

			// a* ось
			ctx.fillStyle = '#ef4444'
			ctx.fillText('-a* (зелёный)', 60, centerY - 10)
			ctx.fillText('+a* (красный)', width - 60, centerY - 10)

			// b* ось
			ctx.save()
			ctx.translate(centerX - 10, 60)
			ctx.rotate(-Math.PI / 2)
			ctx.fillStyle = '#eab308'
			ctx.fillText('+b* (жёлтый)', 0, 0)
			ctx.restore()

			ctx.save()
			ctx.translate(centerX - 10, height - 60)
			ctx.rotate(-Math.PI / 2)
			ctx.fillStyle = '#3b82f6'
			ctx.fillText('-b* (синий)', 0, 0)
			ctx.restore()
		},
		[isDark, width, height]
	)

	// Найти цвет под курсором
	const getColorAtPosition = useCallback(
		(x: number, y: number): PantoneColor | null => {
			const tolerance = 8
			const visibleColors = getVisibleColors()

			for (const { color, x: cx, y: cy } of visibleColors) {
				const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2))
				if (distance <= tolerance) {
					return color
				}
			}

			return null
		},
		[getVisibleColors]
	)

	// Обработчики событий мыши
	const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const rect = canvasRef.current?.getBoundingClientRect()
		if (!rect) return

		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		const color = getColorAtPosition(x, y)
		setHoveredColor(color)
	}

	const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const rect = canvasRef.current?.getBoundingClientRect()
		if (!rect) return

		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		const color = getColorAtPosition(x, y)
		if (color && onColorSelect) {
			onColorSelect(color)
		}
	}

	const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const rect = canvasRef.current?.getBoundingClientRect()
		if (!rect) return

		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		const labCoords = canvasToLab(x, y)

		// Находим ближайший цвет к этой точке
		const targetLab = { l: lightness, a: labCoords.a, b: labCoords.b }
		let closestColor: PantoneColor | null = null
		let minDistance = Infinity

		colors.forEach(color => {
			if (!color.labValues) return
			const distance = calculateDeltaE(color.labValues, targetLab)
			if (distance < minDistance) {
				minDistance = distance
				closestColor = color
			}
		})

		if (closestColor && onColorSelect) {
			onColorSelect(closestColor)
		}
	}

	useEffect(() => {
		render()
	}, [render])

	// Сбрасываем режим показа похожих цветов только при полной очистке выбранного цвета
	useEffect(() => {
		if (!selectedColor) {
			setShowSimilarColors(false)
		}
	}, [selectedColor])

	const visibleColors = getVisibleColors()

	return (
		<div className='space-y-4'>
			{/* Управление */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div>
					<label
						className={`block text-sm font-medium mb-2 ${
							isDark ? 'text-gray-300' : 'text-gray-700'
						} ${showAllColors ? 'opacity-50' : ''}`}
					>
						Светлота L*: {lightness}
					</label>
					<Slider
						value={lightness}
						min={0}
						max={100}
						step={1}
						onChange={setLightness}
						className='w-full'
						disabled={showAllColors}
					/>
				</div>

				<div>
					<label
						className={`block text-sm font-medium mb-2 ${
							isDark ? 'text-gray-300' : 'text-gray-700'
						} ${showAllColors ? 'opacity-50' : ''}`}
					>
						Допуск по L*: ±{tolerance}
					</label>
					<Slider
						value={tolerance}
						min={1}
						max={25}
						step={1}
						onChange={setTolerance}
						className='w-full'
						disabled={showAllColors}
					/>
				</div>
			</div>

			{/* Кнопка показать все цвета */}
			<div className='flex items-center justify-center'>
				<Button
					variant={showAllColors ? 'primary' : 'outline'}
					onClick={() => {
						setShowAllColors(!showAllColors)
						if (!showAllColors) {
							// При включении режима "показать все" сбрасываем другие фильтры
							setShowSimilarColors(false)
						}
					}}
					className='w-full max-w-md'
				>
					{showAllColors ? 'Применить фильтры' : 'Показать все цвета'}
				</Button>
			</div>

			{/* Опции отображения */}
			{selectedColor && !showAllColors && (
				<div className='flex items-center gap-4'>
					<label className='flex items-center gap-2'>
						<input
							type='checkbox'
							checked={showSimilarColors}
							onChange={e => setShowSimilarColors(e.target.checked)}
							disabled={!selectedColor}
							className='rounded disabled:opacity-50'
						/>
						<span
							className={`text-sm ${
								isDark ? 'text-gray-300' : 'text-gray-700'
							} ${!selectedColor ? 'opacity-50' : ''}`}
						>
							Показать только похожие цвета
						</span>
					</label>

					{showSimilarColors && (
						<div className='flex items-center gap-2'>
							<span
								className={`text-sm ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								ΔE ≤
							</span>
							<Slider
								value={similarityThreshold}
								min={1}
								max={10}
								step={0.5}
								onChange={setSimilarityThreshold}
								className='w-20'
							/>
							<span
								className={`text-sm ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								{similarityThreshold}
							</span>
						</div>
					)}
				</div>
			)}

			{/* Карта цветов */}
			<div className='relative'>
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					className={`border rounded-lg cursor-crosshair ${
						isDark ? 'border-gray-600' : 'border-gray-300'
					}`}
					onMouseMove={handleMouseMove}
					onClick={handleClick}
					onDoubleClick={handleDoubleClick}
				/>

				{/* Информация о наведенном цвете */}
				{hoveredColor && (
					<div
						className={`absolute top-2 right-2 p-3 rounded border ${
							isDark
								? 'bg-gray-800 border-gray-600 text-white'
								: 'bg-white border-gray-300 text-gray-900'
						} shadow-lg max-w-xs`}
					>
						<div className='flex items-center gap-2 mb-2'>
							<div
								className='w-5 h-5 rounded border'
								style={{ backgroundColor: hoveredColor.hex }}
							></div>
							<span className='font-medium text-sm'>{hoveredColor.name}</span>
						</div>
						{hoveredColor.labValues && (
							<div className='text-xs space-y-1'>
								<div>
									L*: {hoveredColor.labValues.l.toFixed(1)}, a*:{' '}
									{hoveredColor.labValues.a.toFixed(1)}, b*:{' '}
									{hoveredColor.labValues.b.toFixed(1)}
								</div>
								<div className='text-gray-500'>{hoveredColor.category}</div>
								{selectedColor?.labValues && (
									<div className='text-blue-600 font-medium'>
										ΔE:{' '}
										{calculateDeltaE(
											hoveredColor.labValues,
											selectedColor.labValues
										).toFixed(2)}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Статистика */}
				<div
					className={`absolute bottom-2 left-2 p-2 rounded ${
						isDark
							? 'bg-gray-800/80 text-gray-300'
							: 'bg-white/80 text-gray-700'
					} text-xs`}
				>
					{showAllColors ? (
						`Отображены все цвета: ${visibleColors.length} из ${colors.length}`
					) : showSimilarColors && selectedColor ? (
						<>
							Похожих цветов: {visibleColors.length - 1} (ΔE ≤{' '}
							{similarityThreshold})
							<br />
							Всего в диапазоне L*:{' '}
							{
								colors.filter(
									color =>
										color.labValues &&
										Math.abs(color.labValues.l - lightness) <= tolerance
								).length
							}
						</>
					) : (
						`Отображено цветов: ${visibleColors.length} из ${colors.length}`
					)}
				</div>
			</div>

			{/* Инструкция */}
			<div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
				Кликните на цвет для выбора • Двойной клик для поиска ближайшего цвета в
				точке
			</div>
		</div>
	)
}

export default ColorMap2D
