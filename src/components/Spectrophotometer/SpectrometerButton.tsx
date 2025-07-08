import React from 'react'
import { Beaker } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

const SpectrometerButton: React.FC = () => {
	const { isDark } = useTheme()

	return (
		<div className='space-y-3'>
			<div
				className={`flex items-center justify-between p-3 rounded-lg border ${
					isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
				}`}
			>
				<div className='flex items-center gap-3'>
					<div className='w-3 h-3 rounded-full bg-gray-400' />
					<div>
						<div
							className={`font-medium ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							Спектрофотометр отключен
						</div>
						<div
							className={`text-sm ${
								isDark ? 'text-gray-400' : 'text-gray-600'
							}`}
						>
							Функциональность временно недоступна
						</div>
					</div>
				</div>
				<Beaker className='w-5 h-5 text-gray-400' />
			</div>

			<div
				className={`p-3 rounded-lg border ${
					isDark ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'
				}`}
			>
				<div
					className={`text-sm font-medium mb-2 ${
						isDark ? 'text-white' : 'text-blue-900'
					}`}
				>
					Информация:
				</div>
				<div
					className={`text-sm ${
						isDark ? 'text-gray-300' : 'text-blue-800'
					}`}
				>
					Функциональность спектрофотометра была отключена для упрощения системы. 
					Для работы с цветами используйте ручной ввод или загрузку изображений.
				</div>
			</div>
		</div>
	)
}

export default SpectrometerButton
