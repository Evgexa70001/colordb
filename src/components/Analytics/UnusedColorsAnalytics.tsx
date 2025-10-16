import { useState, useEffect } from 'react'
import {
	Calendar,
	AlertTriangle,
	ChevronDown,
	ChevronUp,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { Button } from '@components/ui/Button'
import { getAllUnusedColors } from '@lib/analytics'

interface UnusedColorData {
	colorId: string
	colorName: string
	hex: string
	lastUsed: Date | null
	createdAt: Date
	daysUnused: number
	recipe?: string
}

interface UnusedColorsAnalyticsProps {
	selectedMonth?: Date
}

export default function UnusedColorsAnalytics({}: UnusedColorsAnalyticsProps) {
	const { isDark } = useTheme()
	const [unusedColors, setUnusedColors] = useState<UnusedColorData[]>([])
	const [totalUnused, setTotalUnused] = useState(0)
	const [loading, setLoading] = useState(true)
	const [expanded, setExpanded] = useState(false)

	useEffect(() => {
		loadUnusedColorsData()
	}, [])

	const loadUnusedColorsData = async () => {
		setLoading(true)
		try {
			const data = await getAllUnusedColors()
			setUnusedColors(data.unusedColors)
			setTotalUnused(data.totalUnused)
		} catch (error) {
			console.error('Error loading unused colors data:', error)
		} finally {
			setLoading(false)
		}
	}

	const getDaysUnusedText = (days: number) => {
		if (days >= 365) {
			return `${Math.floor(days / 365)} лет`
		} else if (days >= 30) {
			return `${Math.floor(days / 30)} месяцев`
		} else {
			return `${days} дней`
		}
	}

	const getUnusedLevel = (days: number) => {
		if (days >= 365) return 'critical'
		if (days >= 180) return 'high'
		if (days >= 90) return 'medium'
		return 'low'
	}

	const getUnusedLevelColor = (level: string) => {
		switch (level) {
			case 'critical':
				return isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
			case 'high':
				return isDark ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700'
			case 'medium':
				return isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
			default:
				return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
		}
	}

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
					<p className='mt-4 text-gray-600'>
						Загрузка аналитики неиспользуемых цветов...
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
				<div>
					<h2
						className={`text-lg sm:text-xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						Аналитика неиспользуемых цветов
					</h2>
					<p
						className={`text-xs sm:text-sm ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						Цвета, которые не использовались длительное время
					</p>
				</div>

				<Button
					variant='secondary'
					leftIcon={<Calendar className='w-4 h-4' />}
					onClick={loadUnusedColorsData}
					disabled={loading}
					className='w-full sm:w-auto'
				>
					{loading ? 'Обновление...' : 'Обновить'}
				</Button>
			</div>

			{/* Summary Card */}
			<div
				className={`p-4 sm:p-6 rounded-xl shadow-sm border ${
					isDark
						? 'bg-gray-800 border-gray-700'
						: 'bg-white border-gray-200'
				}`}
			>
				<div className='flex items-center justify-between mb-4'>
					<div>
						<h3
							className={`text-base sm:text-lg font-semibold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							Общая статистика
						</h3>
						<p
							className={`text-xs sm:text-sm ${
								isDark ? 'text-gray-400' : 'text-gray-600'
							}`}
						>
							Всего неиспользуемых цветов: {totalUnused}
						</p>
					</div>
					<div className='text-right'>
						<div
							className={`text-2xl sm:text-3xl font-bold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							{totalUnused}
						</div>
						<div
							className={`text-xs sm:text-sm ${
								isDark ? 'text-gray-400' : 'text-gray-600'
							}`}
						>
							цветов
						</div>
					</div>
				</div>

				{unusedColors.length > 0 && (
					<div className='space-y-3'>
						<div className='flex items-center justify-between'>
							<h4
								className={`text-xs sm:text-sm font-medium ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								Список неиспользуемых цветов:
							</h4>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => setExpanded(!expanded)}
								className='p-1 h-auto'
							>
								{expanded ? (
									<ChevronUp className='w-4 h-4' />
								) : (
									<ChevronDown className='w-4 h-4' />
								)}
							</Button>
						</div>
						
						{expanded && (
							<div className='space-y-2 max-h-96 overflow-y-auto'>
								{unusedColors.map(color => {
									const level = getUnusedLevel(color.daysUnused)
									return (
										<div
											key={color.colorId}
											className='flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-700'
										>
											<div className='flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0'>
												<div
													className='w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-white shadow-sm flex-shrink-0'
													style={{ backgroundColor: color.hex }}
												/>
												<div className='min-w-0 flex-1'>
													<span
														className={`text-xs sm:text-sm font-medium truncate block ${
															isDark ? 'text-gray-200' : 'text-gray-900'
														}`}
													>
														{color.colorName}
													</span>
													<div className='flex items-center space-x-1 sm:space-x-2 mt-1'>
														<AlertTriangle className='w-3 h-3 text-orange-500 flex-shrink-0' />
														<span
															className={`text-xs ${
																isDark ? 'text-gray-400' : 'text-gray-600'
															}`}
														>
															Не используется: {getDaysUnusedText(color.daysUnused)}
														</span>
													</div>
												</div>
											</div>
											<span
												className={`text-xs px-2 py-1 rounded flex-shrink-0 ${getUnusedLevelColor(level)}`}
											>
												{color.daysUnused} дн.
											</span>
										</div>
									)
								})}
							</div>
						)}
					</div>
				)}

				{unusedColors.length === 0 && (
					<div
						className={`text-center py-4 ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						<p className='text-xs sm:text-sm'>
							Все цвета используются активно
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
