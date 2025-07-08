import { useState, useEffect } from 'react'
import {
	Lightbulb,
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
import type { ColorCreationReason } from '@/types'
import {
	getColorCreationReasons,
	getColorCreationReasonsByColor,
	updateColorCreationReason,
	deleteColorCreationReason,
} from '@/lib/deviations'
import toast from 'react-hot-toast'
import NewReasonModal from './NewReasonModal'

interface ColorCreationReasonsProps {
	colorId?: string // Если передан, показываем только причины для конкретного цвета
}

const ColorCreationReasons: React.FC<ColorCreationReasonsProps> = ({
	colorId,
}) => {
	const { isDark } = useTheme()
	const [reasons, setReasons] = useState<ColorCreationReason[]>([])
	const [loading, setLoading] = useState(true)
	const [expandedReason, setExpandedReason] = useState<string | null>(null)
	const [isNewReasonModalOpen, setIsNewReasonModalOpen] = useState(false)
	const [editingStatus, setEditingStatus] = useState<string | null>(null)
	const [filters, setFilters] = useState({
		status: 'all' as
			| 'all'
			| 'proposed'
			| 'approved'
			| 'in_development'
			| 'completed'
			| 'rejected',
	})
	const [searchTerm, setSearchTerm] = useState('')

	useEffect(() => {
		loadReasons()
	}, [colorId, filters])

	const loadReasons = async () => {
		try {
			setLoading(true)
			let reasonsData: ColorCreationReason[]

			if (colorId) {
				// Загружаем причины для конкретного цвета
				reasonsData = await getColorCreationReasonsByColor(colorId)
			} else {
				// Загружаем все причины
				reasonsData = await getColorCreationReasons()
			}

			setReasons(reasonsData)
		} catch (error) {
			console.error('Error loading reasons:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка загрузки причин создания цветов')
			}
		} finally {
			setLoading(false)
		}
	}

	const handleNewReason = (newReason: ColorCreationReason) => {
		setReasons(prev => [newReason, ...prev])
		toast.success('Причина создания цвета добавлена')
	}

	const getStatusIcon = (status: ColorCreationReason['status']) => {
		switch (status) {
			case 'proposed':
				return <AlertCircle className='w-4 h-4 text-blue-500' />
			case 'approved':
				return <CheckCircle className='w-4 h-4 text-green-500' />
			case 'in_development':
				return <Clock className='w-4 h-4 text-yellow-500' />
			case 'completed':
				return <CheckCircle className='w-4 h-4 text-green-600' />
			case 'rejected':
				return <XCircle className='w-4 h-4 text-red-500' />
			default:
				return null
		}
	}

	const handleUpdateStatus = async (
		reasonId: string,
		newStatus: ColorCreationReason['status']
	) => {
		try {
			await updateColorCreationReason(reasonId, { status: newStatus })
			setReasons(prev =>
				prev.map(reason =>
					reason.id === reasonId ? { ...reason, status: newStatus } : reason
				)
			)
			setEditingStatus(null)
			toast.success('Статус причины обновлен')
		} catch (error) {
			console.error('Error updating reason status:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при обновлении статуса')
			}
		}
	}

	const handleDeleteReason = async (reasonId: string) => {
		if (!confirm('Вы уверены, что хотите удалить эту причину?')) {
			return
		}

		try {
			await deleteColorCreationReason(reasonId)
			setReasons(prev => prev.filter(reason => reason.id !== reasonId))
			toast.success('Причина удалена')
		} catch (error) {
			console.error('Error deleting reason:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при удалении причины')
			}
		}
	}

	const filteredReasons = reasons.filter(reason => {
		if (filters.status !== 'all' && reason.status !== filters.status)
			return false
		if (
			searchTerm &&
			!reason.colorName.toLowerCase().includes(searchTerm.toLowerCase()) &&
			!reason.description.toLowerCase().includes(searchTerm.toLowerCase())
		)
			return false
		return true
	})

	const toggleExpandReason = (reasonId: string) => {
		setExpandedReason(expandedReason === reasonId ? null : reasonId)
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
							<Lightbulb className='w-5 h-5 mr-2 text-yellow-500' />
							Причины создания цветов
							{colorId && (
								<span className='ml-2 text-sm font-normal text-gray-500'>
									(для выбранного цвета)
								</span>
							)}
						</h2>
						<Button
							onClick={() => setIsNewReasonModalOpen(true)}
							className='bg-yellow-500 hover:bg-yellow-600 text-white'
						>
							<Plus className='w-4 h-4 mr-2' />
							Новая причина
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
							<option value='proposed'>Предложено</option>
							<option value='approved'>Одобрено</option>
							<option value='in_development'>В разработке</option>
							<option value='completed'>Завершено</option>
							<option value='rejected'>Отклонено</option>
						</select>
					</div>
				</div>

				<div className='divide-y divide-gray-200 dark:divide-gray-700'>
					{filteredReasons.length === 0 ? (
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
								Причины не найдены
							</p>
							<p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
								{searchTerm || filters.status !== 'all'
									? 'Попробуйте изменить фильтры поиска'
									: 'Пока нет зарегистрированных причин создания цветов'}
							</p>
						</div>
					) : (
						filteredReasons.map(reason => {
							const isExpanded = expandedReason === reason.id

							return (
								<div key={reason.id} className='p-6'>
									<div
										className='cursor-pointer'
										onClick={() => toggleExpandReason(reason.id)}
									>
										<div className='flex items-start justify-between mb-3'>
											<div className='flex items-start space-x-3'>
												{getStatusIcon(reason.status)}
												<div>
													<h3
														className={`font-semibold ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														{reason.colorName}
													</h3>
													<p
														className={`text-sm ${
															isDark ? 'text-gray-400' : 'text-gray-600'
														}`}
													>
														{reason.description}
													</p>
												</div>
											</div>
											<div className='flex items-center space-x-2'>
												{/* Управление статусом */}
												<div
													className='flex items-center space-x-2'
													onClick={e => e.stopPropagation()}
												>
													{editingStatus === reason.id ? (
														<>
															<select
																value={reason.status}
																onChange={e =>
																	handleUpdateStatus(
																		reason.id,
																		e.target
																			.value as ColorCreationReason['status']
																	)
																}
																className={`px-2 py-1 text-xs rounded border ${
																	isDark
																		? 'bg-gray-700 border-gray-600 text-white'
																		: 'bg-white border-gray-300 text-gray-900'
																} focus:ring-1 focus:ring-blue-500`}
															>
																<option value='proposed'>Предложено</option>
																<option value='approved'>Одобрено</option>
																<option value='in_development'>
																	В разработке
																</option>
																<option value='completed'>Завершено</option>
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
																onClick={() => setEditingStatus(reason.id)}
																className='p-1 text-gray-400 hover:text-blue-600 transition-colors'
																title='Изменить статус'
															>
																<Edit3 className='w-4 h-4' />
															</button>
															<button
																onClick={() => handleDeleteReason(reason.id)}
																className='p-1 text-gray-400 hover:text-red-600 transition-colors'
																title='Удалить причину'
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
												{reason.createdAt.toLocaleDateString('ru-RU')}
											</div>
										</div>
									</div>

									{isExpanded && (
										<div
											className={`mt-4 p-4 rounded-lg ${
												isDark ? 'bg-gray-900' : 'bg-gray-50'
											}`}
										>
											{/* Технические характеристики созданного цвета */}
											{reason.technicalRequirements && (
												<div className='mb-4'>
													<h4
														className={`font-medium mb-2 ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														Технические характеристики созданного цвета
													</h4>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														{reason.technicalRequirements
															.actualColorAccuracy && (
															<div className='text-sm text-gray-600'>
																Фактическая точность цвета: ΔE ≤{' '}
																{
																	reason.technicalRequirements
																		.actualColorAccuracy
																}
															</div>
														)}
														{reason.technicalRequirements
															.actualLightingConditions && (
															<div className='text-sm text-gray-600'>
																Условия освещения при создании:{' '}
																{reason.technicalRequirements.actualLightingConditions.join(
																	', '
																)}
															</div>
														)}
														{reason.technicalRequirements
															.actualSubstrateCompatibility && (
															<div className='text-sm text-gray-600'>
																Материалы, на которых создан цвет:{' '}
																{reason.technicalRequirements.actualSubstrateCompatibility.join(
																	', '
																)}
															</div>
														)}
														{reason.technicalRequirements
															.actualDurabilityRequirements && (
															<div className='text-sm text-gray-600'>
																Требования к долговечности созданного цвета:{' '}
																{reason.technicalRequirements.actualDurabilityRequirements.join(
																	', '
																)}
															</div>
														)}
														{reason.technicalRequirements.achievedColorValues
															?.lab &&
															(reason.technicalRequirements.achievedColorValues
																.lab.l !== 0 ||
																reason.technicalRequirements.achievedColorValues
																	.lab.a !== 0 ||
																reason.technicalRequirements.achievedColorValues
																	.lab.b !== 0) && (
																<div className='text-sm text-gray-600'>
																	Достигнутый цвет (LAB):{' '}
																	<span className='font-mono'>
																		L:{' '}
																		{reason.technicalRequirements.achievedColorValues.lab.l.toFixed(
																			1
																		)}
																		, a:{' '}
																		{reason.technicalRequirements.achievedColorValues.lab.a.toFixed(
																			1
																		)}
																		, b:{' '}
																		{reason.technicalRequirements.achievedColorValues.lab.b.toFixed(
																			1
																		)}
																	</span>
																</div>
															)}
														{reason.technicalRequirements.productionNotes && (
															<div className='text-sm text-gray-600 col-span-2'>
																Заметки о процессе создания:{' '}
																{reason.technicalRequirements.productionNotes}
															</div>
														)}
													</div>
												</div>
											)}

											{/* Дополнительная информация */}
											{reason.notes && (
												<div className='mb-4'>
													<h4
														className={`font-medium mb-2 ${
															isDark ? 'text-white' : 'text-gray-900'
														}`}
													>
														Примечания
													</h4>
													<p className='text-sm text-gray-600'>
														{reason.notes}
													</p>
												</div>
											)}

											{/* Даты */}
											<div className='text-sm text-gray-500'>
												{reason.approvedAt && (
													<div>
														Одобрено:{' '}
														{reason.approvedAt.toLocaleDateString('ru-RU')}
													</div>
												)}
												{reason.completionDate && (
													<div>
														Завершено:{' '}
														{reason.completionDate.toLocaleDateString('ru-RU')}
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							)
						})
					)}
				</div>
			</div>

			{/* Модальное окно для создания новой причины */}
			<NewReasonModal
				isOpen={isNewReasonModalOpen}
				onClose={() => setIsNewReasonModalOpen(false)}
				onSave={handleNewReason}
			/>
		</>
	)
}

export default ColorCreationReasons
