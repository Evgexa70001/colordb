import { useTheme } from '@contexts/ThemeContext'
import { 
	normalizeHexColor, 
	findPantoneByHex, 
	findClosestPantoneByLab, 
	hexToLab,
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS
} from '@utils/colorUtils'
import type { PantoneColor } from '@/types'

interface SimilarColorCardProps {
	color: PantoneColor & {
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
			anilox?: string
		}
	}
	originalColor?: PantoneColor // Добавляем оригинальный цвет для расчета калиброванного дельта E
}

export default function SimilarColorCard({ color, originalColor }: SimilarColorCardProps) {
	const { isDark } = useTheme()

	const getColorDifferenceText = (deltaE: number) => {
		if (deltaE < 1) return 'Не различимо человеческим глазом'
		if (deltaE < 2) return 'Едва заметное различие'
		if (deltaE < 3) return 'Заметное различие при близком рассмотрении'
		if (deltaE < 5) return 'Заметное различие'
		return 'Явное различие'
	}

	// Pantone logic (по базовому цвету)
	const pantoneMatch = findPantoneByHex(color.hex)
	const baseLab = color.labValues || hexToLab(color.hex)
	const closestPantone = pantoneMatch ? null : findClosestPantoneByLab(baseLab)

	// Если совпадение с доп. цветом, сравниваем именно с ним
	const comparisonLab = color.matchedWith?.isAdditional
		? hexToLab(color.matchedWith.hex)
		: baseLab

	// Расчет калиброванного дельта E для X-Rite (относительно comparisonLab)
	const calibratedDeltaE = originalColor?.labValues ? 
		calculateDeltaEWithCalibration(
			originalColor.labValues,
			comparisonLab,
			SPECTROPHOTOMETER_CALIBRATIONS.xrite
		) : null

	// Используем калиброванный дельта E если доступен, иначе стандартный (distance уже учитывает доп. цвет при поиске)
	const displayDeltaE = calibratedDeltaE !== null ? calibratedDeltaE : (color.distance?.deltaE2000 || 0)

	return (
		<div
			className={`p-4 rounded-xl transition-all duration-200 ${
				isDark
					? 'bg-gray-700/50 hover:bg-gray-700/70'
					: 'bg-gray-50 hover:bg-gray-100/70'
			}`}
		>
			<div className='space-y-3'>
				<p
					className={`text-sm font-semibold truncate ${
						isDark ? 'text-gray-100' : 'text-gray-700'
					}`}
				>
					{color.name} {color.alternativeName && `(${color.alternativeName})`}
				</p>
				<div
					className='aspect-square w-full rounded-xl shadow-sm transition-transform hover:scale-105'
					style={{ backgroundColor: normalizeHexColor(color.hex) }}
				/>
				<p
					className={`text-xs font-mono ${
						isDark ? 'text-gray-300' : 'text-gray-500'
					}`}
				>
					{normalizeHexColor(color.hex)}
				</p>
				{/* Pantone info */}
				{pantoneMatch ? (
					<div className="mb-1 text-xs text-blue-700 font-semibold">
						Pantone: {pantoneMatch.pantone} <span className="text-gray-500">({pantoneMatch.hex})</span>
					</div>
				) : closestPantone ? (
					<div className="mb-1 text-xs text-yellow-700 font-semibold">
						Ближайший Pantone: {closestPantone.pantone} <span className="text-gray-500">({closestPantone.hex})</span> ΔE={closestPantone.deltaE.toFixed(2)}
					</div>
				) : null}
			</div>
			<div
				className={`text-xs mt-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
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
			{color.matchingColor?.isAdditional && (
				<p
					className={`mt-2 text-xs ${
						isDark ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					({color.matchingColor.name})
				</p>
			)}
			{color.matchedWith?.isAdditional && (
				<p
					className={`mt-2 text-xs ${
						isDark ? 'text-gray-300' : 'text-gray-600'
					}`}
				>
					Совпадение с доп. цветом: {color.matchedWith.name}
					{color.matchedWith.anilox ? ` · анилокс ${color.matchedWith.anilox}` : ''}
				</p>
			)}
		</div>
	)
}
