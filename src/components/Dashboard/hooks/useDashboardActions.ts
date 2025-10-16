// import { useRef } from 'react'
import type { PantoneColor } from '@/types'
import type { AnalyticsDashboardRef } from '@components/Analytics/AnalyticsDashboard'
import {
	saveColor,
	updateColor,
	deleteColor,
	resetAllUsageCounts,
	linkColors,
	unlinkColors,
} from '@lib/colors'
import { addCategory, deleteCategory } from '@lib/categories'
import { trackColorCreated } from '@lib/analytics'
import toast from 'react-hot-toast'

interface UseDashboardActionsProps {
	loadData: () => Promise<void>
	setColors: React.Dispatch<React.SetStateAction<PantoneColor[]>>
	setIsNewColorModalOpen: (open: boolean) => void
	setIsEditModalOpen: (open: boolean) => void
	setSelectedColor: (color: PantoneColor | null) => void
	setIsNewCategoryModalOpen: (open: boolean) => void
	setIsLinkingMode: (mode: boolean) => void
	setSelectedForLink: (color: PantoneColor | null) => void
	setIsSearchActive: (active: boolean) => void
	setSearchResults: (results: PantoneColor[]) => void
	setIsComparisonMode: (mode: boolean) => void
	setSelectedColorsForComparison: (colors: PantoneColor[]) => void
	setIsComparisonModalOpen: (open: boolean) => void
	setShowPrintPreview: (show: boolean) => void
	searchResults: PantoneColor[]
	isSearchActive: boolean
	analyticsDashboardRef: React.RefObject<AnalyticsDashboardRef | null>
}

