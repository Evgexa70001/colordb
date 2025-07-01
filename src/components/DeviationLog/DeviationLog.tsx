import { useState, useEffect } from 'react'
import {
	AlertTriangle,
	CheckCircle,
	Clock,
	FileText,
	Search,
	ChevronDown,
	ChevronUp,
	Calendar,
	AlertCircle,
	XCircle,
	Plus,
	Edit3,
	Trash2,
	X,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import type { ColorDeviation, ColorCorrection } from '@/types'
import {
	getDeviations,
	getCorrections,
	getDeviationsByColor,
	updateDeviation,
	deleteDeviation,
} from '@/lib/deviations'
import toast from 'react-hot-toast'
import NewDeviationModal from './NewDeviationModal'

interface DeviationLogProps {
	colorId?: string // Если передан, показываем только отклонения для конкретного цвета
}

const DeviationLog: React.FC<DeviationLogProps> = ({ colorId }) => {
	const { isDark } = useTheme()
	const [deviations, setDeviations] = useState<ColorDeviation[]>([])
	const [corrections, setCorrections] = useState<ColorCorrection[]>([])
	const [loading, setLoading] = useState(true)
	const [expandedDeviation, setExpandedDeviation] = useState<string | null>(
		null
	)
	const [isNewDeviationModalOpen, setIsNewDeviationModalOpen] = useState(false)
	const [editingStatus, setEditingStatus] = useState<string | null>(null)
	const [filters, setFilters] = useState({
		status: 'all' as 'all' | 'open' | 'in_progress' | 'resolved' | 'rejected',
		deviationType: 'all' as
			| 'all'
			| 'color_mismatch'
			| 'recipe_adjustment'
			| 'quality_issue'
		
			| 'production_error',
		dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
	})
	const [searchTerm, setSearchTerm] = useState('')

	useEffect(() => {
		loadDeviations()
		loadCorrections()
	}, [colorId, filters])

	const loadDeviations = async () => {
		try {
			setLoading(true)
			let deviationsData: ColorDeviation[]

			if (colorId) {
				// Загружаем отклонения для конкретного цвета
				deviationsData = await getDeviationsByColor(colorId)
			} else {
				// Загружаем все отклонения
				deviationsData = await getDeviations()
			}

			setDeviations(deviationsData)
		} catch (error) {
			console.error('Error loading deviations:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка загрузки журнала отклонений')
			}
		} finally {
			setLoading(false)
		}
	}

	const loadCorrections = async () => {
		try {
			const correctionsData = await getCorrections()
			setCorrections(correctionsData)
		} catch (error) {
			console.error('Error loading corrections:', error)
			// Не показываем ошибку для корректировок, так как это вторичные данные
		}
	}

	const handleNewDeviation = (newDeviation: ColorDeviation) => {
		setDeviations(prev => [newDeviation, ...prev])
		toast.success('Отклонение добавлено в журнал')
	}

	const getStatusIcon = (status: ColorDeviation['status']) => {
		switch (status) {
			case 'open':
				return <AlertCircle className='w-4 h-4 text-red-500' />
			case 'in_progress':
				return <Clock className='w-4 h-4 text-yellow-500' />
			case 'resolved':
				return <CheckCircle className='w-4 h-4 text-green-500' />
			case 'rejected':
				return <XCircle className='w-4 h-4 text-gray-500' />
			default:
				return null
		}
	}

	const handleUpdateStatus = async (
		deviationId: string,
		newStatus: ColorDeviation['status']
	) => {
		try {
			await updateDeviation(deviationId, { status: newStatus })
			setDeviations(prev =>
				prev.map(deviation =>
					deviation.id === deviationId
						? { ...deviation, status: newStatus }
						: deviation
				)
			)
			setEditingStatus(null)
			toast.success('Статус отклонения обновлен')
		} catch (error) {
			console.error('Error updating deviation status:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при обновлении статуса')
			}
		}
	}

	const handleDeleteDeviation = async (deviationId: string) => {
		if (!confirm('Вы уверены, что хотите удалить это отклонение?')) {
			return
		}

		try {
			await deleteDeviation(deviationId)
			setDeviations(prev =>
				prev.filter(deviation => deviation.id !== deviationId)
			)
			toast.success('Отклонение удалено')
		} catch (error) {
			console.error('Error deleting deviation:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при удалении отклонения')
			}
		}
	}

	const filteredDeviations = deviations.filter(deviation => {
		if (filters.status !== 'all' && deviation.status !== filters.status)
			return false
		if (
			filters.deviationType !== 'all' &&
			deviation.deviationType !== filters.deviationType
		)
			return false
		if (
			searchTerm &&
			!deviation.colorName.toLowerCase().includes(searchTerm.toLowerCase()) &&
			!deviation.description.toLowerCase().includes(searchTerm.toLowerCase())
		)
			return false
		return true
	})

	const toggleExpandDeviation = (deviationId: string) => {
		setExpandedDeviation(expandedDeviation === deviationId ? null : deviationId)
	}

	const getDeviationCorrections = (deviationId: string) => {
		return corrections.filter(
			correction => correction.deviationId === deviationId
		)
	}

	if (loading) {
		return (
			<div className={`p-8 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
				<div className='animate-pulse'>
					<div className='h-6 bg-gray-300 rounded w-1/4 mb-4'></div>
					<div className='space-y-3'>
						{[...Array(3)].map((_, i) => (
							<div key={i} className='h-16 bg-gray-300 rounded'></div>
						))}
					</div>
				</div>
			</div>
		)
	}

	return (
		<>
			<div
				className={`rounded-xl shadow-sm border ${
					isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
				}`}
			>
				<div className='p-6 border-b border-gray-200 dark:border-gray-700'>
					<div className='flex items-center justify-between mb-4'>
						<h2
							className={`text-xl font-bold flex items-center ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							<AlertTriangle className='w-5 h-5 mr-2 text-orange-500' />
							Журнал отклонений и корректировок
							{colorId && (
								<span className='ml-2 text-sm font-normal text-gray-500'>
									(для выбранного цвета)
								</span>
							)}
						</h2>
						<Button
							onClick={() => setIsNewDeviationModalOpen(true)}
							className='bg-orange-500 hover:bg-orange-600 text-white'
						>
							<Plus className='w-4 h-4 mr-2' />
							Новое отклонение
						</Button>
					</div>

					{/* Поиск и фильтры */}
					<div className='flex flex-wrap gap-4 mb-4'>
						<div className='flex-1 min-w-64'>
							<div className='relative'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
								<input
									type='text'
									placeholder='Поиск по цвету или описанию...'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								/>
							</div>
						</div>

						<select
							value={filters.status}
							onChange={e =>
								setFilters(prev => ({ ...prev, status: e.target.value as any }))
							}
							className={`px-3 py-2 rounded-lg border ${
								isDark
									? 'bg-gray-700 border-gray-600 text-white'
									: 'bg-white border-gray-300 text-gray-900'
							} focus:ring-2 focus:ring-blue-500`}
						>
							<option value='all'>Все статусы</option>
							<option value='open'>Открыто</option>
							<option value='in_progress'>В работе</option>
							<option value='resolved'>Решено</option>
							<option value='rejected'>Отклонено</option>
						</select>
					</div>
				</div>

				<div className='divide-y divide-gray-200 dark:divide-gray-700'>
					{filteredDeviations.length === 0 ? (
						<div className='p-8 text-center'>
							<FileText
								className={`w-12 h-12 mx-auto mb-4 ${
									isDark ? 'text-gray-600' : 'text-gray-400'
								}`}
							/>
							<p
								className={`text-lg font-medium mb-2 ${
									isDark ? 'text-gray-300' : 'text-gray-600'
								}`}
							>
								Отклонения не найдены
							</p>
							<p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
								{searchTerm || filters.status !== 'all'
									? 'Попробуйте изменить фильтры поиска'
									: 'Пока нет зарегистрированных отклонений'}
							</p>
						</div>
					) : (
						filteredDeviations.map(deviation => {
							const isExpanded = expandedDeviation === deviation.id
							const deviationCorrections = getDeviationCorrections(deviation.id)

							return (
								<div key={deviation.id} className='p-6'>
									<div
										className='cursor-pointer'
										onClick={() => toggleExpandDeviation(deviation.id)}
									>
										<div className='flex items-start justify-between mb-3'>
											<div className='flex items-start space-x-3'>
												{getStatusIcon(deviation.status)}
												<div>
													<h3
														className={`font-semibold ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														{deviation.colorName}
														{deviation.techCardNumber && (
															<span className='ml-2 text-sm font-normal text-gray-500'>
																({deviation.techCardNumber})
															</span>
														)}
													</h3>
													<p
														className={`text-sm ${
															isDark ? 'text-gray-400' : 'text-gray-600'
														}`}
													>
														{deviation.description}
													</p>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												{/* Управление статусом */}
												<div
													className='flex items-center space-x-2'
													onClick={e => e.stopPropagation()}
												>
													{editingStatus === deviation.id ? (
														<>
															<select
																value={deviation.status}
																onChange={e =>
																	handleUpdateStatus(
																		deviation.id,
																		e.target.value as ColorDeviation['status']
																	)
																}
																className={`px-2 py-1 text-xs rounded border ${
																	isDark
																		? 'bg-gray-700 border-gray-600 text-white'
																		: 'bg-white border-gray-300 text-gray-900'
																} focus:ring-1 focus:ring-blue-500`}
															>
																<option value='open'>Открыто</option>
																<option value='in_progress'>В работе</option>
																<option value='resolved'>Решено</option>
																<option value='rejected'>Отклонено</option>
															</select>
															<button
																onClick={() => setEditingStatus(null)}
																className='p-1 text-gray-400 hover:text-gray-600'
															>
																<X className='w-4 h-4' />
															</button>
														</>
													) : (
														<>
															<button
																onClick={() => setEditingStatus(deviation.id)}
																className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
																title='Изменить статус'
															>
																<Edit3 className='w-4 h-4' />
															</button>
															<button
																onClick={() =>
																	handleDeleteDeviation(deviation.id)
																}
																className='p-1 text-gray-400 hover:text-red-600 transition-colors'
																title='Удалить отклонение'
															>
																<Trash2 className='w-4 h-4' />
															</button>
														</>
													)}
												</div>
												{isExpanded ? (
													<ChevronUp className='w-5 h-5 text-gray-400' />
												) : (
													<ChevronDown className='w-5 h-5 text-gray-400' />
												)}
											</div>
										</div>

										<div className='flex items-center space-x-4 text-sm text-gray-500'>
											<div className='flex items-center'>
												<Calendar className='w-4 h-4 mr-1' />
												{deviation.detectedAt.toLocaleDateString('ru-RU')}
											</div>
											{deviation.deltaE && (
												<div>ΔE: {deviation.deltaE.deltaE2000.toFixed(1)}</div>
											)}
										</div>
									</div>

									{isExpanded && (
										<div
											className={`mt-4 p-4 rounded-lg ${
												isDark ? 'bg-gray-900' : 'bg-gray-50'
											}`}
										>
											<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
												<div>
													<h4
														className={`font-medium mb-2 ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														Исходные значения
													</h4>
													{deviation.originalValues.hex && (
														<div className='flex items-center space-x-2 mb-1'>
															<div
																className='w-4 h-4 rounded border'
																style={{
																	backgroundColor: deviation.originalValues.hex,
																}}
															/>
															<span className='text-sm font-mono'>
																{deviation.originalValues.hex}
															</span>
														</div>
													)}
													{deviation.originalValues.lab && (
														<div className='text-sm text-gray-600'>
															LAB: L={deviation.originalValues.lab.l.toFixed(1)}
															, a={deviation.originalValues.lab.a.toFixed(1)},
															b={deviation.originalValues.lab.b.toFixed(1)}
														</div>
													)}
												</div>

												<div>
													<h4
														className={`font-medium mb-2 ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														Целевые значения
													</h4>
													{deviation.targetValues.hex && (
														<div className='flex items-center space-x-2 mb-1'>
															<div
																className='w-4 h-4 rounded border'
																style={{
																	backgroundColor: deviation.targetValues.hex,
																}}
															/>
															<span className='text-sm font-mono'>
																{deviation.targetValues.hex}
															</span>
														</div>
													)}
													{deviation.targetValues.lab && (
														<div className='text-sm text-gray-600'>
															LAB: L={deviation.targetValues.lab.l.toFixed(1)},
															a={deviation.targetValues.lab.a.toFixed(1)}, b=
															{deviation.targetValues.lab.b.toFixed(1)}
														</div>
													)}
												</div>
											</div>

											{/* Координаты эталона и текущего образца */}
											{(deviation.referenceCoordinates ||
												deviation.currentCoordinates) && (
												<div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
													{deviation.referenceCoordinates && (
														<div>
															<h4
																className={`font-medium mb-2 ${
																	isDark ? 'text-white' : 'text-gray-900'
																}`}
															>
																Координаты эталона (LAB)
															</h4>
															<div className='text-sm text-gray-600'>
																L*={deviation.referenceCoordinates.l.toFixed(2)}
																, a*=
																{deviation.referenceCoordinates.a.toFixed(2)},
																b*={deviation.referenceCoordinates.b.toFixed(2)}
															</div>
														</div>
													)}

													{deviation.currentCoordinates && (
														<div>
															<h4
																className={`font-medium mb-2 ${
																	isDark ? 'text-white' : 'text-gray-900'
																}`}
															>
																Координаты текущего образца (LAB)
															</h4>
															<div className='text-sm text-gray-600'>
																L*={deviation.currentCoordinates.l.toFixed(2)},
																a*={deviation.currentCoordinates.a.toFixed(2)},
																b*={deviation.currentCoordinates.b.toFixed(2)}
															</div>
														</div>
													)}
												</div>
											)}

											{deviationCorrections.length > 0 && (
												<div className='mt-4'>
													<h4
														className={`font-medium mb-2 ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														Примененные корректировки
													</h4>
													{deviationCorrections.map(correction => (
														<div
															key={correction.id}
															className={`p-3 rounded border ${
																isDark
																	? 'bg-gray-800 border-gray-700'
																	: 'bg-white border-gray-200'
															} mb-2`}
														>
															<div className='flex items-center justify-between mb-2'>
																<span className='text-sm font-medium'>
																	{correction.correctionType ===
																	'recipe_adjustment'
																		? 'Корректировка рецептуры'
																		: correction.correctionType ===
																		  'color_replacement'
																		? 'Замена цвета'
																		: correction.correctionType ===
																		  'process_change'
																		? 'Изменение процесса'
																		: 'Настройка параметров'}
																</span>
																{correction.effectivenessRating && (
																	<div className='flex items-center'>
																		{[...Array(5)].map((_, i) => (
																			<span
																				key={i}
																				className={`text-sm ${
																					i < correction.effectivenessRating!
																						? 'text-yellow-400'
																						: 'text-gray-300'
																				}`}
																			>
																				★
																			</span>
																		))}
																	</div>
																)}
															</div>
															<div className='text-sm text-gray-600'>
																{correction.correctionData.adjustments.join(
																	', '
																)}
															</div>
															{correction.verificationResults && (
																<div className='text-sm text-green-600 mt-1'>
																	Улучшение ΔE: -
																	{correction.verificationResults.deltaEImprovement.toFixed(
																		1
																	)}
																</div>
															)}
														</div>
													))}
												</div>
											)}
										</div>
									)}
								</div>
							)
						})
					)}
				</div>
			</div>

			{/* Модальное окно для создания нового отклонения */}
			<NewDeviationModal
				isOpen={isNewDeviationModalOpen}
				onClose={() => setIsNewDeviationModalOpen(false)}
				onSave={handleNewDeviation}
			/>
		</>
	)
}

export default DeviationLog
