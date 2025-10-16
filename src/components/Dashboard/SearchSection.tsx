import { Search } from 'lucide-react'
import { Button } from '@components/ui/Button/Button'
import { useTheme } from '@contexts/ThemeContext'

interface SearchSectionProps {
	searchTerm: string
	setSearchTerm: (term: string) => void
	onRecipeSearch: () => void
	onLABSearch: () => void
	onResetSearch: () => void
	onToggleTasks: () => void
	isSearchActive: boolean
	showOnlyWithTasks: boolean
}

export const SearchSection = ({
	searchTerm,
	setSearchTerm,
	onRecipeSearch,
	onLABSearch,
	onResetSearch,
	onToggleTasks,
	isSearchActive,
	showOnlyWithTasks,
}: SearchSectionProps) => {
	const { isDark } = useTheme()

	return (
		<div className="group">
			<div className="flex items-center gap-3 mb-4">
				<div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/40' : 'bg-gray-100/40'}`}>
					<Search className="w-4 h-4" />
				</div>
				<h3 className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
					Поиск
				</h3>
			</div>
			<div className='relative'>
				<input
					type='text'
					placeholder='Поиск цветов...'
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className={`w-full px-4 py-3 pl-12 rounded-xl transition-all duration-200 text-sm ${
						isDark
							? 'bg-gray-800/50 text-gray-200 placeholder-gray-400 border-gray-700 focus:bg-gray-800/80 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							: 'bg-gray-50/50 text-gray-900 placeholder-gray-500 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
					} border outline-none`}
				/>
				<Search className='absolute left-4 top-3.5 w-4 h-4 text-gray-400' />
			</div>
			
			<div className='space-y-2 mt-4'>
				<Button
					className='w-full justify-start text-sm'
					variant='secondary'
					leftIcon={<Search className='w-4 h-4' />}
					onClick={onRecipeSearch}
					size="sm"
				>
					Поиск по рецепту
				</Button>
				<Button
					className='w-full justify-start text-sm'
					variant='secondary'
					leftIcon={<Search className='w-4 h-4' />}
					onClick={onLABSearch}
					size="sm"
				>
					Поиск похожих цветов
				</Button>
				{isSearchActive && (
					<Button
						className='w-full justify-start text-sm'
						variant='secondary'
						onClick={onResetSearch}
						size="sm"
					>
						Сбросить поиск
					</Button>
				)}
				<Button
					className='w-full justify-start text-sm'
					variant={showOnlyWithTasks ? 'primary' : 'secondary'}
					leftIcon={<Search className='w-4 h-4' />}
					onClick={onToggleTasks}
					size="sm"
				>
					{showOnlyWithTasks ? 'Показать все' : 'Только с задачами'}
				</Button>
			</div>
		</div>
	)
}