export const useDashboardActions = ({
	loadData,
	setColors,
	setIsNewColorModalOpen,
	setIsEditModalOpen,
	setSelectedColor,
	setIsNewCategoryModalOpen,
	setIsLinkingMode,
	setSelectedForLink,
	setIsSearchActive,
	setSearchResults,
	setIsComparisonMode,
	setSelectedColorsForComparison,
	setIsComparisonModalOpen,
	setShowPrintPreview,
	searchResults,
	isSearchActive,
	analyticsDashboardRef,
}: UseDashboardActionsProps) => {
	const handleSaveNewColor = async (newColor: Omit<PantoneColor, 'id'>) => {
		try {
			const savedColor = await saveColor(newColor)

			// Трекинг создания цвета (не блокируем создание цвета при ошибке трекинга)
			if (savedColor?.id) {
				try {
					if (typeof trackColorCreated === 'function') {
						await trackColorCreated(
							savedColor.id,
							newColor.name,
							undefined,
							newColor.recipe
						)

						// Обновляем данные аналитики с задержкой
						if (analyticsDashboardRef.current) {
							// Увеличиваем задержку до 2 секунд для надежной записи в Firebase
							setTimeout(() => {
								analyticsDashboardRef.current?.refreshData()
							}, 2000)
						}
					}
				} catch (analyticsError) {
					console.error(
						'Analytics tracking failed, but color was created successfully:',
						analyticsError
					)
					// Не прерываем выполнение, только логируем ошибку
				}
			}

			await loadData()
			setIsNewColorModalOpen(false)
			toast.success('Цвет успешно добавлен')
		} catch (error) {
			if (error instanceof Error && error.message !== 'offline') {
				console.error('Error saving color:', error)
				toast.error('Ошибка при сохранении цвета: ' + error.message)
			}
		}
	}

	const handleUpdateColor = async (
		colorId: string,
		updates: Partial<PantoneColor>
	) => {
		try {
			if (!colorId) {
				throw new Error('Color ID is required')
			}

			// Если обновляется только счетчик использований, не делаем ничего,
			// так как incrementUsageCount уже обновил базу данных
			if (Object.keys(updates).length === 1 && 'usageCount' in updates) {
			// Обновляем локальное состояние
			setColors((prevColors: PantoneColor[]) =>
				prevColors.map((color: PantoneColor) =>
					color.id === colorId
						? { ...color, usageCount: (color.usageCount || 0) + 1 }
						: color
				)
			)
				return
			}

			const finalUpdates = {
				...updates,
				alternativeName:
					updates.alternativeName === null ? '' : updates.alternativeName,
				notes: updates.notes === null ? '' : updates.notes,
			}

			await updateColor(colorId, finalUpdates)

			// Перезагружаем данные только для не-счетчиковых обновлений
			await loadData()

			// Если активен поиск по рецепту, обновляем результаты поиска
			if (isSearchActive && searchResults.length > 0) {
				const updatedSearchResults = searchResults.map(color =>
					color.id === colorId ? { ...color, ...updates } : color
				)
				setSearchResults(updatedSearchResults)
			}

			setIsEditModalOpen(false)
			setSelectedColor(null)
			toast.success('Цвет успешно обновлен')
		} catch (error) {
			if (error instanceof Error && error.message !== 'offline') {
				console.error('Error updating color:', error)
				toast.error('Ошибка при обновлении цвета')
			}
		}
	}

	const handleDeleteColor = async (colorId: string) => {
		try {
			await deleteColor(colorId)
			await loadData()
			toast.success('Цвет успешно удален')
		} catch (error) {
			if (error instanceof Error && error.message !== 'offline') {
				console.error('Error deleting color:', error)
				toast.error('Ошибка при удалении цвета')
			}
		}
	}

	const handleAddCategory = async (categoryName: string) => {
		try {
			await addCategory(categoryName)
			await loadData()
			setIsNewCategoryModalOpen(false)
			toast.success('Категория успешно добавлена')
		} catch (error) {
			console.error('Error adding category:', error)
			toast.error('Ошибка при добавлении категории')
		}
	}

	const handleDeleteCategory = async (categoryName: string) => {
		try {
			await deleteCategory(categoryName)
		await loadData()
		// if (selectedCategory === categoryName) {
		// 	setSelectedCategory('all')
		// }
			toast.success('Категория успешно удалена')
		} catch (error) {
			console.error('Error deleting category:', error)
			toast.error('Ошибка при удалении категории')
		}
	}

	const handleResetAllCounts = async () => {
		if (
			confirm('Вы уверены, что хотите обнулить все счетчики использований?')
		) {
			try {
				await resetAllUsageCounts()
				await loadData()
				toast.success('Все счетчики использований сброшены')
			} catch (error) {
				console.error('Error resetting usage counts:', error)
				toast.error('Ошибка при сбросе счетчиков')
			}
		}
	}

	const handleColorLink = async (color: PantoneColor, selectedForLink: PantoneColor | null) => {
		if (!selectedForLink) {
			setSelectedForLink(color)
			toast.success('Выберите второй цвет для связи')
			return
		}

		if (selectedForLink.id === color.id) {
			toast.error('Нельзя связать цвет с самим собой')
			return
		}

		try {
			await linkColors(selectedForLink.id, color.id)
			await loadData()
			toast.success('Цвета успешно связаны')
		} catch (error) {
			console.error('Error linking colors:', error)
			toast.error('Ошибка при связывании цветов')
		} finally {
			setSelectedForLink(null)
			setIsLinkingMode(false)
		}
	}

	const handleUnlinkColors = async (colorId: string, linkedColorId: string) => {
		try {
			await unlinkColors(colorId, linkedColorId)
			await loadData()
			toast.success('Связь удалена')
		} catch (error) {
			console.error('Error unlinking colors:', error)
			toast.error('Ошибка при удалении связи')
		}
	}

	const handleResetSearch = () => {
		setIsSearchActive(false)
		setSearchResults([])
	}

	// Функции для сравнения цветов
	const handleStartComparison = () => {
		setIsComparisonMode(true)
		setSelectedColorsForComparison([])
		toast.success('Выберите первый цвет для сравнения')
	}

	const handleCancelComparison = () => {
		setIsComparisonMode(false)
		setSelectedColorsForComparison([])
	}

	const handleColorSelectForComparison = () => {
		// Эта функция будет реализована в главном компоненте
		// так как требует доступ к состоянию selectedColorsForComparison
	}

	const handleCloseComparisonModal = () => {
		setIsComparisonModalOpen(false)
		setSelectedColorsForComparison([])
	}

	const handlePrintColorsList = () => {
		setShowPrintPreview(true)
	}

	const handlePrint = (filteredColors: PantoneColor[]) => {
		const printContent = `
			<html>
				<head>
					<title>Список цветов</title>
					<style>
						body {
							font-family: Arial, sans-serif;
							padding: 20px;
							max-width: 800px;
							margin: 0 auto;
						}
						h1 {
							font-size: 24px;
							margin-bottom: 20px;
							color: #333;
						}
						table {
							width: 100%;
							border-collapse: collapse;
							margin-top: 12px;
						}
						th, td {
							padding: 8px 12px;
							text-align: left;
							border: 1px solid #e2e8f0;
						}
						th {
							background-color: #f8fafc;
							font-weight: 600;
						}
						.color-preview {
							width: 20px;
							height: 20px;
							border: 1px solid #e2e8f0;
							border-radius: 4px;
							display: inline-block;
						}
						@media print {
							th { background-color: #f8fafc !important; }
						}
					</style>
				</head>
				<body>
					<h1>Список цветов</h1>
					<table>
						<thead>
							<tr>
								<th>Цвет</th>
								<th>Название</th>
								<th>Альтернативное название</th>
								<th>Использований</th>
							</tr>
						</thead>
						<tbody>
							${filteredColors
								.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
								.map(
									color => `
								<tr>
									<td>
										<div class="color-preview" style="background-color: ${color.hex}"></div>
									</td>
									<td>${color.name}</td>
									<td>${color.alternativeName || '-'}</td>
									<td>${color.usageCount || 0}</td>
								</tr>
							`
								)
								.join('')}
						</tbody>
					</table>
				</body>
			</html>
		`

		const printWindow = window.open('', '_blank')
		if (printWindow) {
			printWindow.document.write(printContent)
			printWindow.document.close()
			printWindow.focus()

			setTimeout(() => {
				printWindow.print()
				printWindow.close()
			}, 250)
		}
	}

	return {
		handleSaveNewColor,
		handleUpdateColor,
		handleDeleteColor,
		handleAddCategory,
		handleDeleteCategory,
		handleResetAllCounts,
		handleColorLink,
		handleUnlinkColors,
		handleResetSearch,
		handleStartComparison,
		handleCancelComparison,
		handleColorSelectForComparison,
		handleCloseComparisonModal,
		handlePrintColorsList,
		handlePrint,
	}
}
