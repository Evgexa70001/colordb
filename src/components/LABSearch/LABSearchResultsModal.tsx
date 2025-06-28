import { Dialog } from '@headlessui/react'
import { X, Search } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { Button } from '@components/ui/Button/Button'
import { useState } from 'react'
import { hexToLab, calculateDeltaE, calculateDeltaE76 } from '@utils/colorUtils'
import type { PantoneColor } from '@/types'
import toast from 'react-hot-toast'
import SimilarColorCard from '../ColorDetails/SimilarColorCard'

interface LABSearchResultsModalProps {
	isOpen: boolean
	onClose: () => void
	colors: PantoneColor[]
	onColorSelect?: (color: PantoneColor) => void
}

export default function LABSearchResultsModal({
	isOpen,
	onClose,
	colors,
	onColorSelect,
}: LABSearchResultsModalProps) {
	const { isDark } = useTheme()
	const [l, setL] = useState('')
	const [a, setA] = useState('')
	const [b, setB] = useState('')
	const [searchResults, setSearchResults] = useState<
		(PantoneColor & {
			distance: {
				deltaE2000: number
				deltaE76: number
			}
		})[]
	>([])
	const [isSearchActive, setIsSearchActive] = useState(false)

	// Функция для вычисления расстояния от LAB координат
	const getLabDistance = (
		searchLab: { l: number; a: number; b: number },
		colorLab: { l: number; a: number; b: number }
	): { deltaE2000: number; deltaE76: number } => {
		const deltaE2000 = calculateDeltaE(searchLab, colorLab)
		const deltaE76 = calculateDeltaE76(searchLab, colorLab)
		return { deltaE2000, deltaE76 }
	}

	const handleSearch = () => {
		const lValue = parseFloat(l)
		const aValue = parseFloat(a)
		const bValue = parseFloat(b)

		if (isNaN(lValue) || isNaN(aValue) || isNaN(bValue)) {
			toast.error('Введите корректные LAB координаты')
			return
		}

		const searchLab = { l: lValue, a: aValue, b: bValue }
		const LAB_TOLERANCE = 10

		const results = colors
			.map(color => {
				// Используем сохраненные LAB координаты, если они есть, иначе конвертируем из HEX
				const colorLab = color.labValues || hexToLab(color.hex)
				const distance = getLabDistance(searchLab, colorLab)

				return {
					...color,
					distance,
				}
			})
			.filter(color => color.distance.deltaE2000 <= LAB_TOLERANCE)
			.sort((a, b) => a.distance.deltaE2000 - b.distance.deltaE2000)
			.slice(0, 20) // Показываем до 20 результатов

		setSearchResults(results)
		setIsSearchActive(true)
		toast.success(`Найдено ${results.length} похожих цветов`)
	}

	const resetSearch = () => {
		setIsSearchActive(false)
		setSearchResults([])
		setL('')
		setA('')
		setB('')
	}

	const handleClose = () => {
		resetSearch()
		onClose()
	}

	return (
		<Dialog open={isOpen} onClose={handleClose} className='relative z-50'>
			<div
				className='fixed inset-0 bg-black/50 backdrop-blur-sm'
				aria-hidden='true'
			/>
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel
					className={`mx-auto max-w-5xl w-full rounded-xl p-6 shadow-xl ${
						isDark ? 'bg-gray-800' : 'bg-white'
					} max-h-[90vh] overflow-y-auto`}
				>
					<div className='flex justify-between items-start mb-6'>
						<Dialog.Title
							className={`text-xl font-bold ${
								isDark ? 'text-gray-100' : 'text-gray-900'
							}`}
						>
							Поиск цветов по LAB координатам
						</Dialog.Title>
						<button
							onClick={handleClose}
							className={`p-2 rounded-lg transition-colors ${
								isDark
									? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
									: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
							}`}
						>
							<X className='w-5 h-5' />
						</button>
					</div>

					{/* Форма поиска */}
					<div
						className={`p-4 rounded-xl mb-6 ${
							isDark
								? 'bg-blue-900/20 border-blue-800/30'
								: 'bg-blue-50/80 border-blue-200'
						} border`}
					>
						<div className='flex items-center gap-3 mb-4'>
							<Search
								className={`w-5 h-5 ${
									isDark ? 'text-blue-400' : 'text-blue-600'
								}`}
							/>
							<h3
								className={`text-lg font-semibold ${
									isDark ? 'text-blue-300' : 'text-blue-700'
								}`}
							>
								Введите LAB координаты
							</h3>
						</div>

						<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-blue-300' : 'text-blue-700'
									}`}
								>
									L (Светлота) 0-100
								</label>
								<input
									type='number'
									value={l}
									onChange={e => setL(e.target.value)}
									placeholder='50'
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									} focus:outline-none focus:ring-2 focus:ring-blue-500`}
									step='0.01'
								/>
							</div>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-blue-300' : 'text-blue-700'
									}`}
								>
									a (Красный-Зеленый) -128 до +127
								</label>
								<input
									type='number'
									value={a}
									onChange={e => setA(e.target.value)}
									placeholder='0'
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									} focus:outline-none focus:ring-2 focus:ring-blue-500`}
									step='0.01'
								/>
							</div>
							<div>
								<label
									className={`block text-sm font-medium mb-2 ${
										isDark ? 'text-blue-300' : 'text-blue-700'
									}`}
								>
									b (Желтый-Синий) -128 до +127
								</label>
								<input
									type='number'
									value={b}
									onChange={e => setB(e.target.value)}
									placeholder='0'
									className={`w-full px-3 py-2 rounded-lg border ${
										isDark
											? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
											: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
									} focus:outline-none focus:ring-2 focus:ring-blue-500`}
									step='0.01'
								/>
							</div>
						</div>

						<div className='flex gap-3'>
							<Button
								onClick={handleSearch}
								leftIcon={<Search className='w-4 h-4' />}
							>
								Найти похожие цвета
							</Button>

							{isSearchActive && (
								<Button variant='secondary' onClick={resetSearch}>
									Сбросить поиск
								</Button>
							)}
						</div>
					</div>

					{/* Результаты поиска */}
					{isSearchActive && (
						<div>
							<h3
								className={`text-lg font-semibold mb-4 ${
									isDark ? 'text-gray-200' : 'text-gray-800'
								}`}
							>
								Результаты поиска ({searchResults.length} цветов)
							</h3>

							{searchResults.length > 0 ? (
								<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
									{searchResults.map(color => (
										<div
											key={color.id}
											onClick={() => onColorSelect?.(color)}
											className='cursor-pointer'
										>
											<SimilarColorCard color={color} />
										</div>
									))}
								</div>
							) : (
								<p
									className={`text-center py-8 ${
										isDark ? 'text-gray-400' : 'text-gray-600'
									}`}
								>
									По указанным LAB координатам похожих цветов не найдено
								</p>
							)}
						</div>
					)}
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
