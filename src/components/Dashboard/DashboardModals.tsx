import { X } from 'lucide-react'
import type { PantoneColor } from '@/types'
import type { AnalyticsDashboardRef } from '@components/Analytics/AnalyticsDashboard'
import { useTheme } from '@contexts/ThemeContext'
import NewColorModal from '@components/ColorCard/NewColorModal'
import NewCategoryModal from '@components/ColorCard/NewCategoryModal'
import ColorDetailsModal from '@components/ColorDetails/ColorDetailsModal'
import RecipeSearchModal from '@components/RecipeSearch/RecipeSearchModal'
import LABSearchModal from '@components/LABSearch/LABSearchModal'
import LABSearchResultsModal from '@components/LABSearch/LABSearchResultsModal'
import AnalyticsDashboard from '@components/Analytics/AnalyticsDashboard'
import ColorComparisonModal from '@components/ColorComparison'
import CategoryInfoModal from '@components/CategoryInfo/CategoryInfoModal'
import PrintPreview from '@components/PrintPreview'
import { getSimilarColors } from '@utils/colorSimilarityUtils'

interface DashboardModalsProps {
	// Состояние модальных окон
	selectedColor: PantoneColor | null
	isNewColorModalOpen: boolean
	setIsNewColorModalOpen: (open: boolean) => void
	isEditModalOpen: boolean
	setIsEditModalOpen: (open: boolean) => void
	isDetailsModalOpen: boolean
	setIsDetailsModalOpen: (open: boolean) => void
	isNewCategoryModalOpen: boolean
	setIsNewCategoryModalOpen: (open: boolean) => void
	isRecipeSearchModalOpen: boolean
	setIsRecipeSearchModalOpen: (open: boolean) => void
	isLABSearchModalOpen: boolean
	setIsLABSearchModalOpen: (open: boolean) => void
	isLABSearchResultsModalOpen: boolean
	setIsLABSearchResultsModalOpen: (open: boolean) => void
	isAnalyticsModalOpen: boolean
	setIsAnalyticsModalOpen: (open: boolean) => void
	isComparisonModalOpen: boolean
	// setIsComparisonModalOpen: (open: boolean) => void
	isCategoryInfoModalOpen: boolean
	setIsCategoryInfoModalOpen: (open: boolean) => void
	showPrintPreview: boolean
	setShowPrintPreview: (show: boolean) => void

	// Данные
	colors: PantoneColor[]
	categories: string[]
	selectedColorsForComparison: PantoneColor[]
	filteredColors: PantoneColor[]

	// Обработчики
	onSaveNewColor: (color: Omit<PantoneColor, 'id'>) => Promise<void>
	onUpdateColor: (colorId: string, updates: Partial<PantoneColor>) => Promise<void>
	onAddCategory: (categoryName: string) => Promise<void>
	onRecipeSearch: (recipe: { items: Array<{ paint: string; amount: number }> }) => void
	onLABSearch: (searchLab: { l: number; a: number; b: number }) => void
	onColorSelectFromLABSearch: (color: PantoneColor) => void
	onCloseComparisonModal: () => void
	onPrint: () => void
	analyticsDashboardRef: React.RefObject<AnalyticsDashboardRef | null>
}

