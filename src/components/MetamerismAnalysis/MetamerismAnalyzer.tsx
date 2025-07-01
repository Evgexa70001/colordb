import { useState, useMemo } from 'react'
import {
	ExtendedLightSource,
	MetamerismTest,
	MetamerismReport,
	LightingEnvironment,
	ColorAppearance,
} from '../../types'
import {
	METAMERISM_TESTS,
	LIGHTING_ENVIRONMENTS,
	generateMetamerismReport,
} from '../../utils/metamerismUtils'
import {
	Sun,
	Lightbulb,
	Zap,
	AlertTriangle,
	CheckCircle,
	Eye,
	Download,
	BarChart3,
} from 'lucide-react'

interface MetamerismAnalyzerProps {
	color: {
		hex: string
		lab?: { l: number; a: number; b: number }
		name?: string
	}
	onReportGenerated?: (report: MetamerismReport) => void
}

export default function MetamerismAnalyzer({
	color,
	onReportGenerated,
}: MetamerismAnalyzerProps) {
	const [selectedTest, setSelectedTest] = useState<MetamerismTest>(
		METAMERISM_TESTS[0]
	)
	const [selectedEnvironment, setSelectedEnvironment] =
		useState<LightingEnvironment | null>(null)
	const [showSimulation, setShowSimulation] = useState(true)
	const [showDetailedReport, setShowDetailedReport] = useState(false)

	// Генерируем отчет о метамеризме
	const metamerismReport = useMemo(() => {
		const report = generateMetamerismReport(color, selectedTest)
		onReportGenerated?.(report)
		return report
	}, [color, selectedTest, onReportGenerated])

	// Получаем источники света из выбранной среды или теста
	const lightSources = selectedEnvironment
		? [
				selectedEnvironment.lighting.primaryLight,
				...(selectedEnvironment.lighting.secondaryLights || []),
		  ]
		: selectedTest.lightSources

	const handleExportReport = () => {
		const reportData = {
			color: color.name || color.hex,
			testName: selectedTest.name,
			date: new Date().toISOString(),
			assessment: metamerismReport.overallAssessment,
			appearances: metamerismReport.appearances,
			comparisonPairs: metamerismReport.comparisonPairs,
		}

		const blob = new Blob([JSON.stringify(reportData, null, 2)], {
			type: 'application/json',
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `metamerism_report_${color.name || 'color'}_${Date.now()}.json`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}

	return (
		<div className='space-y-6'>
			{/* Заголовок и настройки */}
			<div className='flex justify-between items-center'>
				<div className='flex items-center space-x-2'>
					<Eye className='w-5 h-5 text-purple-600' />
					<h3 className='text-lg font-semibold'>Анализ метамеризма</h3>
					{color.name && (
						<span className='text-sm text-gray-500'>- {color.name}</span>
					)}
				</div>

				<div className='flex space-x-2'>
					<button
						onClick={() => setShowSimulation(!showSimulation)}
						className='px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200'
					>
						{showSimulation ? 'Скрыть симуляцию' : 'Показать симуляцию'}
					</button>

					<button
						onClick={handleExportReport}
						className='px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200'
					>
						<Download className='w-4 h-4 inline mr-1' />
						Экспорт отчета
					</button>
				</div>
			</div>

			{/* Выбор теста и среды */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div>
					<label className='block text-sm font-medium mb-2'>
						Тест метамеризма:
					</label>
					<select
						value={selectedTest.id}
						onChange={e => {
							const test = METAMERISM_TESTS.find(t => t.id === e.target.value)
							if (test) setSelectedTest(test)
						}}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						{METAMERISM_TESTS.map(test => (
							<option key={test.id} value={test.id}>
								{test.name} (ΔE ≤ {test.acceptanceThreshold})
							</option>
						))}
					</select>
					<p className='text-xs text-gray-500 mt-1'>
						{selectedTest.description}
					</p>
				</div>

				<div>
					<label className='block text-sm font-medium mb-2'>
						Среда освещения (опционально):
					</label>
					<select
						value={selectedEnvironment?.id || ''}
						onChange={e => {
							const env = LIGHTING_ENVIRONMENTS.find(
								env => env.id === e.target.value
							)
							setSelectedEnvironment(env || null)
						}}
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						<option value=''>Использовать тест по умолчанию</option>
						{LIGHTING_ENVIRONMENTS.map(env => (
							<option key={env.id} value={env.id}>
								{env.name}
							</option>
						))}
					</select>
					{selectedEnvironment && (
						<p className='text-xs text-gray-500 mt-1'>
							{selectedEnvironment.description}
						</p>
					)}
				</div>
			</div>

			{/* Общая оценка */}
			<AssessmentSummary assessment={metamerismReport.overallAssessment} />

			{/* Симуляция цвета под разными источниками света */}
			{showSimulation && (
				<ColorSimulation
					appearances={metamerismReport.appearances}
					lightSources={lightSources}
				/>
			)}

			{/* Сравнение источников света */}
			<LightSourceComparison
				comparisonPairs={metamerismReport.comparisonPairs}
				lightSources={lightSources}
				threshold={selectedTest.acceptanceThreshold}
			/>

			{/* Детальный отчет */}
			<div className='bg-white border rounded-lg p-4'>
				<div className='flex justify-between items-center mb-3'>
					<h4 className='font-medium'>Детальный отчет</h4>
					<button
						onClick={() => setShowDetailedReport(!showDetailedReport)}
						className='flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800'
					>
						<BarChart3 className='w-4 h-4' />
						<span>{showDetailedReport ? 'Скрыть' : 'Показать'}</span>
					</button>
				</div>

				{showDetailedReport && (
					<DetailedReport report={metamerismReport} test={selectedTest} />
				)}
			</div>
		</div>
	)
}

// Компонент общей оценки
function AssessmentSummary({
	assessment,
}: {
	assessment: MetamerismReport['overallAssessment']
}) {
	const getSeverityColor = (severity: string) => {
		switch (severity) {
			case 'acceptable':
				return 'text-green-600 bg-green-100 border-green-200'
			case 'noticeable':
				return 'text-blue-600 bg-blue-100 border-blue-200'
			case 'problematic':
				return 'text-yellow-600 bg-yellow-100 border-yellow-200'
			case 'critical':
				return 'text-red-600 bg-red-100 border-red-200'
			default:
				return 'text-gray-600 bg-gray-100 border-gray-200'
		}
	}

	const getSeverityIcon = (severity: string) => {
		switch (severity) {
			case 'acceptable':
				return <CheckCircle className='w-5 h-5' />
			case 'noticeable':
				return <Eye className='w-5 h-5' />
			case 'problematic':
			case 'critical':
				return <AlertTriangle className='w-5 h-5' />
			default:
				return null
		}
	}

	const getSeverityLabel = (severity: string) => {
		switch (severity) {
			case 'acceptable':
				return 'Приемлемо'
			case 'noticeable':
				return 'Заметно'
			case 'problematic':
				return 'Проблематично'
			case 'critical':
				return 'Критично'
			default:
				return 'Неизвестно'
		}
	}

	return (
		<div
			className={`border rounded-lg p-6 ${getSeverityColor(
				assessment.severity
			)}`}
		>
			<div className='flex items-center space-x-3 mb-4'>
				{getSeverityIcon(assessment.severity)}
				<div>
					<h3 className='text-lg font-semibold'>
						Оценка метамеризма: {getSeverityLabel(assessment.severity)}
					</h3>
					<p className='text-sm'>{assessment.recommendation}</p>
				</div>
			</div>

			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				{assessment.suitableApplications.length > 0 && (
					<div>
						<h4 className='font-medium mb-2'>✅ Подходящие применения:</h4>
						<ul className='text-sm space-y-1'>
							{assessment.suitableApplications.map((app, index) => (
								<li key={index}>• {app}</li>
							))}
						</ul>
					</div>
				)}

				{assessment.restrictedApplications.length > 0 && (
					<div>
						<h4 className='font-medium mb-2'>⚠️ Ограниченные применения:</h4>
						<ul className='text-sm space-y-1'>
							{assessment.restrictedApplications.map((app, index) => (
								<li key={index}>• {app}</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	)
}

// Компонент симуляции цвета
function ColorSimulation({
	appearances,
	lightSources,
}: {
	appearances: ColorAppearance[]
	lightSources: ExtendedLightSource[]
}) {
	return (
		<div className='bg-white border rounded-lg p-4'>
			<h4 className='font-medium mb-4'>
				Симуляция цвета под различным освещением
			</h4>

			<div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
				{appearances.map((appearance, index) => {
					const lightSource = lightSources.find(
						ls => ls.id === appearance.lightSourceId
					)
					if (!lightSource) return null

					return (
						<ColorPreview
							key={appearance.lightSourceId}
							appearance={appearance}
							lightSource={lightSource}
							isOriginal={index === 0}
						/>
					)
				})}
			</div>
		</div>
	)
}

// Компонент предварительного просмотра цвета
function ColorPreview({
	appearance,
	lightSource,
	isOriginal,
}: {
	appearance: ColorAppearance
	lightSource: ExtendedLightSource
	isOriginal: boolean
}) {
	const getLightIcon = (type: string) => {
		switch (type) {
			case 'daylight':
				return <Sun className='w-4 h-4' />
			case 'led':
				return <Zap className='w-4 h-4' />
			case 'fluorescent':
				return <Lightbulb className='w-4 h-4' />
			case 'incandescent':
				return <Lightbulb className='w-4 h-4' />
			case 'uv':
				return <Sun className='w-4 h-4' />
			default:
				return <Lightbulb className='w-4 h-4' />
		}
	}

	return (
		<div
			className={`border rounded-lg p-3 ${
				isOriginal ? 'ring-2 ring-blue-500' : ''
			}`}
		>
			<div className='flex items-center space-x-2 mb-2'>
				{getLightIcon(lightSource.type)}
				<span className='text-sm font-medium truncate' title={lightSource.name}>
					{lightSource.name}
				</span>
			</div>

			<div
				className='w-full h-16 rounded-md border shadow-sm mb-2'
				style={{ backgroundColor: appearance.perceivedColor.hex }}
			/>

			<div className='text-xs text-gray-600 space-y-1'>
				<div className='font-mono'>{appearance.perceivedColor.hex}</div>
				<div>{appearance.perceivedColor.description}</div>
				{appearance.colorShift.magnitude > 1 && (
					<div className='text-orange-600'>
						Сдвиг: {appearance.colorShift.direction}
					</div>
				)}
				{appearance.warnings.length > 0 && (
					<div className='text-red-600 text-xs'>
						⚠️ {appearance.warnings[0]}
					</div>
				)}
			</div>

			<div className='flex justify-between text-xs text-gray-500 mt-2'>
				<span>Контраст: {appearance.contrast.toFixed(1)}</span>
				<span>Видимость: {(appearance.visibility * 100).toFixed(0)}%</span>
			</div>
		</div>
	)
}

// Компонент сравнения источников света
function LightSourceComparison({
	comparisonPairs,
	lightSources,
	threshold,
}: {
	comparisonPairs: MetamerismReport['comparisonPairs']
	lightSources: ExtendedLightSource[]
	threshold: number
}) {
	const getLightName = (lightId: string) => {
		return lightSources.find(ls => ls.id === lightId)?.name || lightId
	}

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pass':
				return 'text-green-600 bg-green-50'
			case 'marginal':
				return 'text-yellow-600 bg-yellow-50'
			case 'fail':
				return 'text-red-600 bg-red-50'
			default:
				return 'text-gray-600 bg-gray-50'
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'pass':
				return 'Пройден'
			case 'marginal':
				return 'Граничный'
			case 'fail':
				return 'Провален'
			default:
				return 'Неизвестно'
		}
	}

	return (
		<div className='bg-white border rounded-lg p-4'>
			<h4 className='font-medium mb-4'>Сравнение между источниками света</h4>

			<div className='space-y-3'>
				{comparisonPairs.map((pair, index) => (
					<div
						key={index}
						className={`p-3 rounded-lg border ${getStatusColor(
							pair.acceptanceStatus
						)}`}
					>
						<div className='flex justify-between items-center'>
							<div className='flex-1'>
								<div className='font-medium text-sm'>
									{getLightName(pair.light1)} ↔ {getLightName(pair.light2)}
								</div>
								<div className='text-xs opacity-75'>
									{pair.visualDifference === 'imperceptible' && 'Неразличимо'}
									{pair.visualDifference === 'slight' && 'Слабо заметно'}
									{pair.visualDifference === 'noticeable' && 'Заметно'}
									{pair.visualDifference === 'significant' && 'Значительно'}
								</div>
							</div>

							<div className='text-right'>
								<div className='font-mono text-sm'>
									ΔE = {pair.deltaE.toFixed(2)}
								</div>
								<div className='text-xs'>
									{getStatusLabel(pair.acceptanceStatus)}
								</div>
							</div>
						</div>

						{/* Индикатор прогресса для ΔE */}
						<div className='mt-2'>
							<div className='w-full bg-gray-200 rounded-full h-2'>
								<div
									className={`h-2 rounded-full transition-all duration-300 ${
										pair.deltaE <= threshold
											? 'bg-green-500'
											: pair.deltaE <= threshold * 1.5
											? 'bg-yellow-500'
											: 'bg-red-500'
									}`}
									style={{
										width: `${Math.min(
											100,
											(pair.deltaE / (threshold * 2)) * 100
										)}%`,
									}}
								/>
							</div>
							<div className='flex justify-between text-xs text-gray-500 mt-1'>
								<span>0</span>
								<span>{threshold}</span>
								<span>{threshold * 2}</span>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// Компонент детального отчета
function DetailedReport({
	report,
	test,
}: {
	report: MetamerismReport
	test: MetamerismTest
}) {
	return (
		<div className='space-y-4'>
			<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
				<div className='text-center'>
					<div className='text-2xl font-bold text-blue-600'>
						{test.lightSources.length}
					</div>
					<div className='text-sm text-gray-500'>Источников света</div>
				</div>
				<div className='text-center'>
					<div className='text-2xl font-bold text-green-600'>
						{
							report.comparisonPairs.filter(p => p.acceptanceStatus === 'pass')
								.length
						}
					</div>
					<div className='text-sm text-gray-500'>Пройденных тестов</div>
				</div>
				<div className='text-center'>
					<div className='text-2xl font-bold text-yellow-600'>
						{
							report.comparisonPairs.filter(
								p => p.acceptanceStatus === 'marginal'
							).length
						}
					</div>
					<div className='text-sm text-gray-500'>Граничных</div>
				</div>
				<div className='text-center'>
					<div className='text-2xl font-bold text-red-600'>
						{
							report.comparisonPairs.filter(p => p.acceptanceStatus === 'fail')
								.length
						}
					</div>
					<div className='text-sm text-gray-500'>Проваленных</div>
				</div>
			</div>

			<div className='border-t pt-4'>
				<h5 className='font-medium mb-2'>Настройки теста:</h5>
				<div className='grid grid-cols-2 gap-4 text-sm'>
					<div>
						<span className='font-medium'>Пороговое значение:</span> ΔE ≤{' '}
						{test.acceptanceThreshold}
					</div>
					<div>
						<span className='font-medium'>Критичность:</span>{' '}
						{test.criticalityLevel === 'low'
							? 'Низкая'
							: test.criticalityLevel === 'medium'
							? 'Средняя'
							: test.criticalityLevel === 'high'
							? 'Высокая'
							: 'Критическая'}
					</div>
					<div>
						<span className='font-medium'>Отрасль:</span>{' '}
						{test.industry === 'flexography'
							? 'Флексография'
							: test.industry === 'packaging'
							? 'Упаковка'
							: test.industry === 'offset'
							? 'Офсет'
							: test.industry}
					</div>
					<div>
						<span className='font-medium'>Дата теста:</span>{' '}
						{report.testDate.toLocaleDateString()}
					</div>
				</div>
			</div>
		</div>
	)
}
