import { Dialog } from '@headlessui/react'
import { X } from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { Button } from '@components/ui/Button/Button'
import { useState } from 'react'

interface LABSearchModalProps {
	isOpen: boolean
	onClose: () => void
	onSearch: (lab: { l: number; a: number; b: number }) => void
}

export default function LABSearchModal({
	isOpen,
	onClose,
	onSearch,
}: LABSearchModalProps) {
	const { isDark } = useTheme()
	const [l, setL] = useState('')
	const [a, setA] = useState('')
	const [b, setB] = useState('')

	const handleSearch = () => {
		const labValues = {
			l: parseFloat(l),
			a: parseFloat(a),
			b: parseFloat(b),
		}

		if (isNaN(labValues.l) || isNaN(labValues.a) || isNaN(labValues.b)) {
			return
		}

		onSearch(labValues)
		onClose()
	}

	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div
				className='fixed inset-0 bg-black/50 backdrop-blur-sm'
				aria-hidden='true'
			/>
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel
					className={`mx-auto max-w-md w-full rounded-xl p-6 shadow-xl ${
						isDark ? 'bg-gray-800' : 'bg-white'
					} max-h-[90vh] overflow-y-auto`}
				>
					<div className='flex justify-between items-start mb-6'>
						<Dialog.Title
							className={`text-xl font-bold ${
								isDark ? 'text-gray-100' : 'text-gray-900'
							}`}
						>
							Поиск по LAB координатам
						</Dialog.Title>
						<button
							onClick={onClose}
							className={`p-2 rounded-lg transition-colors ${
								isDark
									? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
									: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
							}`}
						>
							<X className='w-5 h-5' />
						</button>
					</div>

					<div className='space-y-4'>
						<div>
							<label
								className={`block text-sm font-medium mb-1 ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								L (Светлота)
							</label>
							<input
								type='number'
								value={l}
								onChange={e => setL(e.target.value)}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-gray-100'
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								step='0.01'
							/>
						</div>

						<div>
							<label
								className={`block text-sm font-medium mb-1 ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								a (Красный-Зеленый)
							</label>
							<input
								type='number'
								value={a}
								onChange={e => setA(e.target.value)}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-gray-100'
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								step='0.01'
							/>
						</div>

						<div>
							<label
								className={`block text-sm font-medium mb-1 ${
									isDark ? 'text-gray-300' : 'text-gray-700'
								}`}
							>
								b (Желтый-Синий)
							</label>
							<input
								type='number'
								value={b}
								onChange={e => setB(e.target.value)}
								className={`w-full px-3 py-2 rounded-lg border ${
									isDark
										? 'bg-gray-700 border-gray-600 text-gray-100'
										: 'bg-white border-gray-300 text-gray-900'
								}`}
								step='0.01'
							/>
						</div>

						<Button onClick={handleSearch} className='w-full'>
							Найти похожие цвета
						</Button>
					</div>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
