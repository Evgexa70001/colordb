import { useRef } from 'react'
import { useTheme } from '@contexts/ThemeContext'
// import { useAuth } from '@contexts/AuthContext'
import type { PantoneColor } from '@/types'
import type { AnalyticsDashboardRef } from '@components/Analytics/AnalyticsDashboard'
import Header from '@components/Header'
import { DashboardSidebar } from './Dashboard/DashboardSidebar'
import { DashboardColorGrid } from './Dashboard/DashboardColorGrid'
import { ComparisonModeIndicator } from './Dashboard/ComparisonModeIndicator'
import { DashboardModals } from './Dashboard/DashboardModals'
import { useDashboardState } from './Dashboard/hooks/useDashboardState'
import { useDashboardData } from './Dashboard/hooks/useDashboardData'
import { useDashboardFilters } from './Dashboard/hooks/useDashboardFilters'
import { useDashboardActions } from './Dashboard/hooks/useDashboardActions'
import toast from 'react-hot-toast'

export default function Dashboard() {
	const { isDark } = useTheme()
	// const { user } = useAuth()
	const analyticsDashboardRef = useRef<AnalyticsDashboardRef | null>(null)

	// Состояние
	const state = useDashboardState()

	// Загрузка данных
	const { loadData } = useDashboardData({
		setColors: state.setColors,
		setCategories: state.setCategories,
		setIsLoading: state.setIsLoading,
	})

	// Фильтрация и поиск
	const {
		filteredColors,
		paginatedColors,
		totalPages,
		handleRecipeSearch,
		handleLABSearch,
	} = useDashboardFilters({
		colors: state.colors,
		searchTerm: state.searchTerm,
		selectedCategory: state.selectedCategory,
		sortField: state.sortField,
		sortOrder: state.sortOrder,
		verificationFilter: state.verificationFilter,
		showOnlyWithTasks: state.showOnlyWithTasks,
		isSearchActive: state.isSearchActive,
		searchResults: state.searchResults,
		currentPage: state.currentPage,
		setCurrentPage: state.setCurrentPage,
	})

	// Действия
	const actions = useDashboardActions({
		loadData,
		setColors: state.setColors,
		setIsNewColorModalOpen: state.setIsNewColorModalOpen,
		setIsEditModalOpen: state.setIsEditModalOpen,
		setSelectedColor: state.setSelectedColor,
		setIsNewCategoryModalOpen: state.setIsNewCategoryModalOpen,
		setIsLinkingMode: state.setIsLinkingMode,
		setSelectedForLink: state.setSelectedForLink,
		setIsSearchActive: state.setIsSearchActive,
		setSearchResults: state.setSearchResults,
		setIsComparisonMode: state.setIsComparisonMode,
		setSelectedColorsForComparison: state.setSelectedColorsForComparison,
		setIsComparisonModalOpen: state.setIsComparisonModalOpen,
		setShowPrintPreview: state.setShowPrintPreview,
		searchResults: state.searchResults,
		isSearchActive: state.isSearchActive,
		analyticsDashboardRef,
	})

	// Обработчики для сайдбара
	const handleSortChange = (field: typeof state.sortField) => {
		if (field === state.sortField) {
			state.setSortOrder(state.sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			state.setSortField(field)
			state.setSortOrder('asc')
		}
	}

	const handleRecipeSearchWrapper = (recipe: { items: Array<{ paint: string; amount: number }> }) => {
		const results = handleRecipeSearch(recipe)
		state.setSearchResults(results)
		state.setIsSearchActive(true)
		toast.success(`Найдено ${results.length} похожих рецептов`)
	}

	const handleLABSearchWrapper = (searchLab: { l: number; a: number; b: number }) => {
		const results = handleLABSearch(searchLab)
		state.setSearchResults(results)
		state.setIsSearchActive(true)
		toast.success(`Найдено ${results.length} похожих цветов`)
	}

	const handleColorSelectFromLABSearch = (color: typeof state.selectedColor) => {
		state.setSelectedColor(color)
		state.setIsDetailsModalOpen(true)
		state.setIsLABSearchResultsModalOpen(false)
	}

	const handleColorSelectForComparison = (color: PantoneColor) => {
		if (state.selectedColorsForComparison.length === 0) {
			state.setSelectedColorsForComparison([color])
			toast.success('Выберите второй цвет для сравнения')
		} else if (state.selectedColorsForComparison.length === 1) {
			const newSelectedColors = [...state.selectedColorsForComparison, color]
			state.setSelectedColorsForComparison(newSelectedColors)
			state.setIsComparisonModalOpen(true)
			state.setIsComparisonMode(false)
		}
	}

	return (
		<div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
			<Header onSidebarOpen={() => state.setSidebarOpen(true)} />

			{/* Сайдбар */}
			<DashboardSidebar
				isSidebarOpen={state.isSidebarOpen}
				setSidebarOpen={state.setSidebarOpen}
				searchTerm={state.searchTerm}
				setSearchTerm={state.setSearchTerm}
				categories={state.categories}
				selectedCategory={state.selectedCategory}
				setSelectedCategory={state.setSelectedCategory}
				verificationFilter={state.verificationFilter}
				setVerificationFilter={state.setVerificationFilter}
				sortField={state.sortField}
				sortOrder={state.sortOrder}
				onSortChange={handleSortChange}
				onDeleteCategory={actions.handleDeleteCategory}
				isCategoryDropdownOpen={state.isCategoryDropdownOpen}
				setIsCategoryDropdownOpen={state.setIsCategoryDropdownOpen}
				isVerificationDropdownOpen={state.isVerificationDropdownOpen}
				setIsVerificationDropdownOpen={state.setIsVerificationDropdownOpen}
				onRecipeSearch={() => {
					state.setIsRecipeSearchModalOpen(true)
					state.setSidebarOpen(false)
				}}
				onLABSearch={() => {
					state.setIsLABSearchResultsModalOpen(true)
					state.setSidebarOpen(false)
				}}
				onResetSearch={actions.handleResetSearch}
				onToggleTasks={() => {
					state.setShowOnlyWithTasks(!state.showOnlyWithTasks)
					state.setSidebarOpen(false)
				}}
				onAddColor={() => {
					state.setIsNewColorModalOpen(true)
					state.setSidebarOpen(false)
				}}
				onAddCategory={() => {
					state.setIsNewCategoryModalOpen(true)
					state.setSidebarOpen(false)
				}}
				onAnalytics={() => {
					state.setIsAnalyticsModalOpen(true)
					state.setSidebarOpen(false)
				}}
				onToggleLinking={() => {
					state.setIsLinkingMode(!state.isLinkingMode)
					if (!state.isLinkingMode) {
						state.setSelectedForLink(null)
												toast.success('Выберите первый цвет для связи')
											} else {
						state.setSelectedForLink(null)
					}
				}}
				onResetCounts={actions.handleResetAllCounts}
				onPrint={() => {
					actions.handlePrintColorsList()
					state.setSidebarOpen(false)
				}}
				onToggleComparison={() => {
					if (state.isComparisonMode) {
						actions.handleCancelComparison()
											} else {
						actions.handleStartComparison()
					}
					state.setSidebarOpen(false)
				}}
				onCategoryInfo={() => {
					state.setIsCategoryInfoModalOpen(true)
					state.setSidebarOpen(false)
				}}
				isSearchActive={state.isSearchActive}
				showOnlyWithTasks={state.showOnlyWithTasks}
				isLinkingMode={state.isLinkingMode}
				isComparisonMode={state.isComparisonMode}
			/>

			{/* Основной контент */}
			<main className='lg:pl-80 pt-20 pb-24 sm:pb-8'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 py-8'>
					{/* Индикатор активного поиска */}
					{state.isSearchActive && (
						<div className='mb-6'>
							<div
								className={`p-4 rounded-lg ${
									isDark ? 'bg-blue-900/20' : 'bg-blue-50'
								}`}
							>
								<p
									className={`text-sm ${
										isDark ? 'text-blue-200' : 'text-blue-700'
									}`}
								>
									Найдено {state.searchResults.length} рецептов с похожим составом
								</p>
							</div>
						</div>
					)}

					{/* Индикатор режима сравнения */}
					<ComparisonModeIndicator
						isComparisonMode={state.isComparisonMode}
						selectedColorsForComparison={state.selectedColorsForComparison}
						onCancelComparison={actions.handleCancelComparison}
					/>

					{/* Сетка цветов */}
					<DashboardColorGrid
						isLoading={state.isLoading}
						filteredColors={filteredColors}
						paginatedColors={paginatedColors}
						totalPages={totalPages}
						currentPage={state.currentPage}
						setCurrentPage={state.setCurrentPage}
						colors={state.colors}
						onEdit={(color) => {
							state.setSelectedColor(color)
							state.setIsEditModalOpen(true)
						}}
						onClick={(color) => {
							if (state.isComparisonMode) {
								handleColorSelectForComparison(color)
							} else {
								state.setSelectedColor(color)
								state.setIsDetailsModalOpen(true)
							}
						}}
						onDelete={actions.handleDeleteColor}
						onUpdate={actions.handleUpdateColor}
						isLinkingMode={state.isLinkingMode}
						selectedForLink={state.selectedForLink}
						onLink={(color) => actions.handleColorLink(color, state.selectedForLink)}
						onUnlink={(linkedColorId) => actions.handleUnlinkColors(state.selectedColor?.id || '', linkedColorId)}
						isComparisonMode={state.isComparisonMode}
						selectedColorsForComparison={state.selectedColorsForComparison}
						onColorSelectForComparison={handleColorSelectForComparison}
					/>
				</div>
			</main>

			{/* Модальные окна */}
			<DashboardModals
				selectedColor={state.selectedColor}
				isNewColorModalOpen={state.isNewColorModalOpen}
				setIsNewColorModalOpen={state.setIsNewColorModalOpen}
				isEditModalOpen={state.isEditModalOpen}
				setIsEditModalOpen={state.setIsEditModalOpen}
				isDetailsModalOpen={state.isDetailsModalOpen}
				setIsDetailsModalOpen={state.setIsDetailsModalOpen}
				isNewCategoryModalOpen={state.isNewCategoryModalOpen}
				setIsNewCategoryModalOpen={state.setIsNewCategoryModalOpen}
				isRecipeSearchModalOpen={state.isRecipeSearchModalOpen}
				setIsRecipeSearchModalOpen={state.setIsRecipeSearchModalOpen}
				isLABSearchModalOpen={state.isLABSearchModalOpen}
				setIsLABSearchModalOpen={state.setIsLABSearchModalOpen}
				isLABSearchResultsModalOpen={state.isLABSearchResultsModalOpen}
				setIsLABSearchResultsModalOpen={state.setIsLABSearchResultsModalOpen}
				isAnalyticsModalOpen={state.isAnalyticsModalOpen}
				setIsAnalyticsModalOpen={state.setIsAnalyticsModalOpen}
				isComparisonModalOpen={state.isComparisonModalOpen}
				// setIsComparisonModalOpen={state.setIsComparisonModalOpen}
				isCategoryInfoModalOpen={state.isCategoryInfoModalOpen}
				setIsCategoryInfoModalOpen={state.setIsCategoryInfoModalOpen}
				showPrintPreview={state.showPrintPreview}
				setShowPrintPreview={state.setShowPrintPreview}
				colors={state.colors}
				categories={state.categories}
				selectedColorsForComparison={state.selectedColorsForComparison}
				filteredColors={filteredColors}
				onSaveNewColor={actions.handleSaveNewColor}
				onUpdateColor={actions.handleUpdateColor}
				onAddCategory={actions.handleAddCategory}
				onRecipeSearch={handleRecipeSearchWrapper}
				onLABSearch={handleLABSearchWrapper}
				onColorSelectFromLABSearch={handleColorSelectFromLABSearch}
				onCloseComparisonModal={actions.handleCloseComparisonModal}
				onPrint={() => actions.handlePrint(filteredColors)}
				analyticsDashboardRef={analyticsDashboardRef}
			/>
		</div>
	)
}