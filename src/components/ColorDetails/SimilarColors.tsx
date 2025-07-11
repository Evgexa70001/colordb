import { useState } from 'react'
import { useTheme } from '@contexts/ThemeContext'
import { 
	normalizeHexColor,
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS,
} from '@utils/colorUtils'

import { RecipeComparison, ColorComparison } from '../ColorDetails'
import type { PantoneColor } from '@/types'

interface SimilarColorsProps {
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
	originalColor: PantoneColor
}

export default function SimilarColors({
	similarColors,
	originalColor,
}: SimilarColorsProps) {
	const { isDark } = useTheme()
	const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null)

	if (similarColors.length === 0) return null

	const getColorDifferenceText = (deltaE: number) => {
		if (deltaE < 1) return 'Не различимо человеческим глазом'
		if (deltaE < 2) return 'Едва заметное различие'
		if (deltaE < 3) return 'Заметное различие при близком рассмотрении'
		if (deltaE < 5) return 'Заметное различие'
		return 'Явное различие'
	}

	return (
		<div className='space-y-8'>
			<div
				className={`p-6 rounded-xl ${
					isDark ? 'bg-gray-800/50' : 'bg-gray-50/80'
				} backdrop-blur-sm`}
			>
				<h3
					className={`text-xl font-bold mb-6 ${
						isDark ? 'text-gray-100' : 'text-gray-800'
					}`}
				>
					Похожие цвета
				</h3>
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5'>
					{similarColors.map(similarColor => {
						// Расчет калиброванного дельта E для X-Rite
						const calibratedDeltaE = originalColor.labValues && similarColor.labValues ? 
							calculateDeltaEWithCalibration(
								originalColor.labValues,
								similarColor.labValues,
								SPECTROPHOTOMETER_CALIBRATIONS.xrite
							) : null

						// Используем калиброванный дельта E если доступен, иначе стандартный
						const displayDeltaE = calibratedDeltaE !== null ? calibratedDeltaE : (similarColor.distance?.deltaE2000 || 0)

						return (
							<div
								key={similarColor.id}
								className={`p-4 rounded-xl ${
									isDark ? 'bg-gray-700/70' : 'bg-white'
								} hover:shadow-lg shadow-sm space-y-4 cursor-pointer transition-all duration-200 
								hover:transform hover:-translate-y-1 ${
									selectedColor?.id === similarColor.id
										? isDark
											? 'ring-2 ring-blue-400 shadow-blue-400/20'
											: 'ring-2 ring-blue-500 shadow-blue-500/20'
										: ''
								}`}
								onClick={() =>
									setSelectedColor(
										selectedColor?.id === similarColor.id ? null : similarColor
									)
								}
							>
								<div className='space-y-3'>
									<p
										className={`text-sm font-semibold truncate ${
											isDark ? 'text-gray-100' : 'text-gray-700'
										}`}
									>
										{similarColor.name}
									</p>
									<div
										className='aspect-square w-full rounded-xl shadow-sm transition-transform hover:scale-105'
										style={{
											backgroundColor: normalizeHexColor(similarColor.hex),
										}}
									/>
									<p
										className={`text-xs font-mono ${
											isDark ? 'text-gray-300' : 'text-gray-500'
										}`}
									>
										{normalizeHexColor(similarColor.hex)}
									</p>
								</div>
								<div
									className={`text-xs ${
										isDark ? 'text-gray-300' : 'text-gray-600'
									}`}
								>
									<p className='font-medium'>
										Delta E: {displayDeltaE.toFixed(2)}
										{calibratedDeltaE !== null && (
											<span className='text-xs opacity-75 ml-1'>(X-Rite калиброванный)</span>
										)}
										{calibratedDeltaE === null && (
											<span className='text-xs opacity-75 ml-1'>(CIEDE2000)</span>
										)}
									</p>
									<p className='mt-2 leading-relaxed'>
										{getColorDifferenceText(displayDeltaE)}
									</p>
									{calibratedDeltaE !== null && (
										<p className={`mt-1 text-xs ${
											isDark ? 'text-gray-400' : 'text-gray-500'
										}`}>
											Точность: {calibratedDeltaE <= 1 ? 'Отличная' : 
												calibratedDeltaE <= 2 ? 'Хорошая' : 
												calibratedDeltaE <= 3 ? 'Приемлемая' : 'Низкая'}
										</p>
									)}
								</div>
							</div>
						)
					})}
				</div>
			</div>

			{selectedColor && (
				<>
					<ColorComparison
						color1={originalColor.hex}
						color2={selectedColor.hex}
						name1={originalColor.name}
						name2={selectedColor.name}
					/>
					{originalColor.recipe && selectedColor.recipe && (
						<RecipeComparison
							recipe1={originalColor.recipe}
							recipe2={selectedColor.recipe}
							name1={originalColor.name}
							name2={selectedColor.name}
						/>
					)}
				</>
			)}
		</div>
	)
}