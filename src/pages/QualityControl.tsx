import { AlertTriangle } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import DeviationLog from '@/components/DeviationLog/DeviationLog'

const QualityControl: React.FC = () => {
	const { isDark } = useTheme()

	return (
		<div className='space-y-6'>
			{/* Заголовок страницы */}
			<div
				className={`p-6 rounded-xl border ${
					isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
				} shadow-sm`}
			>
				<div className='flex items-center justify-between'>
					<div>
						<h1
							className={`text-2xl font-bold flex items-center ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							<AlertTriangle className='w-6 h-6 mr-3 text-orange-500' />
							Журнал отклонений
						</h1>
						<p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
							Управление отклонениями и корректировками цветов
						</p>
					</div>
					<div className='flex items-center space-x-3'>
						<div
							className={`px-3 py-1 rounded-lg text-sm ${
								isDark
									? 'bg-green-900/30 text-green-400'
									: 'bg-green-100 text-green-700'
							}`}
						>
							Система активна
						</div>
					</div>
				</div>
			</div>

			{/* Журнал отклонений */}
			<DeviationLog />
		</div>
	)
}

export default QualityControl
