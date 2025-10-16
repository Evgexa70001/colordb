import { useEffect } from 'react'
import { useTheme } from '@contexts/ThemeContext'
import { useAuth } from '@contexts/AuthContext'
import { SearchSection } from './SearchSection'
import { AdminToolsSection } from './AdminToolsSection'
import { FiltersSection } from './FiltersSection'
import type { SortField, SortOrder, VerificationFilter } from '@/types/dashboard'

interface DashboardSidebarProps {
	isSidebarOpen: boolean
	setSidebarOpen: (open: boolean) => void
	searchTerm: string
	setSearchTerm: (term: string) => void
	categories: string[]
	selectedCategory: string
	setSelectedCategory: (category: string) => void
	verificationFilter: VerificationFilter
	setVerificationFilter: (filter: VerificationFilter) => void
	sortField: SortField
	sortOrder: SortOrder
	onSortChange: (field: SortField) => void
	onDeleteCategory: (category: string) => void
	isCategoryDropdownOpen: boolean
	setIsCategoryDropdownOpen: (open: boolean) => void
	isVerificationDropdownOpen: boolean
	setIsVerificationDropdownOpen: (open: boolean) => void
	onRecipeSearch: () => void
	onLABSearch: () => void
	onResetSearch: () => void
	onToggleTasks: () => void
	onAddColor: () => void
	onAddCategory: () => void
	onAnalytics: () => void
	onToggleLinking: () => void
	onResetCounts: () => void
	onPrint: () => void
	onToggleComparison: () => void
	onCategoryInfo: () => void
	isSearchActive: boolean
	showOnlyWithTasks: boolean
	isLinkingMode: boolean
	isComparisonMode: boolean
}

export const DashboardSidebar = ({
	isSidebarOpen,
	setSidebarOpen,
	searchTerm,
	setSearchTerm,
	categories,
	selectedCategory,
	setSelectedCategory,
	verificationFilter,
	setVerificationFilter,
	sortField,
	sortOrder,
	onSortChange,
	onDeleteCategory,
	isCategoryDropdownOpen,
	setIsCategoryDropdownOpen,
	isVerificationDropdownOpen,
	setIsVerificationDropdownOpen,
	onRecipeSearch,
	onLABSearch,
	onResetSearch,
	onToggleTasks,
	onAddColor,
	onAddCategory,
	onAnalytics,
	onToggleLinking,
	onResetCounts,
	onPrint,
	onToggleComparison,
	onCategoryInfo,
	isSearchActive,
	showOnlyWithTasks,
	isLinkingMode,
	isComparisonMode,
}: DashboardSidebarProps) => {
	const { isDark } = useTheme()
	const { user } = useAuth()

	// Обработчик клика вне сайдбара
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const sidebar = document.getElementById('sidebar')
			if (sidebar && !sidebar.contains(event.target as Node)) {
				setSidebarOpen(false)
			}
		}

		if (isSidebarOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isSidebarOpen, setSidebarOpen])

	return (
		<>
			{/* Sidebar */}
			<aside
				id='sidebar'
				className={`fixed left-0 z-40 w-80 transform transition-all duration-300 ease-in-out ${
					isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} lg:translate-x-0 ${
					isDark
						? 'bg-gray-900/95 backdrop-blur-xl border-gray-800/50'
						: 'bg-white/95 backdrop-blur-xl border-gray-200/50'
				} border-r top-32 lg:top-16 bottom-0 shadow-xl`}
			>
				<div className='h-full flex flex-col'>
					<div className='flex-1 overflow-y-auto py-6 px-4 space-y-6'>
						{/* Поиск */}
						<SearchSection
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							onRecipeSearch={onRecipeSearch}
							onLABSearch={onLABSearch}
							onResetSearch={onResetSearch}
							onToggleTasks={onToggleTasks}
							isSearchActive={isSearchActive}
							showOnlyWithTasks={showOnlyWithTasks}
						/>

						{/* Админские функции */}
						<AdminToolsSection
							user={user}
							onAddColor={onAddColor}
							onAddCategory={onAddCategory}
							onAnalytics={onAnalytics}
							onToggleLinking={onToggleLinking}
							onResetCounts={onResetCounts}
							onPrint={onPrint}
							onToggleComparison={onToggleComparison}
							onCategoryInfo={onCategoryInfo}
							isLinkingMode={isLinkingMode}
							isComparisonMode={isComparisonMode}
						/>

						{/* Фильтры */}
						<FiltersSection
							categories={categories}
							selectedCategory={selectedCategory}
							setSelectedCategory={setSelectedCategory}
							verificationFilter={verificationFilter}
							setVerificationFilter={setVerificationFilter}
							sortField={sortField}
							sortOrder={sortOrder}
							onSortChange={onSortChange}
							onDeleteCategory={onDeleteCategory}
							user={user}
							isCategoryDropdownOpen={isCategoryDropdownOpen}
							setIsCategoryDropdownOpen={setIsCategoryDropdownOpen}
							isVerificationDropdownOpen={isVerificationDropdownOpen}
							setIsVerificationDropdownOpen={setIsVerificationDropdownOpen}
						/>

						{/* Убираем кнопку выхода - она есть в Header */}
					</div>
				</div>
			</aside>

			{/* Mobile sidebar overlay */}
			{isSidebarOpen && (
				<div
					className='fixed inset-0 z-30 bg-black/50 lg:hidden'
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</>
	)
}
