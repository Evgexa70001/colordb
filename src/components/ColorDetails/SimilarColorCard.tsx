import { useTheme } from '@contexts/ThemeContext'
import type { PantoneColor } from '@/types'

interface SimilarColorCardProps {
	color: PantoneColor & {
		distance?: number
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
	distance?: number
}

export default function SimilarColorCard({
	color,
}: SimilarColorCardProps) {
	const { isDark } = useTheme()

	return (
		<div
			className={`p-4 rounded-xl transition-all duration-200 ${
				isDark
					? 'bg-blue-900/20 border-blue-800/30'
					: 'bg-blue-50/80 border-blue-200'
			} border`}
		>
			<div className='flex items-center gap-3'>
				<div
					className='w-12 h-12 rounded-lg border shadow-sm'
					style={{ backgroundColor: color.matchingColor?.hex || color.hex }}
				/>
				<div>
					<h3
						className={`font-medium ${
							isDark ? 'text-blue-200' : 'text-blue-900'
						}`}
					>
						{color.name}
						{color.matchingColor?.isAdditional && (
							<span className={`ml-2 text-sm ${
								isDark ? 'text-blue-400' : 'text-blue-600'
							}`}>
								({color.matchingColor.name})
							</span>
						)}
					</h3>
					<p
						className={`text-sm font-mono ${
							isDark ? 'text-blue-300' : 'text-blue-700'
						}`}
					>
						{color.matchingColor?.hex || color.hex}
					</p>
					{color.distance !== undefined && (
						<p
							className={`text-xs mt-1 ${
								isDark ? 'text-blue-400' : 'text-blue-600'
							}`}
						>
							Разница: {color.distance.toFixed(1)}
						</p>
					)}
				</div>
			</div>
			{color.alternativeName && (
				<p
					className={`mt-2 text-sm ${
						isDark ? 'text-blue-300' : 'text-blue-700'
					}`}
				>
					{color.alternativeName}
				</p>
			)}
			{color.matchedWith?.isAdditional && (
				<p className={`mt-2 text-xs ${
					isDark ? 'text-blue-400' : 'text-blue-600'
				}`}>
					Совпадение с дополнительным цветом: {color.matchedWith.name}
				</p>
			)}
		</div>
	)
}
