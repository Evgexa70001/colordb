import type { PantoneColor } from '@/types'
import { useTheme } from '@contexts/ThemeContext'
import { useAuth } from '@contexts/AuthContext'
import ColorCard from '@components/ColorCard/ColorCard'
import SkeletonColorCard from '@components/ColorCard/SkeletonColorCard'

interface DashboardColorGridProps {
	isLoading: boolean
	filteredColors: PantoneColor[]
	paginatedColors: PantoneColor[]
	totalPages: number
	currentPage: number
	setCurrentPage: React.Dispatch<React.SetStateAction<number>>
	colors: PantoneColor[]
	onEdit: (color: PantoneColor) => void
	onClick: (color: PantoneColor) => void
	onDelete: (colorId: string) => void
	onUpdate: (colorId: string, updates: Partial<PantoneColor>) => void
	isLinkingMode: boolean
	selectedForLink: PantoneColor | null
	onLink: (color: PantoneColor) => void
	onUnlink: (linkedColorId: string) => void
	isComparisonMode: boolean
	selectedColorsForComparison: PantoneColor[]
	onColorSelectForComparison: (color: PantoneColor) => void
}

const SKELETON_COUNT = 6

export const DashboardColorGrid = ({
	isLoading,
	filteredColors,
	paginatedColors,
	totalPages,
	currentPage,
	setCurrentPage,
	colors,
	onEdit,
	onClick,
	onDelete,
	onUpdate,
	isLinkingMode,
	selectedForLink,
	onLink,
	onUnlink,
	isComparisonMode,
	selectedColorsForComparison,
	onColorSelectForComparison,
}: DashboardColorGridProps) => {
	const { isDark } = useTheme()
	const { user } = useAuth()

	return (
		<>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
				{isLoading ? (
					Array.from({ length: SKELETON_COUNT }).map((_, index) => (
						<SkeletonColorCard key={index} />
					))
				) : filteredColors.length === 0 ? (
					<div
						className={`col-span-full text-center py-12 ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						<p className='text-lg'>Ничего не найдено</p>
					</div>
				) : (
					paginatedColors.map(color => (
						<ColorCard
							key={color.id}
							color={color}
							colors={colors}
							onEdit={() => {
								if (user?.isAdmin) {
									onEdit(color)
								}
							}}
							onClick={() => {
								if (isComparisonMode) {
									onColorSelectForComparison(color)
								} else {
									onClick(color)
								}
							}}
							onDelete={() => {
								if (
									user?.isAdmin &&
									confirm('Вы точно хотите удалить этот цвет?')
								) {
									onDelete(color.id)
								}
							}}
							isAdmin={user?.isAdmin || false}
							onUpdate={() => {
								onUpdate(color.id, {
									usageCount: (color.usageCount || 0) + 1,
								})
							}}
							isLinkingMode={isLinkingMode}
							selectedForLink={selectedForLink}
							onLink={onLink}
							onUnlink={onUnlink}
							isComparisonMode={isComparisonMode}
							selectedForComparison={selectedColorsForComparison[0] || null}
						/>
					))
				)}
			</div>

			{/* Пагинация */}
			{!isLoading && filteredColors.length > 0 && (
				<div className='mt-8 flex justify-center gap-2 mb-6'>
					<button
						onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
						disabled={currentPage === 1}
						className={`px-4 py-2 rounded-xl transition-all duration-200 ${
							isDark
								? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
								: 'bg-gray-100/50 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
						}`}
					>
						Назад
					</button>

					<span
						className={`px-4 py-2 ${
							isDark ? 'text-gray-200' : 'text-gray-700'
						}`}
					>
						{currentPage} из {totalPages}
					</span>

					<button
						onClick={() =>
							setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))
						}
						disabled={currentPage === totalPages}
						className={`px-4 py-2 rounded-xl transition-all duration-200 ${
							isDark
								? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600'
								: 'bg-gray-100/50 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400'
						}`}
					>
						Вперед
					</button>
				</div>
			)}
		</>
	)
}
