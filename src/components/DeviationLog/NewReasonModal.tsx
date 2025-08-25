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
		technicalCardNumber: '',
		description: '',
		lab: { l: '', a: '', b: '' } as { l: string | number; a: string | number; b: string | number },
		productionNotes: '',
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
				description: formData.description.trim(), // Причина создания
				createdBy: user.uid,
				createdAt: new Date(),
				status: 'proposed',
				technicalCardNumber: formData.technicalCardNumber.trim() || undefined,
				technicalRequirements: (() => {
					const hasLab = formData.lab.l !== '' || formData.lab.a !== '' || formData.lab.b !== ''
					const techReq: any = {}
					if (hasLab) {
						techReq.achievedColorValues = {
							lab: {
								l: Number(formData.lab.l) || 0,
								a: Number(formData.lab.a) || 0,
								b: Number(formData.lab.b) || 0,
							},
						}
					}
					const notes = formData.productionNotes.trim()
					if (notes) {
						techReq.productionNotes = notes
					}
					return Object.keys(techReq).length ? techReq : undefined
				})(),
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
			technicalCardNumber: '',
			description: '',
			lab: { l: '', a: '', b: '' },
			productionNotes: '',
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

				<form onSubmit={handleSubmit} noValidate className='p-6 space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div>
							<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
								Название цвета *
							</label>
							<input
								type='text'
								value={formData.colorName}
								onChange={e => setFormData(prev => ({ ...prev, colorName: e.target.value }))}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='Введите название цвета'
								required
							/>
						</div>

						<div>
							<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
								Номер тех. карты
							</label>
							<input
								type='text'
								value={formData.technicalCardNumber}
								onChange={e => setFormData(prev => ({ ...prev, technicalCardNumber: e.target.value }))}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='Напр., ТК-1234'
							/>
						</div>
					</div>

					<div>
						<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							Причина создания *
						</label>
						<textarea
							value={formData.description}
							onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
							rows={3}
							className={`w-full px-3 py-2 rounded-lg border ${
								isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
							} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
							placeholder='Опишите, зачем требуется новый цвет'
							required
						/>
					</div>

					<div className='grid grid-cols-3 gap-4'>
						<div>
							<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>L</label>
							<input
								type='number'
								step='0.1'
								value={formData.lab.l}
								onChange={e => setFormData(prev => ({ ...prev, lab: { ...prev.lab, l: e.target.value } }))}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='L'
							/>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>a</label>
							<input
								type='number'
								step='0.1'
								value={formData.lab.a}
								onChange={e => setFormData(prev => ({ ...prev, lab: { ...prev.lab, a: e.target.value } }))}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='a'
							/>
						</div>
						<div>
							<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>b</label>
							<input
								type='number'
								step='0.1'
								value={formData.lab.b}
								onChange={e => setFormData(prev => ({ ...prev, lab: { ...prev.lab, b: e.target.value } }))}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
								} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
								placeholder='b'
							/>
						</div>
					</div>

					<div>
						<label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
							Заметки о процессе создания (необязательно)
						</label>
						<textarea
							value={formData.productionNotes}
							onChange={e => setFormData(prev => ({ ...prev, productionNotes: e.target.value }))}
							rows={3}
							required={false}
							className={`w-full px-3 py-2 rounded-lg border ${
								isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
							} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
							placeholder='Опишите важные моменты процесса'
						/>
					</div>

					<div className='flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700'>
						<Button type='button' onClick={handleClose} variant='outline' className='px-6'>
							Отмена
						</Button>
						<Button type='submit' disabled={loading} className='px-6 bg-yellow-500 hover:bg-yellow-600 text-white'>
							{loading ? 'Сохранение...' : 'Сохранить'}
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default NewReasonModal
