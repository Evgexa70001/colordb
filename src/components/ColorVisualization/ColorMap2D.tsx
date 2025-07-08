import React, { useRef, useEffect, useState, useCallback } from 'react'
import { calculateDeltaE, calculateDeltaEWithCalibration, SPECTROPHOTOMETER_CALIBRATIONS } from '@/utils/colorUtils'
import { useTheme } from '@/contexts/ThemeContext'
import { Input } from '@/components/ui/Input'

interface ColorMap2DProps {
	width?: number
	height?: number
}

interface LabCoordinates {
	l: number
	a: number
	b: number
}

interface PaintRecommendation {
	paint: string
	action: 'add' | 'reduce'
	amount: string
	reason: string
}

interface ColorComparison {
	sample: LabCoordinates | null
	result: LabCoordinates | null
	deltaE: number | null
	recommendations: string[]
	paintRecommendations: PaintRecommendation[]
}

const ColorMap2D: React.FC<ColorMap2DProps> = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 })
	const [comparison, setComparison] = useState<ColorComparison>({
		sample: null,
		result: null,
		deltaE: null,
		recommendations: [],
		paintRecommendations: []
	})
	const [useXriteCalibration, setUseXriteCalibration] = useState(true)
	const { isDark } = useTheme()

	// Адаптивные размеры canvas
	useEffect(() => {
		const updateCanvasSize = () => {
			const container = canvasRef.current?.parentElement
			if (container) {
				const containerWidth = container.clientWidth
				const mobileSize = Math.min(containerWidth - 32, 400) // Отступы по 16px с каждой стороны
				const desktopSize = Math.min(containerWidth - 32, 500)
				const isMobile = window.innerWidth < 768
				const size = isMobile ? mobileSize : desktopSize
				
				setCanvasSize({ width: size, height: size })
			}
		}

		updateCanvasSize()
		window.addEventListener('resize', updateCanvasSize)
		return () => window.removeEventListener('resize', updateCanvasSize)
	}, [])

	// Преобразование a*b* координат в координаты canvas
	const labToCanvas = useCallback(
		(a: number, b: number): { x: number; y: number } => {
			const centerX = canvasSize.width / 2
			const centerY = canvasSize.height / 2
			const scale = 2

			return {
				x: centerX + a * scale,
				y: centerY - b * scale,
			}
		},
		[canvasSize.width, canvasSize.height]
	)

	// Функция для расчета расстояния с учетом калибровки
	const calculateDistance = useCallback((
		lab1: LabCoordinates,
		lab2: LabCoordinates
	): number => {
		if (useXriteCalibration) {
			return calculateDeltaEWithCalibration(
				lab1,
				lab2,
				SPECTROPHOTOMETER_CALIBRATIONS.xrite
			)
		}
		return calculateDeltaE(lab1, lab2)
	}, [useXriteCalibration])

	// Генерация рекомендаций по краскам
	const generatePaintRecommendations = useCallback((sample: LabCoordinates, result: LabCoordinates): PaintRecommendation[] => {
		const recommendations: PaintRecommendation[] = []
		const deltaL = result.l - sample.l
		const deltaA = result.a - sample.a
		const deltaB = result.b - sample.b

		// Анализ по L* (светлота) - используем Transparent или Kontur
		if (Math.abs(deltaL) > 2) {
			if (deltaL > 0) {
				// Результат слишком светлый - нужно затемнить
				const amount = Math.abs(deltaL) > 5 ? 'большое количество' : 'небольшое количество'
				recommendations.push({
					paint: 'Kontur',
					action: 'add',
					amount,
					reason: `Уменьшить светлоту на ${Math.abs(deltaL).toFixed(1)} единиц`
				})
			} else {
				// Результат слишком темный - нужно осветлить
				const amount = Math.abs(deltaL) > 5 ? 'большое количество' : 'небольшое количество'
				recommendations.push({
					paint: 'Transparent',
					action: 'add',
					amount,
					reason: `Увеличить светлоту на ${Math.abs(deltaL).toFixed(1)} единиц`
				})
			}
		}

		// Анализ по a* (красно-зеленый) - используем Magenta
		if (Math.abs(deltaA) > 2) {
			if (deltaA > 0) {
				// Результат слишком красный - нужно уменьшить красный
				const amount = Math.abs(deltaA) > 5 ? 'большое количество' : 'небольшое количество'
				recommendations.push({
					paint: 'Cyan',
					action: 'add',
					amount,
					reason: `Уменьшить красный оттенок на ${Math.abs(deltaA).toFixed(1)} единиц`
				})
			} else {
				// Результат слишком зеленый - нужно добавить красный
				const amount = Math.abs(deltaA) > 5 ? 'большое количество' : 'небольшое количество'
				recommendations.push({
					paint: 'Magenta',
					action: 'add',
					amount,
					reason: `Увеличить красный оттенок на ${Math.abs(deltaA).toFixed(1)} единиц`
				})
			}
		}

		// Анализ по b* (желто-синий) - используем Yellow
		if (Math.abs(deltaB) > 2) {
			if (deltaB > 0) {
				// Результат слишком желтый - нужно уменьшить желтый
				const amount = Math.abs(deltaB) > 5 ? 'большое количество' : 'небольшое количество'
				recommendations.push({
					paint: 'Cyan',
					action: 'add',
					amount,
					reason: `Уменьшить желтый оттенок на ${Math.abs(deltaB).toFixed(1)} единиц`
				})
			} else {
				// Результат слишком синий - нужно добавить желтый
				const amount = Math.abs(deltaB) > 5 ? 'большое количество' : 'небольшое количество'
				recommendations.push({
					paint: 'Yellow',
					action: 'add',
					amount,
					reason: `Увеличить желтый оттенок на ${Math.abs(deltaB).toFixed(1)} единиц`
				})
			}
		}

		return recommendations
	}, [])

	// Анализ различий и генерация рекомендаций
	const analyzeDifferences = useCallback((sample: LabCoordinates, result: LabCoordinates): string[] => {
		const recommendations: string[] = []
		const deltaL = result.l - sample.l
		const deltaA = result.a - sample.a
		const deltaB = result.b - sample.b

		// Анализ по L* (светлота)
		if (Math.abs(deltaL) > 2) {
			if (deltaL > 0) {
				recommendations.push(`Уменьшить светлоту на ${Math.abs(deltaL).toFixed(1)} единиц (L* слишком высокий)`)
			} else {
				recommendations.push(`Увеличить светлоту на ${Math.abs(deltaL).toFixed(1)} единиц (L* слишком низкий)`)
			}
		}

		// Анализ по a* (красно-зеленый)
		if (Math.abs(deltaA) > 2) {
			if (deltaA > 0) {
				recommendations.push(`Уменьшить красный оттенок на ${Math.abs(deltaA).toFixed(1)} единиц (a* слишком высокий)`)
			} else {
				recommendations.push(`Увеличить красный оттенок на ${Math.abs(deltaA).toFixed(1)} единиц (a* слишком низкий)`)
			}
		}

		// Анализ по b* (желто-синий)
		if (Math.abs(deltaB) > 2) {
			if (deltaB > 0) {
				recommendations.push(`Уменьшить желтый оттенок на ${Math.abs(deltaB).toFixed(1)} единиц (b* слишком высокий)`)
			} else {
				recommendations.push(`Увеличить желтый оттенок на ${Math.abs(deltaB).toFixed(1)} единиц (b* слишком низкий)`)
			}
		}

		// Общие рекомендации по качеству
		const deltaE = calculateDistance(sample, result)
		if (deltaE > 5) {
			recommendations.push('Значительное отклонение от образца - требуется корректировка рецептуры')
		} else if (deltaE > 3) {
			recommendations.push('Умеренное отклонение - рекомендуется небольшая корректировка')
		} else if (deltaE > 1) {
			recommendations.push('Небольшое отклонение - допустимо для большинства применений')
		} else {
			recommendations.push('Отличное совпадение с образцом')
		}

		return recommendations
	}, [calculateDistance])

	// Обработка ввода координат образца
	const handleSampleInput = (field: keyof LabCoordinates, value: string) => {
		const numValue = parseFloat(value)
		if (isNaN(numValue)) return

		setComparison(prev => {
			const newSample = { 
				l: prev.sample?.l ?? 0,
				a: prev.sample?.a ?? 0,
				b: prev.sample?.b ?? 0,
				[field]: numValue 
			} as LabCoordinates
			const newDeltaE = prev.result ? calculateDistance(newSample, prev.result) : null
			const newRecommendations = prev.result ? analyzeDifferences(newSample, prev.result) : []
			const newPaintRecommendations = prev.result ? generatePaintRecommendations(newSample, prev.result) : []

			return {
				...prev,
				sample: newSample,
				deltaE: newDeltaE,
				recommendations: newRecommendations,
				paintRecommendations: newPaintRecommendations
			}
		})
	}

	// Обработка ввода координат результата
	const handleResultInput = (field: keyof LabCoordinates, value: string) => {
		const numValue = parseFloat(value)
		if (isNaN(numValue)) return

		setComparison(prev => {
			const newResult = { 
				l: prev.result?.l ?? 0,
				a: prev.result?.a ?? 0,
				b: prev.result?.b ?? 0,
				[field]: numValue 
			} as LabCoordinates
			const newDeltaE = prev.sample ? calculateDistance(prev.sample, newResult) : null
			const newRecommendations = prev.sample ? analyzeDifferences(prev.sample, newResult) : []
			const newPaintRecommendations = prev.sample ? generatePaintRecommendations(prev.sample, newResult) : []

			return {
				...prev,
				result: newResult,
				deltaE: newDeltaE,
				recommendations: newRecommendations,
				paintRecommendations: newPaintRecommendations
			}
		})
	}

	// Рендеринг карты
	const render = useCallback(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		// Очистка canvas
		ctx.fillStyle = isDark ? '#1f2937' : '#f9fafb'
		ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

		// Рисуем сетку
		drawGrid(ctx)

		// Рисуем оси координат
		drawAxes(ctx)

		// Рисуем точку образца
		if (comparison.sample) {
			const samplePos = labToCanvas(comparison.sample.a, comparison.sample.b)
			
			// Рисуем точку образца
			ctx.beginPath()
			ctx.arc(samplePos.x, samplePos.y, 8, 0, 2 * Math.PI)
			ctx.fillStyle = '#3b82f6'
			ctx.fill()
			ctx.strokeStyle = '#1e40af'
			ctx.lineWidth = 2
			ctx.stroke()

			// Подпись образца
			ctx.fillStyle = isDark ? '#ffffff' : '#000000'
			ctx.font = 'bold 12px system-ui'
			ctx.textAlign = 'center'
			ctx.fillText('ОБРАЗЕЦ', samplePos.x, samplePos.y - 15)
			ctx.font = '10px system-ui'
			ctx.fillText(
				`L*:${comparison.sample.l?.toFixed(1) || '0.0'} a*:${comparison.sample.a?.toFixed(1) || '0.0'} b*:${comparison.sample.b?.toFixed(1) || '0.0'}`,
				samplePos.x,
				samplePos.y + 20
			)
		}

		// Рисуем точку результата
		if (comparison.result) {
			const resultPos = labToCanvas(comparison.result.a, comparison.result.b)
			
			// Рисуем точку результата
			ctx.beginPath()
			ctx.arc(resultPos.x, resultPos.y, 8, 0, 2 * Math.PI)
			ctx.fillStyle = '#ef4444'
			ctx.fill()
			ctx.strokeStyle = '#dc2626'
			ctx.lineWidth = 2
			ctx.stroke()

			// Подпись результата
			ctx.fillStyle = isDark ? '#ffffff' : '#000000'
			ctx.font = 'bold 12px system-ui'
			ctx.textAlign = 'center'
			ctx.fillText('РЕЗУЛЬТАТ', resultPos.x, resultPos.y - 15)
			ctx.font = '10px system-ui'
			ctx.fillText(
				`L*:${comparison.result.l?.toFixed(1) || '0.0'} a*:${comparison.result.a?.toFixed(1) || '0.0'} b*:${comparison.result.b?.toFixed(1) || '0.0'}`,
				resultPos.x,
				resultPos.y + 20
			)

			// Рисуем линию между точками
			if (comparison.sample) {
				ctx.strokeStyle = '#f59e0b'
				ctx.lineWidth = 2
				ctx.setLineDash([5, 5])
				ctx.beginPath()
				ctx.moveTo(labToCanvas(comparison.sample.a, comparison.sample.b).x, labToCanvas(comparison.sample.a, comparison.sample.b).y)
				ctx.lineTo(resultPos.x, resultPos.y)
				ctx.stroke()
				ctx.setLineDash([])

				// Показываем ΔE
				const midX = (labToCanvas(comparison.sample.a, comparison.sample.b).x + resultPos.x) / 2
				const midY = (labToCanvas(comparison.sample.a, comparison.sample.b).y + resultPos.y) / 2
				ctx.fillStyle = '#f59e0b'
				ctx.font = 'bold 12px system-ui'
				ctx.fillText(`ΔE: ${comparison.deltaE ? comparison.deltaE.toFixed(2) : 'N/A'}`, midX, midY - 5)
			}
		}
	}, [comparison, isDark, canvasSize.width, canvasSize.height, labToCanvas])

	// Рисование сетки
	const drawGrid = useCallback(
		(ctx: CanvasRenderingContext2D) => {
			const step = 20
			ctx.strokeStyle = isDark ? '#374151' : '#e5e7eb'
			ctx.lineWidth = 1

			// Вертикальные линии
			for (let x = 0; x <= canvasSize.width; x += step) {
				ctx.beginPath()
				ctx.moveTo(x, 0)
				ctx.lineTo(x, canvasSize.height)
				ctx.stroke()
			}

			// Горизонтальные линии
			for (let y = 0; y <= canvasSize.height; y += step) {
				ctx.beginPath()
				ctx.moveTo(0, y)
				ctx.lineTo(canvasSize.width, y)
				ctx.stroke()
			}
		},
		[isDark, canvasSize.width, canvasSize.height]
	)

	// Рисование осей координат
	const drawAxes = useCallback(
		(ctx: CanvasRenderingContext2D) => {
			const centerX = canvasSize.width / 2
			const centerY = canvasSize.height / 2

			ctx.strokeStyle = isDark ? '#6b7280' : '#374151'
			ctx.lineWidth = 2

			// Горизонтальная ось (a*)
			ctx.beginPath()
			ctx.moveTo(0, centerY)
			ctx.lineTo(canvasSize.width, centerY)
			ctx.stroke()

			// Вертикальная ось (b*)
			ctx.beginPath()
			ctx.moveTo(centerX, 0)
			ctx.lineTo(centerX, canvasSize.height)
			ctx.stroke()

			// Подписи осей
			ctx.fillStyle = isDark ? '#ffffff' : '#000000'
			ctx.font = '14px system-ui'
			ctx.textAlign = 'center'

			// a* ось
			ctx.fillStyle = '#ef4444'
			ctx.fillText('-a* (зелёный)', 60, centerY - 10)
			ctx.fillText('+a* (красный)', canvasSize.width - 60, centerY - 10)

			// b* ось
			ctx.save()
			ctx.translate(centerX - 10, 60)
			ctx.rotate(-Math.PI / 2)
			ctx.fillStyle = '#eab308'
			ctx.fillText('+b* (жёлтый)', 0, 0)
			ctx.restore()

			ctx.save()
			ctx.translate(centerX - 10, canvasSize.height - 60)
			ctx.rotate(-Math.PI / 2)
			ctx.fillStyle = '#3b82f6'
			ctx.fillText('-b* (синий)', 0, 0)
			ctx.restore()
		},
		[isDark, canvasSize.width, canvasSize.height]
	)

	useEffect(() => {
		render()
	}, [render])

	return (
		<div className='space-y-4 md:space-y-6'>
			{/* Ввод координат образца */}
			<div className={`p-3 md:p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
				<h3 className={`text-base md:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
					Координаты образца (LAB)
				</h3>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
					<div>
						<label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							L* (светлота)
						</label>
						<Input
							type="number"
							placeholder="0-100"
							value={comparison.sample?.l || ''}
							onChange={(e) => handleSampleInput('l', e.target.value)}
							className="w-full"
						/>
					</div>
					<div>
						<label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							a* (красно-зеленый)
						</label>
						<Input
							type="number"
							placeholder="-128 до +127"
							value={comparison.sample?.a || ''}
							onChange={(e) => handleSampleInput('a', e.target.value)}
							className="w-full"
						/>
					</div>
					<div>
						<label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							b* (желто-синий)
						</label>
						<Input
							type="number"
							placeholder="-128 до +127"
							value={comparison.sample?.b || ''}
							onChange={(e) => handleSampleInput('b', e.target.value)}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{/* Ввод координат результата */}
			<div className={`p-3 md:p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
				<h3 className={`text-base md:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
					Координаты результата (LAB)
				</h3>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4'>
					<div>
						<label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							L* (светлота)
						</label>
						<Input
							type="number"
							placeholder="0-100"
							value={comparison.result?.l || ''}
							onChange={(e) => handleResultInput('l', e.target.value)}
							className="w-full"
						/>
					</div>
					<div>
						<label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							a* (красно-зеленый)
						</label>
						<Input
							type="number"
							placeholder="-128 до +127"
							value={comparison.result?.a || ''}
							onChange={(e) => handleResultInput('a', e.target.value)}
							className="w-full"
						/>
					</div>
					<div>
						<label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							b* (желто-синий)
						</label>
						<Input
							type="number"
							placeholder="-128 до +127"
							value={comparison.result?.b || ''}
							onChange={(e) => handleResultInput('b', e.target.value)}
							className="w-full"
						/>
					</div>
				</div>
			</div>

			{/* Настройки */}
			<div className='flex items-center gap-4'>
				<label className='flex items-center gap-2'>
					<input
						type='checkbox'
						checked={useXriteCalibration}
						onChange={e => setUseXriteCalibration(e.target.checked)}
						className='rounded'
					/>
					<span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
						X-Rite калибровка
					</span>
				</label>
			</div>

			{/* Карта цветов */}
			<div className='relative'>
				<canvas
					ref={canvasRef}
					width={canvasSize.width}
					height={canvasSize.height}
					className={`border rounded-lg w-full max-w-full ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
				/>

				{/* Статистика */}
				{comparison.deltaE !== null && comparison.deltaE !== undefined && comparison.deltaE > 0 && (
					<div className={`absolute top-2 right-2 p-2 md:p-3 rounded border ${
						isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
					} shadow-lg max-w-[200px] md:max-w-xs text-xs md:text-sm`}>
						<div className='font-semibold mb-1 md:mb-2'>Анализ различий</div>
						<div className='space-y-1'>
							<div className='font-medium'>ΔE: {comparison.deltaE?.toFixed(2) || 'N/A'}</div>
							{comparison.deltaE && comparison.deltaE > 5 && (
								<div className='text-red-500 font-medium'>Значительное отклонение</div>
							)}
							{comparison.deltaE && comparison.deltaE > 3 && comparison.deltaE <= 5 && (
								<div className='text-yellow-500 font-medium'>Умеренное отклонение</div>
							)}
							{comparison.deltaE && comparison.deltaE <= 3 && (
								<div className='text-green-500 font-medium'>Хорошее совпадение</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Рекомендации по краскам */}
			{comparison.paintRecommendations.length > 0 && (
				<div className={`p-3 md:p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
					<h3 className={`text-base md:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
						Рекомендации по краскам
					</h3>
					<div className='grid grid-cols-1 gap-3 md:gap-4'>
						{comparison.paintRecommendations.map((rec, index) => (
							<div key={index} className={`p-3 rounded border ${
								isDark ? 'bg-gray-700 border-gray-500' : 'bg-gray-50 border-gray-200'
							}`}>
								<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2'>
									<span className={`font-semibold text-base md:text-lg ${
										rec.paint === 'Magenta' ? 'text-pink-600' :
										rec.paint === 'Cyan' ? 'text-cyan-600' :
										rec.paint === 'Yellow' ? 'text-yellow-600' :
										rec.paint === 'Kontur' ? 'text-gray-800' :
										'text-blue-600'
									}`}>
										{rec.paint}
									</span>
									<span className={`px-2 py-1 rounded text-xs font-medium self-start sm:self-auto ${
										rec.action === 'add' 
											? 'bg-green-100 text-green-800' 
											: 'bg-red-100 text-red-800'
									}`}>
										{rec.action === 'add' ? 'Добавить' : 'Уменьшить'}
									</span>
								</div>
								<div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
									<div className='font-medium mb-1'>{rec.amount}</div>
									<div>{rec.reason}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Общие рекомендации */}
			{comparison.recommendations.length > 0 && (
				<div className={`p-3 md:p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
					<h3 className={`text-base md:text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
						Общие рекомендации
					</h3>
					<ul className='space-y-2'>
						{comparison.recommendations.map((recommendation, index) => (
							<li key={index} className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
								• {recommendation}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Инструкция */}
			<div className={`text-xs md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
				Введите координаты LAB образца и полученного результата для анализа различий и получения рекомендаций по корректировке
			</div>
		</div>
	)
}

export default ColorMap2D
