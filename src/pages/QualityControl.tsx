import { AlertTriangle, Lightbulb, ClipboardCheck } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import DeviationLog from '@/components/DeviationLog/DeviationLog'
import ColorCreationReasons from '@/components/DeviationLog/ColorCreationReasons'
import IncomingControl from '@/components/QualityControl/IncomingControl'
import { useState } from 'react'

const QualityControl: React.FC = () => {
	const { isDark } = useTheme()
	const [activeTab, setActiveTab] = useState<
		'deviations' | 'reasons' | 'incoming'
	>('deviations')

	return (
		<div className='space-y-4 md:space-y-6'>
			{/* Заголовок страницы */}
			<div
				className={`p-4 md:p-6 rounded-xl border ${
					isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
				} shadow-sm`}
			>
				<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0'>
					<div>
						<h1
							className={`text-xl md:text-2xl font-bold flex items-center ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							<AlertTriangle className='w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-orange-500' />
							Контроль качества
						</h1>
						<p className={`mt-2 text-sm md:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
							Управление отклонениями и причинами создания цветов
						</p>
					</div>
					<div className='flex items-center space-x-3'>
						<div
							className={`px-3 py-1 rounded-lg text-xs md:text-sm ${
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

			{/* Вкладки */}
			<div
				className={`rounded-xl border ${
					isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
				} shadow-sm`}
			>
				<div className='border-b border-gray-200 dark:border-gray-700'>
					<div className='flex flex-col sm:flex-row'>
						<button
							onClick={() => setActiveTab('deviations')}
							className={`flex items-center justify-center sm:justify-start px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 sm:border-b-2 sm:border-r-0 transition-colors ${
								activeTab === 'deviations'
									? 'border-orange-500 text-orange-600 dark:text-orange-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
						>
							<AlertTriangle className='w-4 h-4 mr-2' />
							<span className='whitespace-nowrap'>Журнал отклонений</span>
						</button>
						<button
							onClick={() => setActiveTab('reasons')}
							className={`flex items-center justify-center sm:justify-start px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 sm:border-b-2 sm:border-r-0 transition-colors ${
								activeTab === 'reasons'
									? 'border-yellow-500 text-yellow-600 dark:text-yellow-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
						>
							<Lightbulb className='w-4 h-4 mr-2' />
							<span className='whitespace-nowrap'>Причины создания цветов</span>
						</button>
						<button
							onClick={() => setActiveTab('incoming')}
							className={`flex items-center justify-center sm:justify-start px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium border-b-2 sm:border-b-2 sm:border-r-0 transition-colors ${
								activeTab === 'incoming'
									? 'border-blue-500 text-blue-600 dark:text-blue-400'
									: 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
							}`}
						>
							<ClipboardCheck className='w-4 h-4 mr-2' />
							<span className='whitespace-nowrap'>Входной контроль</span>
						</button>
					</div>
				</div>

				<div className='p-4 md:p-6'>
					{activeTab === 'deviations' ? (
						<DeviationLog />
					) : activeTab === 'reasons' ? (
						<ColorCreationReasons />
					) : (
						<IncomingControl />
					)}
				</div>
			</div>
		</div>
	)
}

export default QualityControl
