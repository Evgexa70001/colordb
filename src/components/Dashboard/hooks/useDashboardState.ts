import { useState } from 'react'
import type { PantoneColor } from '@/types'
import type { SortField, SortOrder, VerificationFilter } from '@/types/dashboard'

export const useDashboardState = () => {
	// Основные данные
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [categories, setCategories] = useState<string[]>([])
	const [isLoading, setIsLoading] = useState(true)

	// Выбранный цвет и модальные окна
	const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null)
	const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
	const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)

	// Поиск и фильтры
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [sortField, setSortField] = useState<SortField>('name')
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
	const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('all')
	const [showOnlyWithTasks, setShowOnlyWithTasks] = useState(false)

	// UI состояние
	const [isSidebarOpen, setSidebarOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
	const [isVerificationDropdownOpen, setIsVerificationDropdownOpen] = useState(false)

	// Связывание цветов
	const [isLinkingMode, setIsLinkingMode] = useState(false)
	const [selectedForLink, setSelectedForLink] = useState<PantoneColor | null>(null)

	// Поиск по рецепту
	const [isRecipeSearchModalOpen, setIsRecipeSearchModalOpen] = useState(false)
	const [searchResults, setSearchResults] = useState<PantoneColor[]>([])
	const [isSearchActive, setIsSearchActive] = useState(false)
	const [searchRecipe, setSearchRecipe] = useState<{
		items: Array<{ paint: string; amount: number }>
	} | null>(null)

	// LAB поиск
	const [isLABSearchModalOpen, setIsLABSearchModalOpen] = useState(false)
	const [isLABSearchResultsModalOpen, setIsLABSearchResultsModalOpen] = useState(false)

	// Аналитика
	const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false)

	// Сравнение цветов
	const [isComparisonMode, setIsComparisonMode] = useState(false)
	const [selectedColorsForComparison, setSelectedColorsForComparison] = useState<PantoneColor[]>([])
	const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)

	// Дополнительные модальные окна
	const [isCategoryInfoModalOpen, setIsCategoryInfoModalOpen] = useState(false)
	const [showPrintPreview, setShowPrintPreview] = useState(false)

	return {
		// Основные данные
		colors,
		setColors,
		categories,
		setCategories,
		isLoading,
		setIsLoading,

		// Выбранный цвет и модальные окна
		selectedColor,
		setSelectedColor,
		isNewColorModalOpen,
		setIsNewColorModalOpen,
		isEditModalOpen,
		setIsEditModalOpen,
		isDetailsModalOpen,
		setIsDetailsModalOpen,
		isNewCategoryModalOpen,
		setIsNewCategoryModalOpen,

		// Поиск и фильтры
		searchTerm,
		setSearchTerm,
		selectedCategory,
		setSelectedCategory,
		sortField,
		setSortField,
		sortOrder,
		setSortOrder,
		verificationFilter,
		setVerificationFilter,
		showOnlyWithTasks,
		setShowOnlyWithTasks,

		// UI состояние
		isSidebarOpen,
		setSidebarOpen,
		currentPage,
		setCurrentPage,
		isCategoryDropdownOpen,
		setIsCategoryDropdownOpen,
		isVerificationDropdownOpen,
		setIsVerificationDropdownOpen,

		// Связывание цветов
		isLinkingMode,
		setIsLinkingMode,
		selectedForLink,
		setSelectedForLink,

		// Поиск по рецепту
		isRecipeSearchModalOpen,
		setIsRecipeSearchModalOpen,
		searchResults,
		setSearchResults,
		isSearchActive,
		setIsSearchActive,
		searchRecipe,
		setSearchRecipe,

		// LAB поиск
		isLABSearchModalOpen,
		setIsLABSearchModalOpen,
		isLABSearchResultsModalOpen,
		setIsLABSearchResultsModalOpen,

		// Аналитика
		isAnalyticsModalOpen,
		setIsAnalyticsModalOpen,

		// Сравнение цветов
		isComparisonMode,
		setIsComparisonMode,
		selectedColorsForComparison,
		setSelectedColorsForComparison,
		isComparisonModalOpen,
		setIsComparisonModalOpen,

		// Дополнительные модальные окна
		isCategoryInfoModalOpen,
		setIsCategoryInfoModalOpen,
		showPrintPreview,
		setShowPrintPreview,
	}
}
