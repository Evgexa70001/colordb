import { useState } from 'react'
import { X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import type { ColorCreationReason } from '@/types'
import { saveColorCreationReason } from '@/lib/deviations'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface NewReasonModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (reason: ColorCreationReason) => void
	colorId?: string
	colorName?: string
}

const NewReasonModal: React.FC<NewReasonModalProps> = ({
	isOpen,
	onClose,
	onSave,
	colorId,
	colorName,
}) => {
	const { isDark } = useTheme()
	const { user } = useAuth()
	const [formData, setFormData] = useState({
		colorId: colorId || '',
		colorName: colorName || '',
		description: '',
		status: 'proposed' as ColorCreationReason['status'],
		technicalRequirements: {
			actualColorAccuracy: undefined as number | undefined,
			actualLightingConditions: [] as string[],
			actualSubstrateCompatibility: [] as string[],
			actualDurabilityRequirements: [] as string[],
			achievedColorValues: {
				lab: { l: 0, a: 0, b: 0 },
			},
			productionNotes: '',
		},
		notes: '',
	})
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!user) {
			toast.error('Необходимо войти в систему')
			return
		}

		if (!formData.colorName.trim() || !formData.description.trim()) {
			toast.error('Заполните обязательные поля')
			return
		}

		try {
			setLoading(true)
			const newReason: Omit<ColorCreationReason, 'id'> = {
				colorId: formData.colorId,
				colorName: formData.colorName.trim(),
				description: formData.description.trim(),
				status: formData.status,
				createdBy: user.uid,
				createdAt: new Date(),
				technicalRequirements:
					formData.technicalRequirements.actualColorAccuracy ||
					formData.technicalRequirements.actualLightingConditions.length > 0 ||
					formData.technicalRequirements.actualSubstrateCompatibility.length >
						0 ||
					formData.technicalRequirements.actualDurabilityRequirements.length >
						0 ||
					formData.technicalRequirements.achievedColorValues.lab.l !== 0 ||
					formData.technicalRequirements.achievedColorValues.lab.a !== 0 ||
					formData.technicalRequirements.achievedColorValues.lab.b !== 0 ||
					formData.technicalRequirements.productionNotes.trim()
						? (() => {
								const techReq: any = {}

								if (formData.technicalRequirements.actualColorAccuracy) {
									techReq.actualColorAccuracy =
										formData.technicalRequirements.actualColorAccuracy
								}

								if (
									formData.technicalRequirements.actualLightingConditions
										.length > 0
								) {
									techReq.actualLightingConditions =
										formData.technicalRequirements.actualLightingConditions
								}

								if (
									formData.technicalRequirements.actualSubstrateCompatibility
										.length > 0
								) {
									techReq.actualSubstrateCompatibility =
										formData.technicalRequirements.actualSubstrateCompatibility
								}

								if (
									formData.technicalRequirements.actualDurabilityRequirements
										.length > 0
								) {
									techReq.actualDurabilityRequirements =
										formData.technicalRequirements.actualDurabilityRequirements
								}

								if (
									formData.technicalRequirements.achievedColorValues.lab.l !==
										0 ||
									formData.technicalRequirements.achievedColorValues.lab.a !==
										0 ||
									formData.technicalRequirements.achievedColorValues.lab.b !== 0
								) {
									techReq.achievedColorValues =
										formData.technicalRequirements.achievedColorValues
								}

								if (formData.technicalRequirements.productionNotes.trim()) {
									techReq.productionNotes =
										formData.technicalRequirements.productionNotes.trim()
								}

								return techReq
						  })()
						: undefined,
				...(formData.notes.trim() ? { notes: formData.notes.trim() } : {}),
			}

			const docRef = await saveColorCreationReason(newReason)
			const savedReason: ColorCreationReason = {
				id: docRef.id,
				...newReason,
				createdAt: new Date(),
			}

			onSave(savedReason)
			onClose()
			resetForm()
		} catch (error) {
			console.error('Error saving reason:', error)
			if (error instanceof Error && error.message !== 'offline') {
				toast.error('Ошибка при сохранении причины')
			}
		} finally {
			setLoading(false)
		}
	}

	const resetForm = () => {
		setFormData({
			colorId: colorId || '',
			colorName: colorName || '',
			description: '',
			status: 'proposed',
			technicalRequirements: {
				actualColorAccuracy: undefined,
				actualLightingConditions: [],
				actualSubstrateCompatibility: [],
				actualDurabilityRequirements: [],
				achievedColorValues: {
					lab: { l: 0, a: 0, b: 0 },
				},
				productionNotes: '',
			},
			notes: '',
		})
	}

	const handleClose = () => {
		resetForm()
		onClose()
	}

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div
				className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg ${
					isDark ? 'bg-gray-800' : 'bg-white'
				}`}
			>
				<div className='p-6 border-b border-gray-200 dark:border-gray-700'>
					<div className='flex items-center justify-between'>
						<h2
							className={`text-xl font-bold ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							Новая причина создания цвета
						</h2>
						<button
							onClick={handleClose}
							className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
						>
							<X className='w-5 h-5 text-gray-500' />
						</button>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='p-6 space-y-6'>
					{/* Основная информация */}
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label
								className={`block text-sm font-medium mb-2 ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								Название цвета *
							</label>
							<input
								type='text'
								value={formData.colorName}
								onChange={e =>
									setFormData(prev => ({ ...prev, colorName: e.target.value }))
								}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-white'
										: 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='Введите название цвета'
								required
							/>
						</div>

						<div>
							<label
								className={`block text-sm font-medium mb-2 ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								Статус
							</label>
							<select
								value={formData.status}
								onChange={e =>
									setFormData(prev => ({
										...prev,
										status: e.target.value as ColorCreationReason['status'],
									}))
								}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-white'
										: 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
							>
								<option value='proposed'>Предложено</option>
								<option value='approved'>Одобрено</option>
								<option value='in_development'>В разработке</option>
								<option value='completed'>Завершено</option>
								<option value='rejected'>Отклонено</option>
							</select>
						</div>
					</div>

					<div>
						<label
							className={`block text-sm font-medium mb-2 ${
								isDark ? 'text-gray-300' : 'text-gray-700'
							}`}
						>
							Описание *
						</label>
						<textarea
							value={formData.description}
							onChange={e =>
								setFormData(prev => ({ ...prev, description: e.target.value }))
							}
							rows={3}
							className={`w-full px-3 py-2 rounded-lg border ${
								isDark
									? 'bg-gray-700 border-gray-600 text-white'
									: 'bg-white border-gray-300 text-gray-900'
							} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
							placeholder='Подробно опишите причину создания цвета'
							required
						/>
					</div>

					{/* Технические требования созданного цвета */}
					<div className='border-t border-gray-200 dark:border-gray-700 pt-6'>
						<h3
							className={`text-lg font-medium mb-4 ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							Технические характеристики созданного цвета (необязательно)
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Фактическая точность цвета (ΔE)
								</label>
								<input
									type='number'
									step='0.1'
									value={
										formData.technicalRequirements.actualColorAccuracy || ''
									}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											technicalRequirements: {
												...prev.technicalRequirements,
												actualColorAccuracy: e.target.value
													? Number(e.target.value)
													: undefined,
											},
										}))
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									placeholder='2.0'
								/>
							</div>

							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Условия освещения при создании
								</label>
								<input
									type='text'
									value={formData.technicalRequirements.actualLightingConditions.join(
										', '
									)}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											technicalRequirements: {
												...prev.technicalRequirements,
												actualLightingConditions: e.target.value
													.split(',')
													.map(s => s.trim())
													.filter(s => s),
											},
										}))
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									placeholder='Дневной свет, флуоресцентный'
								/>
							</div>

							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Материалы, на которых создан цвет
								</label>
								<input
									type='text'
									value={formData.technicalRequirements.actualSubstrateCompatibility.join(
										', '
									)}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											technicalRequirements: {
												...prev.technicalRequirements,
												actualSubstrateCompatibility: e.target.value
													.split(',')
													.map(s => s.trim())
													.filter(s => s),
											},
										}))
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									placeholder='Бумага, картон, пластик'
								/>
							</div>

							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Требования к долговечности созданного цвета
								</label>
								<input
									type='text'
									value={formData.technicalRequirements.actualDurabilityRequirements.join(
										', '
									)}
									onChange={e =>
										setFormData(prev => ({
											...prev,
											technicalRequirements: {
												...prev.technicalRequirements,
												actualDurabilityRequirements: e.target.value
													.split(',')
													.map(s => s.trim())
													.filter(s => s),
											},
										}))
									}
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-white'
											: 'bg-white border-gray-300 text-gray-900'
									} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									placeholder='Устойчивость к УФ, влаге'
								/>
							</div>
						</div>

						{/* Достигнутые значения цвета */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-gray-300' : 'text-gray-700'
									}`}
								>
									Достигнутый цвет (LAB)
								</label>
								<div className='grid grid-cols-3 gap-2'>
									<div>
										<label
											className={`block text-xs font-medium mb-1 ${
												isDark ? 'text-gray-300' : 'text-gray-700'
											}`}
										>
											L
										</label>
										<input
											type='number'
											step='0.1'
											value={
												formData.technicalRequirements.achievedColorValues.lab
													.l === 0
													? ''
													: formData.technicalRequirements.achievedColorValues
															.lab.l
											}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													technicalRequirements: {
														...prev.technicalRequirements,
														achievedColorValues: {
															...prev.technicalRequirements.achievedColorValues,
															lab: {
																...prev.technicalRequirements
																	.achievedColorValues.lab,
																l:
																	e.target.value === ''
																		? 0
																		: Number(e.target.value) || 0,
															},
														},
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
											placeholder='50'
										/>
									</div>
									<div>
										<label
											className={`block text-xs font-medium mb-1 ${
												isDark ? 'text-gray-300' : 'text-gray-700'
											}`}
										>
											a
										</label>
										<input
											type='number'
											step='0.1'
											value={
												formData.technicalRequirements.achievedColorValues.lab
													.a === 0
													? ''
													: formData.technicalRequirements.achievedColorValues
															.lab.a
											}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													technicalRequirements: {
														...prev.technicalRequirements,
														achievedColorValues: {
															...prev.technicalRequirements.achievedColorValues,
															lab: {
																...prev.technicalRequirements
																	.achievedColorValues.lab,
																a:
																	e.target.value === ''
																		? 0
																		: Number(e.target.value) || 0,
															},
														},
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
											placeholder='0'
										/>
									</div>
									<div>
										<label
											className={`block text-xs font-medium mb-1 ${
												isDark ? 'text-gray-300' : 'text-gray-700'
											}`}
										>
											b
										</label>
										<input
											type='number'
											step='0.1'
											value={
												formData.technicalRequirements.achievedColorValues.lab
													.b === 0
													? ''
													: formData.technicalRequirements.achievedColorValues
															.lab.b
											}
											onChange={e =>
												setFormData(prev => ({
													...prev,
													technicalRequirements: {
														...prev.technicalRequirements,
														achievedColorValues: {
															...prev.technicalRequirements.achievedColorValues,
															lab: {
																...prev.technicalRequirements
																	.achievedColorValues.lab,
																b:
																	e.target.value === ''
																		? 0
																		: Number(e.target.value) || 0,
															},
														},
													},
												}))
											}
											className={`w-full px-2 py-1 text-sm rounded border ${
												isDark
													? 'bg-gray-700 border-gray-600 text-white'
													: 'bg-white border-gray-300 text-gray-900'
											} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
											placeholder='0'
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Заметки о производстве */}
						<div>
							<label
								className={`block text-sm font-medium mb-2 ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								Заметки о процессе создания
							</label>
							<textarea
								value={formData.technicalRequirements.productionNotes}
								onChange={e =>
									setFormData(prev => ({
										...prev,
										technicalRequirements: {
											...prev.technicalRequirements,
											productionNotes: e.target.value,
										},
									}))
								}
								rows={3}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-white'
										: 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='Опишите особенности процесса создания цвета, использованные материалы, оборудование и т.д.'
							/>
						</div>
					</div>

					{/* Примечания */}
					<div>
						<label
							className={`block text-sm font-medium mb-2 ${
								isDark ? 'text-gray-300' : 'text-gray-700'
							}`}
						>
							Примечания
						</label>
						<textarea
							value={formData.notes}
							onChange={e =>
								setFormData(prev => ({ ...prev, notes: e.target.value }))
							}
							rows={3}
							className={`w-full px-3 py-2 rounded-lg border ${
								isDark
									? 'bg-gray-700 border-gray-600 text-white'
									: 'bg-white border-gray-300 text-gray-900'
							} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
							placeholder='Дополнительная информация'
						/>
					</div>

					{/* Кнопки */}
					<div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
						<Button
							type='button'
							onClick={handleClose}
							variant='outline'
							className='px-6'
						>
							Отмена
						</Button>
						<Button
							type='submit'
							disabled={loading}
							className='px-6 bg-yellow-500 hover:bg-yellow-600 text-white'
						>
							{loading ? 'Сохранение...' : 'Сохранить'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default NewReasonModal
