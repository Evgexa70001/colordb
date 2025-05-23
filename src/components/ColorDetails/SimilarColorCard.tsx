import { useTheme } from '@contexts/ThemeContext'
import { normalizeHexColor } from '@utils/colorUtils'
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
		}
	}
}

export default function SimilarColorCard({ color }: SimilarColorCardProps) {
	const { isDark } = useTheme()

	const getColorDifferenceText = (deltaE: number) => {
		if (deltaE < 1) return 'Не различимо человеческим глазом'
		if (deltaE < 2) return 'Едва заметное различие'
		if (deltaE < 3) return 'Заметное различие при близком рассмотрении'
		if (deltaE < 5) return 'Заметное различие'
		return 'Явное различие'
	}

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
			</div>
			<div
				className={`text-xs mt-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
			>
				<p className='font-medium'>
					Delta E: {color.distance?.deltaE2000.toFixed(2)} /{' '}
					{color.distance?.deltaE76.toFixed(2)}
					<span className='text-xs opacity-75 ml-1'>(CIEDE2000 / CIE76)</span>
				</p>
				<p className='mt-2 leading-relaxed'>
					{getColorDifferenceText(color.distance?.deltaE2000 || 0)}
				</p>
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
					Совпадение с дополнительным цветом: {color.matchedWith.name}
				</p>
			)}
		</div>
	)
}
