import {
	Plus,
	FolderPlus,
	BarChart3,
	Link2,
	RotateCcw,
	Printer,
	GitCompare,
	Info,
} from 'lucide-react'
import { Button } from '@components/ui/Button/Button'
import { useTheme } from '@contexts/ThemeContext'

interface AdminToolsSectionProps {
	user: { isAdmin?: boolean } | null
	onAddColor: () => void
	onAddCategory: () => void
	onAnalytics: () => void
	onToggleLinking: () => void
	onResetCounts: () => void
	onPrint: () => void
	onToggleComparison: () => void
	onCategoryInfo: () => void
	isLinkingMode: boolean
	isComparisonMode: boolean
}

export const AdminToolsSection = ({
	user,
	onAddColor,
	onAddCategory,
	onAnalytics,
	onToggleLinking,
	onResetCounts,
	onPrint,
	onToggleComparison,
	onCategoryInfo,
	isLinkingMode,
	isComparisonMode,
}: AdminToolsSectionProps) => {
	const { isDark } = useTheme()

	if (!user?.isAdmin) return null

	return (
		<>
			{/* Управление */}
			<div className="group">
				<div className="flex items-center gap-3 mb-4">
					<div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/40' : 'bg-gray-100/40'}`}>
						<Plus className="w-4 h-4" />
					</div>
					<h3 className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
						Управление
					</h3>
				</div>
				<div className='space-y-2'>
					<Button
						className='w-full justify-start text-sm'
						leftIcon={<Plus className='w-4 h-4' />}
						onClick={onAddColor}
						size="sm"
					>
						Добавить цвет
					</Button>
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						leftIcon={<FolderPlus className='w-4 h-4' />}
						onClick={onAddCategory}
						size="sm"
					>
						Добавить категорию
					</Button>
				</div>
			</div>

			{/* Инструменты */}
			<div className="group">
				<div className="flex items-center gap-3 mb-4">
					<div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/40' : 'bg-gray-100/40'}`}>
						<BarChart3 className="w-4 h-4" />
					</div>
					<h3 className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
						Инструменты
					</h3>
				</div>
				<div className='space-y-2'>
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						leftIcon={<BarChart3 className='w-4 h-4' />}
						onClick={onAnalytics}
						size="sm"
					>
						Аналитика
					</Button>
					<Button
						variant='secondary'
						leftIcon={<Link2 className='w-4 h-4' />}
						onClick={onToggleLinking}
						className='w-full justify-start text-sm'
						size="sm"
					>
						{isLinkingMode ? 'Отменить связывание' : 'Связать цвета'}
					</Button>
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						leftIcon={<RotateCcw className='w-4 h-4' />}
						onClick={onResetCounts}
						size="sm"
					>
						Сбросить счетчики
					</Button>
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						leftIcon={<Printer className='w-4 h-4' />}
						onClick={onPrint}
						size="sm"
					>
						Печать списка
					</Button>
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						leftIcon={<GitCompare className='w-4 h-4' />}
						onClick={onToggleComparison}
						size="sm"
					>
						{isComparisonMode ? 'Отменить сравнение' : 'Сравнить цвета'}
					</Button>
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						leftIcon={<Info className='w-4 h-4' />}
						onClick={onCategoryInfo}
						size="sm"
					>
						Информация
					</Button>
				</div>
			</div>
		</>
	)
}
