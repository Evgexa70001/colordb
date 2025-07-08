import { useState, useEffect } from 'react'
import {
	Calendar,
	TrendingDown,
	AlertTriangle,
	Info,
	ChevronDown,
	ChevronUp,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { Button } from '@components/ui/Button'
import { getUnusedColorsAnalytics } from '@lib/analytics'

interface UnusedColorData {
	colorId: string
	colorName: string
	hex: string
	lastUsed: Date | null
	createdAt: Date
	daysUnused: number
	recipe?: string
}

interface MonthlyUnusedStats {
	month: string
	totalUnused: number
	unusedColors: UnusedColorData[]
	trend: 'increasing' | 'decreasing' | 'stable'
}

interface UnusedColorsAnalyticsProps {
	selectedMonth?: Date
}

export default function UnusedColorsAnalytics({
	selectedMonth,
}: UnusedColorsAnalyticsProps) {
	const { isDark } = useTheme()
	const [monthlyStats, setMonthlyStats] = useState<MonthlyUnusedStats[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedPeriod, setSelectedPeriod] = useState<
		'3months' | '6months' | '12months'
	>('6months')
	const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

	useEffect(() => {
		loadUnusedColorsData()
	}, [selectedPeriod, selectedMonth])

	const loadUnusedColorsData = async () => {
		setLoading(true)
		try {
			const data = await getUnusedColorsAnalytics(selectedPeriod)
			setMonthlyStats(data)
		} catch (error) {
			console.error('Error loading unused colors data:', error)
		} finally {
			setLoading(false)
		}
	}

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case 'increasing':
				return <TrendingDown className='w-4 h-4 text-red-500' />
			case 'decreasing':
				return <TrendingDown className='w-4 h-4 text-green-500' />
			default:
				return <Info className='w-4 h-4 text-blue-500' />
		}
	}

	const getTrendText = (trend: string) => {
		switch (trend) {
			case 'increasing':
				return 'Растет'
			case 'decreasing':
				return 'Снижается'
			default:
				return 'Стабильно'
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

	const toggleMonthExpansion = (month: string) => {
		const newExpanded = new Set(expandedMonths)
		if (newExpanded.has(month)) {
			newExpanded.delete(month)
		} else {
			newExpanded.add(month)
		}
		setExpandedMonths(newExpanded)
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
						Статистика по цветам, которые не использовались длительное время
					</p>
				</div>

				<div className='flex flex-col sm:flex-row gap-2 sm:space-x-2'>
					<select
						value={selectedPeriod}
						onChange={e => setSelectedPeriod(e.target.value as any)}
						className={`px-3 py-2 rounded-lg border text-sm ${
							isDark
								? 'bg-gray-800 border-gray-600 text-white'
								: 'bg-white border-gray-300 text-gray-900'
						}`}
					>
						<option value='3months'>3 месяца</option>
						<option value='6months'>6 месяцев</option>
						<option value='12months'>12 месяцев</option>
					</select>

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
			</div>

			{/* Monthly Statistics */}
			<div className='grid grid-cols-1 gap-4 sm:gap-6'>
				{monthlyStats.map(monthData => (
					<div
						key={monthData.month}
						className={`p-4 sm:p-6 rounded-xl shadow-sm border ${
							isDark
								? 'bg-gray-800 border-gray-700'
								: 'bg-white border-gray-200'
						}`}
					>
						<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4'>
							<h3
								className={`text-base sm:text-lg font-semibold ${
									isDark ? 'text-white' : 'text-gray-900'
								}`}
							>
								{monthData.month}
							</h3>
							<div className='flex items-center space-x-2'>
								{getTrendIcon(monthData.trend)}
								<span
									className={`text-xs sm:text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									{getTrendText(monthData.trend)}
								</span>
							</div>
						</div>

						<div className='mb-4'>
							<div className='flex items-center justify-between'>
								<span
									className={`text-xs sm:text-sm ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									Неиспользуемых цветов:
								</span>
								<span
									className={`text-base sm:text-lg font-bold ${
										isDark ? 'text-white' : 'text-gray-900'
									}`}
								>
									{monthData.totalUnused}
								</span>
							</div>
						</div>

						{monthData.unusedColors.length > 0 && (
							<div className='space-y-3'>
								<div className='flex items-center justify-between'>
									<h4
										className={`text-xs sm:text-sm font-medium ${
											isDark ? 'text-gray-300' : 'text-gray-700'
										}`}
									>
										Неиспользуемые цвета:
									</h4>
									<Button
										variant='ghost'
										size='sm'
										onClick={() => toggleMonthExpansion(monthData.month)}
										className='p-1 h-auto'
									>
										{expandedMonths.has(monthData.month) ? (
											<ChevronUp className='w-4 h-4' />
										) : (
											<ChevronDown className='w-4 h-4' />
										)}
									</Button>
								</div>
								<div className='space-y-2'>
									{monthData.unusedColors
										.slice(
											0,
											expandedMonths.has(monthData.month) ? undefined : 5
										)
										.map(color => (
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
																Не используется:{' '}
																{getDaysUnusedText(color.daysUnused)}
															</span>
														</div>
													</div>
												</div>
												<span
													className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
														isDark
															? 'bg-red-900/30 text-red-300'
															: 'bg-red-100 text-red-700'
													}`}
												>
													{color.daysUnused} дн.
												</span>
											</div>
										))}
									{!expandedMonths.has(monthData.month) &&
										monthData.unusedColors.length > 5 && (
											<div
												className={`text-center py-2 text-xs sm:text-sm ${
													isDark ? 'text-gray-400' : 'text-gray-600'
												}`}
											>
												Показано 5 из {monthData.unusedColors.length} цветов
											</div>
										)}
								</div>
							</div>
						)}

						{monthData.unusedColors.length === 0 && (
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
				))}
			</div>

			{/* Summary */}
			{monthlyStats.length > 0 && (
				<div
					className={`p-4 sm:p-6 rounded-xl shadow-sm border ${
						isDark
							? 'bg-blue-900/20 border-blue-800/30'
							: 'bg-blue-50 border-blue-200'
					}`}
				>
					<h3
						className={`text-base sm:text-lg font-semibold mb-4 ${
							isDark ? 'text-blue-300' : 'text-blue-800'
						}`}
					>
						Общая статистика
					</h3>
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						<div className='text-center'>
							<div
								className={`text-xl sm:text-2xl font-bold ${
									isDark ? 'text-blue-300' : 'text-blue-800'
								}`}
							>
								{monthlyStats.reduce(
									(sum, month) => sum + month.totalUnused,
									0
								)}
							</div>
							<div
								className={`text-xs sm:text-sm ${
									isDark ? 'text-blue-400' : 'text-blue-600'
								}`}
							>
								Всего неиспользуемых
							</div>
						</div>
						<div className='text-center'>
							<div
								className={`text-xl sm:text-2xl font-bold ${
									isDark ? 'text-blue-300' : 'text-blue-800'
								}`}
							>
								{Math.round(
									monthlyStats.reduce(
										(sum, month) => sum + month.totalUnused,
										0
									) / monthlyStats.length
								)}
							</div>
							<div
								className={`text-xs sm:text-sm ${
									isDark ? 'text-blue-400' : 'text-blue-600'
								}`}
							>
								Среднее за месяц
							</div>
						</div>
						<div className='text-center'>
							<div
								className={`text-xl sm:text-2xl font-bold ${
									isDark ? 'text-blue-300' : 'text-blue-800'
								}`}
							>
								{
									monthlyStats.filter(month => month.trend === 'decreasing')
										.length
								}
							</div>
							<div
								className={`text-xs sm:text-sm ${
									isDark ? 'text-blue-400' : 'text-blue-600'
								}`}
							>
								Месяцев с улучшением
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
