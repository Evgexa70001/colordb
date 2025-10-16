import { useEffect, useMemo } from 'react'
import type { PantoneColor } from '@/types'
import type { SortField, SortOrder, VerificationFilter } from '@/types/dashboard'
import { getTimestamp } from '@utils/dateUtils'
import { parseRecipe } from '@utils/recipeUtils'
import {
	hexToLab,
	calculateLabDistance,
	calculateAniloxChange,
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS,
} from '@utils/colorUtils'

interface UseDashboardFiltersProps {
	colors: PantoneColor[]
	searchTerm: string
	selectedCategory: string
	sortField: SortField
	sortOrder: SortOrder
	verificationFilter: VerificationFilter
	showOnlyWithTasks: boolean
	isSearchActive: boolean
	searchResults: PantoneColor[]
	currentPage: number
	setCurrentPage: (page: number) => void
}

const ITEMS_PER_PAGE = 18

export const useDashboardFilters = ({
	colors,
	searchTerm,
	selectedCategory,
	sortField,
	sortOrder,
	verificationFilter,
	showOnlyWithTasks,
	isSearchActive,
	searchResults,
	currentPage,
	setCurrentPage,
}: UseDashboardFiltersProps) => {
	// Сброс страницы при изменении фильтров
	useEffect(() => {
		setCurrentPage(1)
	}, [
		searchTerm,
		selectedCategory,
		sortField,
		sortOrder,
		verificationFilter,
		showOnlyWithTasks,
	])

	const filteredColors = useMemo(() => {
		const sourceColors = isSearchActive ? searchResults : colors

		return sourceColors
			.filter(color => {
				const searchLower = searchTerm.toLowerCase()
				const matchesSearch =
					color.name.toLowerCase().includes(searchLower) ||
					color.alternativeName?.toLowerCase().includes(searchLower) ||
					color.hex.toLowerCase().includes(searchLower) ||
					// Добавляем поиск по дополнительным цветам
					color.additionalColors?.some(
						additionalColor =>
							additionalColor.name.toLowerCase().includes(searchLower) ||
							additionalColor.hex.toLowerCase().includes(searchLower) ||
							additionalColor.anilox.toLowerCase().includes(searchLower)
					) ||
					false
				const matchesCategory =
					selectedCategory === 'all' || color.category === selectedCategory

				const matchesVerification =
					verificationFilter === 'all' ||
					(verificationFilter === 'verified' && color.isVerified) ||
					(verificationFilter === 'unverified' && !color.isVerified)

				const hasTasks = showOnlyWithTasks
					? color.tasks && color.tasks.length > 0
					: true

				return (
					matchesSearch &&
					matchesCategory &&
					matchesVerification &&
					hasTasks
				)
			})
			.sort((a, b) => {
				if (sortField === 'name') {
					return sortOrder === 'asc'
						? a.name.localeCompare(b.name)
						: b.name.localeCompare(a.name)
				} else if (sortField === 'createdAt') {
					const timeA = getTimestamp(a)
					const timeB = getTimestamp(b)
					return sortOrder === 'asc' ? timeA - timeB : timeB - timeA
				} else if (sortField === 'usageCount') {
					const countA = a.usageCount || 0
					const countB = b.usageCount || 0
					return sortOrder === 'asc' ? countA - countB : countB - countA
				} else {
					return sortOrder === 'asc'
						? Number(b.inStock) - Number(a.inStock)
						: Number(a.inStock) - Number(b.inStock)
				}
			})
	}, [
		colors,
		searchTerm,
		selectedCategory,
		sortField,
		sortOrder,
		verificationFilter,
		showOnlyWithTasks,
		isSearchActive,
		searchResults,
	])

	const paginatedColors = useMemo(() => {
		return filteredColors.slice(
			(currentPage - 1) * ITEMS_PER_PAGE,
			currentPage * ITEMS_PER_PAGE
		)
	}, [filteredColors, currentPage])

	const totalPages = Math.ceil(filteredColors.length / ITEMS_PER_PAGE)

	// Функция поиска по рецепту
	const handleRecipeSearch = (recipe: {
		items: Array<{ paint: string; amount: number }>
	}) => {
		const totalAmount = recipe.items.reduce((sum, item) => sum + item.amount, 0)

		const searchPercentages = new Map<string, number>()
		recipe.items.forEach(item => {
			const percentage = (item.amount / totalAmount) * 100
			searchPercentages.set(item.paint, percentage)
		})

		const results = colors.filter(color => {
			if (!color.recipe) return false

			const recipes = parseRecipe(color.recipe)
			return recipes.some(recipe => {
				const recipePercentages = new Map<string, number>()
				recipe.items.forEach(item => {
					const percentage = (item.amount / recipe.totalAmount) * 100
					recipePercentages.set(item.paint, percentage)
				})

				const searchPaints = Array.from(searchPercentages.keys())
				const recipePaints = recipe.items.map(item => item.paint)

				if (searchPaints.length !== recipePaints.length) return false
				if (!searchPaints.every(paint => recipePaints.includes(paint)))
					return false

				return searchPaints.every(paint => {
					const searchPercentage = searchPercentages.get(paint) || 0
					const recipePercentage = recipePercentages.get(paint) || 0
					return Math.abs(searchPercentage - recipePercentage) <= 1
				})
			})
		})

		return results
	}

	// Функция LAB поиска
	const handleLABSearch = (searchLab: { l: number; a: number; b: number }) => {
		const LAB_TOLERANCE = 6 // Изменяем с 8 на 6 для соответствия основному фильтру

		const results = colors.filter(color => {
			// First check saved LAB values if they exist
			if (color.labValues) {
				// Используем калиброванный дельта E если доступен
				const calibratedDistance = calculateDeltaEWithCalibration(
					searchLab,
					color.labValues,
					SPECTROPHOTOMETER_CALIBRATIONS.xrite
				)
				
				// Всегда используем калиброванный дельта E если доступен
				const finalDistance = calibratedDistance
				if (Math.abs(finalDistance) <= LAB_TOLERANCE) return true
			}

			// Then check converted LAB values from HEX
			const colorLab = color.labValues || hexToLab(color.hex)
			
			// Используем калиброванный дельта E если доступен
			const calibratedDistance = calculateDeltaEWithCalibration(
				searchLab,
				colorLab,
				SPECTROPHOTOMETER_CALIBRATIONS.xrite
			)
			
			// Всегда используем калиброванный дельта E если доступен
			const finalDistance = calibratedDistance
			if (Math.abs(finalDistance) <= LAB_TOLERANCE) return true

			// Finally check anilox variations
			if (color.recipe) {
				const recipes = parseRecipe(color.recipe)
				return recipes.some(recipe => {
					if (!recipe.anilox) return false

					const aniloxValues = ['500', '800']
					return aniloxValues.some(targetAnilox => {
						if (targetAnilox === recipe.anilox) return false

						const predictedLab = recipe.anilox
							? calculateAniloxChange(colorLab, recipe.anilox, targetAnilox)
							: null
						if (!predictedLab) return false

						const distance = calculateLabDistance(searchLab, predictedLab)
						const calibratedDistance = calculateDeltaEWithCalibration(
							searchLab,
							predictedLab,
							SPECTROPHOTOMETER_CALIBRATIONS.xrite
						)

						// Используем минимальное значение из двух
						const minDistance = Math.min(distance, calibratedDistance)
						return Math.abs(minDistance) <= LAB_TOLERANCE
					})
				})
			}

			return false
		})

		return results
	}

	return {
		filteredColors,
		paginatedColors,
		totalPages,
		handleRecipeSearch,
		handleLABSearch,
	}
}
