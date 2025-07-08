import { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import {
	BarChart3,
	TrendingUp,
	Palette,
	Activity,
	Download,
	Calendar,
	RotateCcw,
	Trash2,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { Button } from '@components/ui/Button'
import toast from 'react-hot-toast'
import {
	getAnalyticsMetrics,
	generateWeeklyReport,
	generateMonthlyReport,
	testFirebaseConnection,
	performAutomaticCleanup,
	cleanupOldAnalyticsData,
} from '@lib/analytics'
import type { AnalyticsMetrics, WeeklyReport } from '@/types/analytics'
import UnusedColorsAnalytics from './UnusedColorsAnalytics'

interface MetricCardProps {
	title: string
	value: string | number
	change?: number
	icon: React.ReactNode
	isDark: boolean
}

function MetricCard({ title, value, change, icon, isDark }: MetricCardProps) {
	return (
		<div
			className={`p-4 sm:p-6 rounded-xl shadow-sm ${
				isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
			} border`}
		>
			<div className='flex items-center justify-between'>
				<div>
					<p
						className={`text-xs sm:text-sm font-medium ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						{title}
					</p>
					<p
						className={`text-lg sm:text-2xl font-bold mt-2 ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						{value}
					</p>
					{change !== undefined && (
						<p
							className={`text-xs sm:text-sm mt-1 flex items-center ${
								change >= 0 ? 'text-green-600' : 'text-red-600'
							}`}
						>
							<TrendingUp className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
							{change > 0 ? '+' : ''}
							{change}%
						</p>
					)}
				</div>
				<div
					className={`p-2 sm:p-3 rounded-lg ${
						isDark ? 'bg-blue-900/30' : 'bg-blue-50'
					}`}
				>
					{icon}
				</div>
			</div>
		</div>
	)
}

interface TopColorItemProps {
	color: { colorName: string; hex: string; usageCount: number }
	isDark: boolean
}

function TopColorItem({ color, isDark }: TopColorItemProps) {
	return (
		<div className='flex items-center justify-between py-2'>
			<div className='flex items-center space-x-3'>
				<div
					className='w-6 h-6 rounded-full border-2 border-white shadow-sm'
					style={{ backgroundColor: color.hex }}
				/>
				<span
					className={`font-medium ${
						isDark ? 'text-gray-200' : 'text-gray-900'
					}`}
				>
					{color.colorName}
				</span>
			</div>
			<span
				className={`text-sm font-semibold px-2 py-1 rounded ${
					isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
				}`}
			>
				{color.usageCount}
			</span>
		</div>
	)
}

interface CreatedColorItemProps {
	color: { colorName: string; hex: string; createdAt: Date }
	isDark: boolean
}

function CreatedColorItem({ color, isDark }: CreatedColorItemProps) {
	return (
		<div className='flex items-center justify-between py-2'>
			<div className='flex items-center space-x-3'>
				<div
					className='w-6 h-6 rounded-full border-2 border-white shadow-sm'
					style={{ backgroundColor: color.hex }}
				/>
				<span
					className={`font-medium ${
						isDark ? 'text-gray-200' : 'text-gray-900'
					}`}
				>
					{color.colorName}
				</span>
			</div>
			<span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
				{color.createdAt.toLocaleDateString('ru-RU')}
			</span>
		</div>
	)
}

interface AnalyticsDashboardProps {}

export interface AnalyticsDashboardRef {
	refreshData: () => void
}

const AnalyticsDashboard = forwardRef<
	AnalyticsDashboardRef,
	AnalyticsDashboardProps
>((_, ref) => {
	const { isDark } = useTheme()
	const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
	const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
	const [loading, setLoading] = useState(true)
	const [generatingReport, setGeneratingReport] = useState(false)
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
	const [cleaningData, setCleaningData] = useState(false)

	// Expose refresh function via ref
	useImperativeHandle(ref, () => ({
		refreshData: loadMetrics,
	}))

	// Вспомогательная функция для скачивания файлов
	const downloadTextFile = (
		content: string,
		filename: string
	): Promise<boolean> => {
		return new Promise(resolve => {
			try {
				// Попробуем стандартный способ
				const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
				const url = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = filename
				a.style.display = 'none'
				document.body.appendChild(a)

				setTimeout(() => {
					try {
						a.click()
						document.body.removeChild(a)
						URL.revokeObjectURL(url)
						resolve(true)
					} catch (err) {
						console.error('Standard download failed:', err)
						document.body.removeChild(a)
						URL.revokeObjectURL(url)

						// Fallback: попробуем с data URL
						try {
							const dataStr =
								'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
							const downloadAnchor = document.createElement('a')
							downloadAnchor.setAttribute('href', dataStr)
							downloadAnchor.setAttribute('download', filename)
							downloadAnchor.style.display = 'none'
							document.body.appendChild(downloadAnchor)
							downloadAnchor.click()
							document.body.removeChild(downloadAnchor)
							resolve(true)
						} catch (fallbackErr) {
							console.error('Fallback download failed:', fallbackErr)
							resolve(false)
						}
					}
				}, 100)
			} catch (error) {
				console.error('Download error:', error)
				resolve(false)
			}
		})
	}

	useEffect(() => {
		loadMetrics()
	}, [selectedMonth])

	// Генерация опций для селектора месяцев (текущий и предыдущий)
	const getMonthOptions = () => {
		const now = new Date()
		const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

		return [
			{
				value: currentMonth.toISOString(),
				label: currentMonth.toLocaleDateString('ru-RU', {
					year: 'numeric',
					month: 'long',
				}),
			},
			{
				value: previousMonth.toISOString(),
				label: previousMonth.toLocaleDateString('ru-RU', {
					year: 'numeric',
					month: 'long',
				}),
			},
		]
	}

	const loadMetrics = async () => {
		try {
			setLoading(true)

			// Проверяем подключение к Firebase
			const isConnected = await testFirebaseConnection()
			if (!isConnected) {
				throw new Error('Нет подключения к Firebase')
			}

			// Выполняем автоматическую очистку старых данных (раз в день)
			await performAutomaticCleanup()

			const [metricsData, weeklyData] = await Promise.all([
				getAnalyticsMetrics(selectedMonth).catch(err => {
					console.error('Error loading metrics:', err)
					return null
				}),
				generateWeeklyReport().catch(err => {
					console.error('Error loading weekly report:', err)
					return null
				}),
			])

			setMetrics(metricsData)
			setWeeklyReport(weeklyData)
			setLastUpdated(new Date())
		} catch (error) {
			console.error('Error loading analytics:', error)
			toast.error(
				'Ошибка загрузки аналитики: ' +
					(error instanceof Error ? error.message : 'Неизвестная ошибка')
			)
		} finally {
			setLoading(false)
		}
	}

	const handleGenerateWeeklyReport = async () => {
		try {
			setGeneratingReport(true)
			const report = await generateWeeklyReport()

			// Генерируем упрощенный текст отчета
			const reportText = `
📊 ЕЖЕНЕДЕЛЬНЫЙ ОТЧЕТ за ${report.weekStart.toLocaleDateString(
				'ru-RU'
			)} - ${report.weekEnd.toLocaleDateString('ru-RU')}

🎨 Создано цветов: ${report.metrics.colorsCreated}

📈 Выполнено использований: ${report.metrics.totalUsage}

🔥 ТОП ЦВЕТА НЕДЕЛИ:
${
	report.topColors.length > 0
		? report.topColors
				.map(
					(color, i) =>
						`${i + 1}. ${color.colorName} - ${color.usageCount} использований`
				)
				.join('\n')
		: 'Данные отсутствуют'
}
			`.trim()

			// Создаем и скачиваем файл
			const success = await downloadTextFile(
				reportText,
				`weekly_report_${report.weekStart.toISOString().split('T')[0]}.txt`
			)
			if (success) {
				toast.success('Еженедельный отчет скачан')
			} else {
				toast.error('Ошибка скачивания файла')
			}
		} catch (error) {
			console.error('Error generating weekly report:', error)
			toast.error('Ошибка генерации отчета')
		} finally {
			setGeneratingReport(false)
		}
	}

	const handleGenerateMonthlyReport = async () => {
		try {
			setGeneratingReport(true)
			const report = await generateMonthlyReport()

			// Генерируем упрощенный текст месячного отчета
			const reportText = `
📊 МЕСЯЧНЫЙ ОТЧЕТ за ${report.monthStart.toLocaleDateString(
				'ru-RU'
			)} - ${report.monthEnd.toLocaleDateString('ru-RU')}

🎨 Создано цветов: ${report.metrics.colorsCreated}

📈 Выполнено использований: ${report.metrics.totalUsage}

🔥 ТОП ЦВЕТА МЕСЯЦА:
${
	report.topColors.length > 0
		? report.topColors
				.map(
					(color, i) =>
						`${i + 1}. ${color.colorName} - ${color.usageCount} использований`
				)
				.join('\n')
		: 'Данные отсутствуют'
}
			`.trim()

			// Создаем и скачиваем файл
			const success = await downloadTextFile(
				reportText,
				`monthly_report_${report.monthStart.toISOString().split('T')[0]}.txt`
			)
			if (success) {
				toast.success('Месячный отчет скачан')
			} else {
				toast.error('Ошибка скачивания файла')
			}
		} catch (error) {
			console.error('Error generating monthly report:', error)
			toast.error('Ошибка генерации отчета')
		} finally {
			setGeneratingReport(false)
		}
	}

	const handleCleanupOldData = async () => {
		try {
			setCleaningData(true)
			toast.loading('Очистка старых данных аналитики...')

			const result = await cleanupOldAnalyticsData()

			if (result.success) {
				toast.dismiss()
				if (result.deletedCount > 0) {
					toast.success(
						`Очистка завершена: удалено ${result.deletedCount} старых записей`
					)
					// Перезагружаем данные после очистки
					await loadMetrics()
				} else {
					toast.success('Старых данных для удаления не найдено')
				}
			} else {
				toast.dismiss()
				toast.error(`Ошибка очистки: ${result.error}`)
			}
		} catch (error) {
			toast.dismiss()
			console.error('Error cleaning up data:', error)
			toast.error('Ошибка при очистке данных')
		} finally {
			setCleaningData(false)
		}
	}

	if (loading) {
		return (
			<div className='flex items-center justify-center h-64'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
					<p className='mt-4 text-gray-600'>Загрузка аналитики...</p>
				</div>
			</div>
		)
	}

	if (!metrics && !weeklyReport) {
		return (
			<div className='text-center py-12'>
				<p className='text-gray-600'>Данные аналитики недоступны</p>
				<Button variant='secondary' onClick={loadMetrics} className='mt-4'>
					Попробовать снова
				</Button>
			</div>
		)
	}

	// Если есть хотя бы метрики или еженедельный отчет, показываем доступные данные
	const safeMetrics = metrics || {
		totalColors: 0,
		totalUsage: 0,
		colorsCreatedThisWeek: 0,
		colorsCreatedThisMonth: 0,
		mostUsedColorsThisMonth: [],
		monthlyCreatedColors: [],
	}

	const safeWeeklyReport = weeklyReport || {
		alerts: [],
		comparison: { colorsCreatedChange: 0, usageChange: 0 },
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
				<div>
					<h1
						className={`text-xl sm:text-2xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						Аналитика
					</h1>
					<p
						className={`text-xs sm:text-sm ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						Статистика и отчеты по цветам
					</p>
					{lastUpdated && (
						<p
							className={`text-xs mt-1 ${
								isDark ? 'text-gray-500' : 'text-gray-500'
							}`}
						>
							Последнее обновление: {lastUpdated.toLocaleString('ru-RU')}
						</p>
					)}

					{/* Month Selector */}
					<div className='mt-3'>
						<select
							value={selectedMonth.toISOString()}
							onChange={e => setSelectedMonth(new Date(e.target.value))}
							className={`px-3 py-2 rounded-lg border text-sm w-full sm:w-auto ${
								isDark
									? 'bg-gray-800 border-gray-600 text-white'
									: 'bg-white border-gray-300 text-gray-900'
							}`}
						>
							{getMonthOptions().map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className='flex flex-col sm:flex-row gap-2 sm:space-x-3'>
					<Button
						variant='secondary'
						leftIcon={<RotateCcw className='w-4 h-4' />}
						onClick={loadMetrics}
						disabled={loading}
						className='w-full sm:w-auto'
					>
						{loading ? 'Обновление...' : 'Обновить'}
					</Button>
					<Button
						variant='secondary'
						leftIcon={<Trash2 className='w-4 h-4' />}
						onClick={handleCleanupOldData}
						disabled={cleaningData}
						className='w-full sm:w-auto'
					>
						{cleaningData ? 'Очистка...' : 'Очистить старые данные'}
					</Button>
					<Button
						variant='secondary'
						leftIcon={<Calendar className='w-4 h-4' />}
						onClick={handleGenerateWeeklyReport}
						disabled={generatingReport}
						className='w-full sm:w-auto'
					>
						{generatingReport ? 'Генерация...' : 'Еженедельный отчет'}
					</Button>
					<Button
						leftIcon={<Download className='w-4 h-4' />}
						onClick={handleGenerateMonthlyReport}
						disabled={generatingReport}
						className='w-full sm:w-auto'
					>
						{generatingReport ? 'Генерация...' : 'Месячный отчет'}
					</Button>
				</div>
			</div>

			{/* Metrics Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
				<MetricCard
					title='Всего цветов'
					value={safeMetrics.totalColors}
					icon={
						<Palette
							className={`w-6 h-6 ${
								isDark ? 'text-blue-400' : 'text-blue-600'
							}`}
						/>
					}
					isDark={isDark}
				/>
				<MetricCard
					title={`Использований за ${selectedMonth.toLocaleDateString('ru-RU', {
						month: 'long',
					})}`}
					value={safeMetrics.totalUsage}
					icon={
						<Activity
							className={`w-6 h-6 ${
								isDark ? 'text-green-400' : 'text-green-600'
							}`}
						/>
					}
					isDark={isDark}
				/>
				<MetricCard
					title='Новых цветов за неделю'
					value={safeMetrics.colorsCreatedThisWeek}
					change={safeWeeklyReport.comparison.colorsCreatedChange}
					icon={
						<TrendingUp
							className={`w-6 h-6 ${
								isDark ? 'text-purple-400' : 'text-purple-600'
							}`}
						/>
					}
					isDark={isDark}
				/>
				<MetricCard
					title='Новых цветов за месяц'
					value={safeMetrics.colorsCreatedThisMonth}
					icon={
						<BarChart3
							className={`w-6 h-6 ${
								isDark ? 'text-orange-400' : 'text-orange-600'
							}`}
						/>
					}
					isDark={isDark}
				/>
			</div>

			{/* Charts and Details */}
			<div className='grid grid-cols-1 gap-4 sm:gap-6'>
				{/* Top Colors This Month */}
				<div
					className={`p-4 sm:p-6 rounded-xl shadow-sm ${
						isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
					} border`}
				>
					<h3
						className={`text-base sm:text-lg font-semibold mb-4 ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						Топ цвета{' '}
						{selectedMonth
							.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
							.toLowerCase()}
					</h3>
					<div className='space-y-3'>
						{safeMetrics.mostUsedColorsThisMonth.length > 0 ? (
							safeMetrics.mostUsedColorsThisMonth.map(color => (
								<TopColorItem
									key={color.colorId}
									color={color}
									isDark={isDark}
								/>
							))
						) : (
							<p
								className={`text-xs sm:text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								Нет данных за{' '}
								{selectedMonth
									.toLocaleDateString('ru-RU', {
										month: 'long',
										year: 'numeric',
									})
									.toLowerCase()}
							</p>
						)}
					</div>
				</div>

				{/* Colors Created This Month */}
				<div
					className={`p-4 sm:p-6 rounded-xl shadow-sm ${
						isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
					} border`}
				>
					<h3
						className={`text-base sm:text-lg font-semibold mb-4 ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						Цвета созданные в{' '}
						{selectedMonth
							.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
							.toLowerCase()}
					</h3>
					<div className='space-y-3'>
						{safeMetrics.monthlyCreatedColors.length > 0 ? (
							safeMetrics.monthlyCreatedColors
								.slice(0, 5)
								.map(color => (
									<CreatedColorItem
										key={color.colorId}
										color={color}
										isDark={isDark}
									/>
								))
						) : (
							<p
								className={`text-xs sm:text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								Нет данных за{' '}
								{selectedMonth
									.toLocaleDateString('ru-RU', {
										month: 'long',
										year: 'numeric',
									})
									.toLowerCase()}
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Unused Colors Analytics */}
			<UnusedColorsAnalytics selectedMonth={selectedMonth} />
		</div>
	)
})

export default AnalyticsDashboard