export const DashboardModals = ({
	selectedColor,
	isNewColorModalOpen,
	setIsNewColorModalOpen,
	isEditModalOpen,
	setIsEditModalOpen,
	isDetailsModalOpen,
	setIsDetailsModalOpen,
	isNewCategoryModalOpen,
	setIsNewCategoryModalOpen,
	isRecipeSearchModalOpen,
	setIsRecipeSearchModalOpen,
	isLABSearchModalOpen,
	setIsLABSearchModalOpen,
	isLABSearchResultsModalOpen,
	setIsLABSearchResultsModalOpen,
	isAnalyticsModalOpen,
	setIsAnalyticsModalOpen,
	isComparisonModalOpen,
	isCategoryInfoModalOpen,
	setIsCategoryInfoModalOpen,
	showPrintPreview,
	setShowPrintPreview,
	colors,
	categories,
	selectedColorsForComparison,
	filteredColors,
	onSaveNewColor,
	onUpdateColor,
	onAddCategory,
	onRecipeSearch,
	onLABSearch,
	onColorSelectFromLABSearch,
	onCloseComparisonModal,
	onPrint,
	analyticsDashboardRef,
}: DashboardModalsProps) => {
	const { isDark } = useTheme()

	return (
		<>
			{/* Модальные окна для выбранного цвета */}
			{selectedColor && (
				<>
					<NewColorModal
						isOpen={isEditModalOpen}
						onClose={() => {
							setIsEditModalOpen(false)
						}}
						onSave={updates => onUpdateColor(selectedColor.id, updates)}
						categories={categories}
						initialData={selectedColor}
					/>

					<ColorDetailsModal
						color={selectedColor}
						isOpen={isDetailsModalOpen}
						onClose={() => {
							setIsDetailsModalOpen(false)
						}}
						similarColors={
							(() => {
								const result = getSimilarColors(selectedColor, colors).similarColors
								return result
							})()
						}
						similarRecipes={
							getSimilarColors(selectedColor, colors).similarRecipes
						}
						colors={colors}
						onUpdate={onUpdateColor}
					/>
				</>
			)}

			{/* Модальные окна для создания */}
			<NewColorModal
				isOpen={isNewColorModalOpen}
				onClose={() => setIsNewColorModalOpen(false)}
				onSave={onSaveNewColor}
				categories={categories}
			/>

			<NewCategoryModal
				isOpen={isNewCategoryModalOpen}
				onClose={() => setIsNewCategoryModalOpen(false)}
				onSave={onAddCategory}
				existingCategories={categories}
			/>

			{/* Модальные окна поиска */}
			<RecipeSearchModal
				isOpen={isRecipeSearchModalOpen}
				onClose={() => setIsRecipeSearchModalOpen(false)}
				onSearch={onRecipeSearch}
			/>

			<LABSearchModal
				isOpen={isLABSearchModalOpen}
				onClose={() => setIsLABSearchModalOpen(false)}
				onSearch={onLABSearch}
			/>

			<LABSearchResultsModal
				isOpen={isLABSearchResultsModalOpen}
				onClose={() => setIsLABSearchResultsModalOpen(false)}
				colors={colors}
				onColorSelect={onColorSelectFromLABSearch}
			/>

			{/* Модальное окно сравнения */}
			<ColorComparisonModal
				isOpen={isComparisonModalOpen}
				onClose={onCloseComparisonModal}
				selectedColors={selectedColorsForComparison}
			/>

			{/* Модальное окно аналитики */}
			{isAnalyticsModalOpen && (
				<div className='fixed inset-0 z-50 overflow-y-auto'>
					<div
						className='fixed inset-0 bg-black/50'
						onClick={() => setIsAnalyticsModalOpen(false)}
					/>
					<div className='relative min-h-screen flex items-center justify-center p-4'>
						<div
							className={`relative w-full max-w-7xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
								isDark ? 'bg-gray-900' : 'bg-white'
							}`}
						>
							<div className='sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-inherit rounded-t-lg'>
								<h2
									className={`text-xl font-semibold ${
										isDark ? 'text-white' : 'text-gray-900'
									}`}
								>
									Аналитика
								</h2>
								<button
									onClick={() => setIsAnalyticsModalOpen(false)}
									className={`p-2 rounded-lg transition-colors ${
										isDark
											? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
											: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
									}`}
								>
									<X className='w-5 h-5' />
								</button>
							</div>
							<div className='p-6'>
								<AnalyticsDashboard ref={analyticsDashboardRef as React.RefObject<AnalyticsDashboardRef>} />
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Модальное окно информации о категориях */}
			<CategoryInfoModal
				isOpen={isCategoryInfoModalOpen}
				onClose={() => setIsCategoryInfoModalOpen(false)}
			/>

			{/* Модальное окно предварительного просмотра печати */}
			{showPrintPreview && (
				<PrintPreview
					colors={filteredColors}
					onClose={() => setShowPrintPreview(false)}
					onPrint={() => {
						onPrint()
						setShowPrintPreview(false)
					}}
				/>
			)}
		</>
	)
}
