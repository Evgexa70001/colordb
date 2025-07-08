import { useState, useEffect } from 'react'
import { X, Palette, Beaker, Info, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import type { PantoneColor } from '@/types'
import { 
	hexToLab, 
	calculateDeltaE2000, 
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS,
	findClosestPantoneByLab
} from '@/utils/colorUtils'

interface ColorComparisonModalProps {
	isOpen: boolean
	onClose: () => void
	selectedColors: PantoneColor[]
}

interface ComparisonResult {
	mainColors: {
		deltaE: number
		labDifference: { l: number; a: number; b: number }
		labDistance: number
		pantoneMatch1: any
		pantoneMatch2: any
	}
	allColorsComparison: Array<{
		color1: { name: string; hex: string; lab: { l: number; a: number; b: number }; anilox?: string; isMain: boolean }
		color2: { name: string; hex: string; lab: { l: number; a: number; b: number }; anilox?: string; isMain: boolean }
		deltaE: number
		labDifference: { l: number; a: number; b: number }
		labDistance: number
	}>
	recipeComparison: {
		hasRecipe1: boolean
		hasRecipe2: boolean
		similarity: number
		commonIngredients: string[]
		differentIngredients: Array<{
			ingredient: string
			color1Amount?: number
			color2Amount?: number
		}>
	}
}

export default function ColorComparisonModal({
	isOpen,
	onClose,
	selectedColors,
}: ColorComparisonModalProps) {
	const { isDark } = useTheme()
	const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null)
	// Всегда используем калибровку X-Rite для точных результатов
	const useXRiteCalibration = true

	useEffect(() => {
		if (isOpen && selectedColors.length === 2) {
			calculateComparison()
		}
	}, [isOpen, selectedColors])

	const calculateComparison = () => {
		const [color1, color2] = selectedColors

		// Функция для извлечения анилокса из рецепта
		const getAniloxFromRecipe = (recipe?: string) => {
			if (!recipe) return undefined
			const lines = recipe.split('\n')
			for (const line of lines) {
				const aniloxMatch = line.match(/^Анилокс: (.+)/)
				if (aniloxMatch) {
					return aniloxMatch[1]
				}
			}
			return undefined
		}

		// Сравнение основных цветов - используем LAB координаты
		const lab1 = color1.labValues || hexToLab(color1.hex)
		const lab2 = color2.labValues || hexToLab(color2.hex)
		
		// Используем калибровку X-Rite для точных результатов
		const deltaE = useXRiteCalibration 
			? calculateDeltaEWithCalibration(lab1, lab2, SPECTROPHOTOMETER_CALIBRATIONS.xrite)
			: calculateDeltaE2000(lab1, lab2)

		const labDifference = {
			l: lab2.l - lab1.l,
			a: lab2.a - lab1.a,
			b: lab2.b - lab1.b,
		}

		// Расчет евклидова расстояния в LAB пространстве
		const labDistance = Math.sqrt(
			Math.pow(labDifference.l, 2) + 
			Math.pow(labDifference.a, 2) + 
			Math.pow(labDifference.b, 2)
		)

		// Pantone совпадения по LAB координатам
		const pantoneMatch1 = findClosestPantoneByLab(lab1)
		const pantoneMatch2 = findClosestPantoneByLab(lab2)

		// Создаем полную матрицу сравнений всех цветов
		const allColorsComparison: Array<{
			color1: { name: string; hex: string; lab: { l: number; a: number; b: number }; anilox?: string; isMain: boolean }
			color2: { name: string; hex: string; lab: { l: number; a: number; b: number }; anilox?: string; isMain: boolean }
			deltaE: number
			labDifference: { l: number; a: number; b: number }
			labDistance: number
		}> = []

		// Собираем все цвета из обоих выбранных цветов с их LAB координатами
		const allColors1 = [
			{ 
				name: color1.name, 
				hex: color1.hex, 
				lab: color1.labValues || hexToLab(color1.hex),
				anilox: getAniloxFromRecipe(color1.recipe),
				isMain: true 
			},
			...(color1.additionalColors || []).map(c => ({ 
				name: c.name, 
				hex: c.hex, 
				lab: c.labValues || hexToLab(c.hex),
				anilox: c.anilox, 
				isMain: false 
			}))
		]

		const allColors2 = [
			{ 
				name: color2.name, 
				hex: color2.hex, 
				lab: color2.labValues || hexToLab(color2.hex),
				anilox: getAniloxFromRecipe(color2.recipe),
				isMain: true 
			},
			...(color2.additionalColors || []).map(c => ({ 
				name: c.name, 
				hex: c.hex, 
				lab: c.labValues || hexToLab(c.hex),
				anilox: c.anilox, 
				isMain: false 
			}))
		]

		// Сравниваем каждый цвет с каждым используя LAB координаты
		allColors1.forEach(color1 => {
			allColors2.forEach(color2 => {
				const deltaE = useXRiteCalibration 
					? calculateDeltaEWithCalibration(color1.lab, color2.lab, SPECTROPHOTOMETER_CALIBRATIONS.xrite)
					: calculateDeltaE2000(color1.lab, color2.lab)

				const labDifference = {
					l: color2.lab.l - color1.lab.l,
					a: color2.lab.a - color1.lab.a,
					b: color2.lab.b - color1.lab.b,
				}

				const labDistance = Math.sqrt(
					Math.pow(labDifference.l, 2) + 
					Math.pow(labDifference.a, 2) + 
					Math.pow(labDifference.b, 2)
				)

				allColorsComparison.push({
					color1,
					color2,
					deltaE,
					labDifference,
					labDistance,
				})
			})
		})

		// Сравнение рецептов
		const recipeComparison = compareRecipes(color1.recipe, color2.recipe)

		setComparisonResult({
			mainColors: {
				deltaE,
				labDifference,
				labDistance,
				pantoneMatch1,
				pantoneMatch2,
			},
			allColorsComparison,
			recipeComparison,
		})
	}

	const compareRecipes = (recipe1?: string, recipe2?: string) => {
		if (!recipe1 || !recipe2) {
			return {
				hasRecipe1: !!recipe1,
				hasRecipe2: !!recipe2,
				similarity: 0,
				commonIngredients: [],
				differentIngredients: [],
			}
		}

		// Парсинг рецептов
		const parseRecipe = (recipeString: string) => {
			const lines = recipeString.split('\n')
			const ingredients: Array<{ paint: string; amount: number }> = []

			lines.forEach(line => {
				const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)
				if (paintMatch) {
					ingredients.push({
						paint: paintMatch[1],
						amount: parseInt(paintMatch[2]),
					})
				}
			})

			return ingredients
		}

		const ingredients1 = parseRecipe(recipe1)
		const ingredients2 = parseRecipe(recipe2)

		const paints1 = new Set(ingredients1.map(i => i.paint))
		const paints2 = new Set(ingredients2.map(i => i.paint))

		const commonIngredients = Array.from(paints1).filter(paint => paints2.has(paint))
		const allIngredients = new Set([...paints1, ...paints2])
		const similarity = commonIngredients.length / allIngredients.size

		const differentIngredients: Array<{
			ingredient: string
			color1Amount?: number
			color2Amount?: number
		}> = []

		allIngredients.forEach(ingredient => {
			const amount1 = ingredients1.find(i => i.paint === ingredient)?.amount
			const amount2 = ingredients2.find(i => i.paint === ingredient)?.amount

			if (amount1 !== amount2) {
				differentIngredients.push({
					ingredient,
					color1Amount: amount1,
					color2Amount: amount2,
				})
			}
		})

		return {
			hasRecipe1: true,
			hasRecipe2: true,
			similarity,
			commonIngredients,
			differentIngredients,
		}
	}

	const getDeltaEColor = (deltaE: number) => {
		if (deltaE <= 1) return 'text-green-500'
		if (deltaE <= 2.3) return 'text-yellow-500'
		if (deltaE <= 10) return 'text-orange-500'
		return 'text-red-500'
	}

	const getDeltaEIcon = (deltaE: number) => {
		if (deltaE <= 1) return <CheckCircle className="w-4 h-4 text-green-500" />
		if (deltaE <= 2.3) return <AlertCircle className="w-4 h-4 text-yellow-500" />
		return <AlertCircle className="w-4 h-4 text-red-500" />
	}

	const formatLabValues = (lab: { l: number; a: number; b: number }) => {
		return `L: ${lab.l.toFixed(1)}, a: ${lab.a.toFixed(1)}, b: ${lab.b.toFixed(1)}`
	}

	if (!isOpen || selectedColors.length !== 2) return null

	const [color1, color2] = selectedColors

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
			<div className={`relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
				isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
			}`}>
				{/* Header */}
				<div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
					isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
				}`}>
					<div className="flex items-center gap-3">
						<div className={`p-2 rounded-lg ${
							isDark ? 'bg-blue-800/40' : 'bg-blue-200/60'
						}`}>
							<Palette className={`w-5 h-5 ${
								isDark ? 'text-blue-300' : 'text-blue-700'
							}`} />
						</div>
						<div>
							<h2 className="text-xl font-bold">Сравнение цветов (LAB)</h2>
							<p className={`text-sm opacity-75 ${
								isDark ? 'text-gray-400' : 'text-gray-600'
							}`}>
								{color1.name} vs {color2.name}
							</p>
							<p className={`text-xs opacity-75 ${
								isDark ? 'text-orange-400' : 'text-orange-600'
							}`}>
								С калибровкой X-Rite • LAB координаты
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className={`p-2 rounded-lg transition-colors ${
							isDark 
								? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' 
								: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
						}`}
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{comparisonResult && (
						<>
							{/* Main Colors Comparison */}
							<div className={`rounded-xl p-6 ${
								isDark 
									? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/30' 
									: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50'
							}`}>
								<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
									<Palette className="w-5 h-5" />
									Сравнение основных цветов (LAB)
								</h3>
								
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									{/* Color 1 */}
									<div className="text-center">
										<div 
											className="w-24 h-24 rounded-xl mx-auto mb-3 border-2 border-white shadow-lg"
											style={{ backgroundColor: color1.hex }}
										/>
										<h4 className="font-semibold">{color1.name}</h4>
										<p className="text-sm opacity-75">
											{color1.alternativeName || color1.hex}
										</p>
										<p className="text-xs font-mono mt-1">
											{formatLabValues(color1.labValues || hexToLab(color1.hex))}
										</p>
										{comparisonResult.mainColors.pantoneMatch1 && (
											<p className="text-xs text-blue-500 mt-1">
												Pantone: {comparisonResult.mainColors.pantoneMatch1.pantone}
											</p>
										)}
									</div>

									{/* Comparison Info */}
									<div className="flex flex-col items-center justify-center space-y-3">
										<div className="flex items-center gap-2">
											{getDeltaEIcon(comparisonResult.mainColors.deltaE)}
											<span className={`font-bold ${getDeltaEColor(comparisonResult.mainColors.deltaE)}`}>
												ΔE = {comparisonResult.mainColors.deltaE.toFixed(2)}
											</span>
										</div>
										<div className={`text-xs px-2 py-1 rounded ${
											isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
										}`}>
											Калибровка X-Rite
										</div>
										<ArrowRight className="w-6 h-6 opacity-50" />
										<div className="text-center">
											<p className="text-sm opacity-75">Разность LAB:</p>
											<p className="text-xs font-mono">
												L: {comparisonResult.mainColors.labDifference.l.toFixed(1)}<br/>
												a: {comparisonResult.mainColors.labDifference.a.toFixed(1)}<br/>
												b: {comparisonResult.mainColors.labDifference.b.toFixed(1)}
											</p>
											<p className="text-xs mt-1">
												Расстояние: {comparisonResult.mainColors.labDistance.toFixed(1)}
											</p>
										</div>
									</div>

									{/* Color 2 */}
									<div className="text-center">
										<div 
											className="w-24 h-24 rounded-xl mx-auto mb-3 border-2 border-white shadow-lg"
											style={{ backgroundColor: color2.hex }}
										/>
										<h4 className="font-semibold">{color2.name}</h4>
										<p className="text-sm opacity-75">
											{color2.alternativeName || color2.hex}
										</p>
										<p className="text-xs font-mono mt-1">
											{formatLabValues(color2.labValues || hexToLab(color2.hex))}
										</p>
										{comparisonResult.mainColors.pantoneMatch2 && (
											<p className="text-xs text-blue-500 mt-1">
												Pantone: {comparisonResult.mainColors.pantoneMatch2.pantone}
											</p>
										)}
									</div>
								</div>
							</div>

							{/* All Colors Matrix Comparison */}
							{comparisonResult.allColorsComparison.length > 0 && (
								<div className={`rounded-xl p-6 ${
									isDark 
										? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-700/30' 
										: 'bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50'
								}`}>
									<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
										<Beaker className="w-5 h-5" />
										Матрица сравнений всех цветов (LAB)
									</h3>
									
									<div className="space-y-4">
										{comparisonResult.allColorsComparison.map((comparison, index) => (
											<div key={index} className={`p-4 rounded-lg ${
												isDark ? 'bg-purple-900/20' : 'bg-white/50'
											}`}>
												<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
													<div className="text-center">
														<div 
															className="w-16 h-16 rounded-lg mx-auto mb-2 border border-white shadow-sm"
															style={{ backgroundColor: comparison.color1.hex }}
														/>
														<p className="text-sm font-medium">{comparison.color1.name}</p>
														<p className="text-xs opacity-75">
															Анилокс: {comparison.color1.anilox || 'Нет данных'}
														</p>
														<p className="text-xs font-mono mt-1">
															{formatLabValues(comparison.color1.lab)}
														</p>
													</div>

													<div className="flex flex-col items-center justify-center space-y-2">
														<div className="flex items-center gap-2">
															{getDeltaEIcon(comparison.deltaE)}
															<span className={`font-bold ${getDeltaEColor(comparison.deltaE)}`}>
																ΔE = {comparison.deltaE.toFixed(2)}
															</span>
														</div>
														<p className="text-xs">
															Расстояние: {comparison.labDistance.toFixed(1)}
														</p>
														<ArrowRight className="w-4 h-4 opacity-50" />
													</div>

													<div className="text-center">
														<div 
															className="w-16 h-16 rounded-lg mx-auto mb-2 border border-white shadow-sm"
															style={{ backgroundColor: comparison.color2.hex }}
														/>
														<p className="text-sm font-medium">{comparison.color2.name}</p>
														<p className="text-xs opacity-75">
															Анилокс: {comparison.color2.anilox || 'Нет данных'}
														</p>
														<p className="text-xs font-mono mt-1">
															{formatLabValues(comparison.color2.lab)}
														</p>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							{/* Recipe Comparison */}
							{comparisonResult.recipeComparison.hasRecipe1 || comparisonResult.recipeComparison.hasRecipe2 ? (
								<div className={`rounded-xl p-6 ${
									isDark 
										? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/30' 
										: 'bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50'
								}`}>
									<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
										<Beaker className="w-5 h-5" />
										Сравнение рецептов
									</h3>
									
									<div className="space-y-4">
										{/* Recipe Availability */}
										<div className="flex items-center justify-center gap-4">
											<div className={`px-4 py-2 rounded-lg ${
												comparisonResult.recipeComparison.hasRecipe1
													? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
													: isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'
											}`}>
												{color1.name}: {comparisonResult.recipeComparison.hasRecipe1 ? 'Есть рецепт' : 'Нет рецепта'}
											</div>
											<ArrowRight className="w-5 h-5 opacity-50" />
											<div className={`px-4 py-2 rounded-lg ${
												comparisonResult.recipeComparison.hasRecipe2
													? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
													: isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500'
											}`}>
												{color2.name}: {comparisonResult.recipeComparison.hasRecipe2 ? 'Есть рецепт' : 'Нет рецепта'}
											</div>
										</div>

										{/* Similarity Score */}
										{comparisonResult.recipeComparison.hasRecipe1 && comparisonResult.recipeComparison.hasRecipe2 && (
											<div className="text-center">
												<p className="text-sm opacity-75 mb-2">Схожесть рецептов:</p>
												<div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
													comparisonResult.recipeComparison.similarity >= 0.7
														? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
														: comparisonResult.recipeComparison.similarity >= 0.3
														? isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
														: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
												}`}>
													<span className="font-bold">
														{(comparisonResult.recipeComparison.similarity * 100).toFixed(1)}%
													</span>
												</div>
											</div>
										)}

										{/* Common Ingredients */}
										{comparisonResult.recipeComparison.commonIngredients.length > 0 && (
											<div>
												<p className="text-sm font-medium mb-2">Общие ингредиенты:</p>
												<div className="flex flex-wrap gap-2">
													{comparisonResult.recipeComparison.commonIngredients.map((ingredient, index) => (
														<span key={index} className={`px-3 py-1 rounded-full text-xs ${
															isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
														}`}>
															{ingredient}
														</span>
													))}
												</div>
											</div>
										)}

										{/* Different Ingredients */}
										{comparisonResult.recipeComparison.differentIngredients.length > 0 && (
											<div>
												<p className="text-sm font-medium mb-2">Различия в рецептах:</p>
												<div className="space-y-2">
													{comparisonResult.recipeComparison.differentIngredients.map((diff, index) => (
														<div key={index} className={`p-3 rounded-lg ${
															isDark ? 'bg-red-900/20' : 'bg-red-50'
														}`}>
															<p className="font-medium text-sm">{diff.ingredient}</p>
															<div className="flex items-center gap-4 text-xs opacity-75">
																<span>{color1.name}: {diff.color1Amount || 0}г</span>
																<ArrowRight className="w-3 h-3" />
																<span>{color2.name}: {diff.color2Amount || 0}г</span>
															</div>
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								</div>
							) : (
								<div className={`rounded-xl p-6 ${
									isDark 
										? 'bg-gradient-to-br from-gray-800/20 to-gray-700/10 border border-gray-600/30' 
										: 'bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50'
								}`}>
									<div className="text-center">
										<Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
										<p className="text-sm opacity-75">У выбранных цветов нет рецептов для сравнения</p>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	)
} 