import { GitCompare } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'

interface ComparisonModeIndicatorProps {
	isComparisonMode: boolean
	selectedColorsForComparison: Array<{ name: string }>
	onCancelComparison: () => void
}

export const ComparisonModeIndicator = ({
	isComparisonMode,
	selectedColorsForComparison,
	onCancelComparison,
}: ComparisonModeIndicatorProps) => {
	const { isDark } = useTheme()

	if (!isComparisonMode) return null

	return (
		<div className={`mb-6 p-4 rounded-xl border-2 ${
			isDark 
				? 'bg-purple-900/20 border-purple-500/50 text-purple-200' 
				: 'bg-purple-50 border-purple-200 text-purple-800'
		}`}>
			<div className="flex items-center gap-3">
				<GitCompare className="w-5 h-5" />
				<div className="flex-1">
					<p className="font-semibold">Режим сравнения цветов</p>
					<p className="text-sm opacity-75">
						{selectedColorsForComparison.length === 0 
							? 'Выберите первый цвет для сравнения'
							: selectedColorsForComparison.length === 1
							? `Выбран: ${selectedColorsForComparison[0].name}. Выберите второй цвет`
							: 'Выбрано два цвета'
						}
					</p>
				</div>
				<button
					onClick={onCancelComparison}
					className={`px-3 py-1 rounded-lg text-sm transition-colors ${
						isDark 
							? 'bg-purple-800/50 hover:bg-purple-800 text-purple-200' 
							: 'bg-purple-100 hover:bg-purple-200 text-purple-700'
					}`}
				>
					Отменить
				</button>
			</div>
		</div>
	)
}
