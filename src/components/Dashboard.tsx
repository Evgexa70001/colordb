import { useState, useEffect } from 'react'
import { Button } from '@components/ui/Button/Button'
import {
	Plus,
	FolderPlus,
	Trash2,
	ShieldAlert,
	LogOut,
	ChevronDown,
	Users,
	RotateCcw,
	Link2,
	Search,
	Printer,
} from 'lucide-react'
import { useTheme } from '@contexts/ThemeContext'
import { useAuth } from '@contexts/AuthContext'
import ColorCard from './ColorCard/ColorCard'
import SkeletonColorCard from './ColorCard/SkeletonColorCard'
import NewColorModal from './ColorCard/NewColorModal'
import NewCategoryModal from './ColorCard/NewCategoryModal'
import ColorDetailsModal from './ColorDetails/ColorDetailsModal'
import SortControls from './SortControls'
import {
	getColors,
	saveColor,
	updateColor,
	deleteColor,
	setOfflineMode,
	resetAllUsageCounts,
	linkColors,
	unlinkColors,
} from '@lib/colors'
import { getCategories, addCategory, deleteCategory } from '@lib/categories'
import { getColorDistance, isValidHexColor } from '@utils/colorUtils'
import type { PantoneColor } from '@/types'
import toast from 'react-hot-toast'
// import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header'
import { DropdownSelect } from '@components/ui/DropdownSelect/DropdownSelect'
import RecipeSearchModal from './RecipeSearch/RecipeSearchModal'

type SortField = 'name' | 'inStock' | 'createdAt' | 'usageCount'
type SortOrder = 'asc' | 'desc'
type VerificationFilter = 'all' | 'verified' | 'unverified'

const SIMILAR_COLOR_THRESHOLD = 8
const SKELETON_COUNT = 6
const ITEMS_PER_PAGE = 18
const INITIAL_CUSTOMERS_TO_SHOW = 10
const CUSTOMERS_TO_LOAD_MORE = 10

const getTimestamp = (color: PantoneColor): number => {
	if (!color.createdAt) return 0

	// Handle Firestore Timestamp
	if (typeof color.createdAt === 'object' && 'seconds' in color.createdAt) {
		const timestamp = color.createdAt as {
			seconds: number
			nanoseconds: number
		}
		return timestamp.seconds * 1000
	}

	// Handle string date
	return new Date(color.createdAt).getTime()
}

// Добавьте эти интерфейсы в начало файла или переместите в types.ts
interface RecipeItem {
	paint: string
	amount: number
}

interface Recipe {
	totalAmount: number
	material: string
	anilox?: string
	comment?: string
	items: RecipeItem[]
}

// Добавьте эту функцию для парсинга рецепта
const parseRecipe = (recipeString: string): Recipe[] => {
	const lines = recipeString.split('\n')
	const recipes: Recipe[] = []
	let currentRecipe: Recipe | null = null

	lines.forEach(line => {
		const totalAmountMatch = line.match(/^Общее количество: (\d+)/)
		const materialMatch = line.match(/^Материал: (.+)/)
		const aniloxMatch = line.match(/^Анилокс: (.+)/)
		const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)
		const commentMatch = line.match(/^Комментарий: (.+)/)

		if (totalAmountMatch) {
			if (currentRecipe) recipes.push(currentRecipe)
			currentRecipe = {
				totalAmount: parseInt(totalAmountMatch[1]),
				material: '',
				items: [],
			}
		} else if (materialMatch && currentRecipe) {
			currentRecipe.material = materialMatch[1]
		} else if (aniloxMatch && currentRecipe) {
			currentRecipe.anilox = aniloxMatch[1]
		} else if (commentMatch && currentRecipe) {
			currentRecipe.comment = commentMatch[1]
		} else if (paintMatch && currentRecipe) {
			currentRecipe.items.push({
				paint: paintMatch[1],
				amount: parseInt(paintMatch[2]),
			})
		}
	})

	if (currentRecipe) recipes.push(currentRecipe)
	return recipes
}

// Обновите функцию getSimilarRecipes
const getSimilarRecipes = (
	targetColor: PantoneColor,
	colors: PantoneColor[]
): Array<{
	color: PantoneColor
	similarRecipes: Array<{
		recipe: Recipe
		differences: Array<{ paint: string; difference: number }>
	}>
}> => {
	if (!targetColor.recipe) return []

	const targetRecipes = parseRecipe(targetColor.recipe)
	const similarRecipesResults: Array<{
		color: PantoneColor
		similarRecipes: Array<{
			recipe: Recipe
			differences: Array<{ paint: string; difference: number }>
		}>
	}> = []

	colors
		.filter(color => color.id !== targetColor.id && color.recipe)
		.forEach(color => {
			const comparisonRecipes = parseRecipe(color.recipe!)
			const similarRecipes: Array<{
				recipe: Recipe
				differences: Array<{ paint: string; difference: number }>
			}> = []

			targetRecipes.forEach(targetRecipe => {
				comparisonRecipes.forEach(comparisonRecipe => {
					const differences: Array<{ paint: string; difference: number }> = []

					// Создаем карты процентов для обоих рецептов
					const targetPercentages = new Map<string, number>()
					const targetPaints = new Set<string>()
					targetRecipe.items.forEach(item => {
						const percentage = (item.amount / targetRecipe.totalAmount) * 100
						targetPercentages.set(item.paint, percentage)
						targetPaints.add(item.paint)
					})

					const comparisonPercentages = new Map<string, number>()
					const comparisonPaints = new Set<string>()
					comparisonRecipe.items.forEach(item => {
						const percentage =
							(item.amount / comparisonRecipe.totalAmount) * 100
						comparisonPercentages.set(item.paint, percentage)
						comparisonPaints.add(item.paint)
					})

					// Проверяем, что наборы компонентов идентичны
					const targetPaintsArray = Array.from(targetPaints)
					const comparisonPaintsArray = Array.from(comparisonPaints)

					if (
						targetPaintsArray.length === comparisonPaintsArray.length &&
						targetPaintsArray.every(paint => comparisonPaints.has(paint))
					) {
						// Если наборы компонентов совпадают, проверяем разницу в процентах
						let isRecipeSimilar = true

						targetPaintsArray.forEach(paint => {
							const targetPercentage = targetPercentages.get(paint) || 0
							const comparisonPercentage = comparisonPercentages.get(paint) || 0
							const difference = Math.abs(
								targetPercentage - comparisonPercentage
							)

							if (difference <= 3) {
								differences.push({ paint, difference })
							} else {
								isRecipeSimilar = false
							}
						})

						if (
							isRecipeSimilar &&
							differences.length === targetPaintsArray.length
						) {
							similarRecipes.push({ recipe: comparisonRecipe, differences })
						}
					}
				})
			})

			if (similarRecipes.length > 0) {
				similarRecipesResults.push({ color, similarRecipes })
			}
		})

	return similarRecipesResults
}

// Обновите функцию getSimilarColors, добавив параметр colors
const getSimilarColors = (
	targetColor: PantoneColor,
	colors: PantoneColor[]
): {
	similarColors: (PantoneColor & { distance?: number })[]
	similarRecipes: Array<{
		color: PantoneColor
		similarRecipes: Array<{
			recipe: Recipe
			differences: Array<{ paint: string; difference: number }>
		}>
	}>
} => {
	const similarColors = !isValidHexColor(targetColor.hex)
		? []
		: colors
				.filter(
					color => color.id !== targetColor.id && isValidHexColor(color.hex)
				)
				.map(color => ({
					...color,
					distance: getColorDistance(targetColor.hex, color.hex),
				}))
				.filter(color => (color.distance || 0) <= SIMILAR_COLOR_THRESHOLD)
				.sort((a, b) => (a.distance || 0) - (b.distance || 0))
				.slice(0, 6)

	const similarRecipes = getSimilarRecipes(targetColor, colors)

	return { similarColors, similarRecipes }
}

export default function Dashboard() {
	const { isDark } = useTheme()
	const { user, signOut } = useAuth()
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [categories, setCategories] = useState<string[]>([])
	const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null)
	const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false)
	const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
	const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string>('all')
	const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
	const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false)
	const [sortField, setSortField] = useState<SortField>('name')
	const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
	const [isLoading, setIsLoading] = useState(true)
	const [isSidebarOpen, setSidebarOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
	const [visibleCustomersCount, setVisibleCustomersCount] = useState(
		INITIAL_CUSTOMERS_TO_SHOW
	)
	const [verificationFilter, setVerificationFilter] =
		useState<VerificationFilter>('all')
	const [isVerificationDropdownOpen, setIsVerificationDropdownOpen] =
		useState(false)
	const [isLinkingMode, setIsLinkingMode] = useState(false)
	const [selectedForLink, setSelectedForLink] = useState<PantoneColor | null>(
		null
	)
	const [isRecipeSearchModalOpen, setIsRecipeSearchModalOpen] = useState(false)
	const [searchResults, setSearchResults] = useState<PantoneColor[]>([])
	const [isSearchActive, setIsSearchActive] = useState(false)
	const [searchRecipe, setSearchRecipe] = useState<{ 
		items: Array<{ paint: string; amount: number }> 
	} | null>(null)
	// const navigate = useNavigate();
	// const location = useLocation();

	useEffect(() => {
		loadData()
	}, [])

	useEffect(() => {
		const handleOnline = async () => {
			try {
				await setOfflineMode(false)
				toast.success('Подключение восстановлено')
				loadData()
			} catch (error) {
				console.error('Error handling online state:', error)
			}
		}

		const handleOffline = async () => {
			try {
				await setOfflineMode(true)
				toast.error('Работаем в офлайн режиме')
			} catch (error) {
				console.error('Error handling offline state:', error)
			}
		}

		if (!navigator.onLine) {
			handleOffline()
		}

		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)

		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

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
	}, [isSidebarOpen])

	useEffect(() => {
		setCurrentPage(1)
	}, [
		searchTerm,
		selectedCategory,
		selectedCustomer,
		sortField,
		sortOrder,
		verificationFilter,
	])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const dropdown = document.getElementById('customer-dropdown')
			if (dropdown && !dropdown.contains(event.target as Node)) {
				setIsCustomerDropdownOpen(false)
				setVisibleCustomersCount(INITIAL_CUSTOMERS_TO_SHOW)
			}
		}

		if (isCustomerDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isCustomerDropdownOpen])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const dropdown = document.getElementById('category-dropdown')
			if (dropdown && !dropdown.contains(event.target as Node)) {
				setIsCategoryDropdownOpen(false)
			}
		}

		if (isCategoryDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isCategoryDropdownOpen])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const dropdown = document.getElementById('verification-dropdown')
			if (dropdown && !dropdown.contains(event.target as Node)) {
				setIsVerificationDropdownOpen(false)
			}
		}

		if (isVerificationDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isVerificationDropdownOpen])

	useEffect(() => {
		if (isSearchActive && searchRecipe) {
			handleRecipeSearch(searchRecipe)
		}
	}, [colors])

	const loadData = async () => {
		try {
			setIsLoading(true)
			const [fetchedColors, fetchedCategories] = await Promise.all([
				getColors(),
				getCategories(),
			])
			setColors(fetchedColors)
			setCategories(fetchedCategories)
		} catch (error) {
			console.error('Error loading data:', error)
			toast.error('Ошибка при загрузке данных')
		} finally {
			setIsLoading(false)
		}
	}

	const handleSortChange = (field: SortField) => {
		if (field === sortField) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortOrder('asc')
		}
	}

	const handleSaveNewColor = async (newColor: Omit<PantoneColor, 'id'>) => {
		try {
			await saveColor(newColor)
			await loadData()
			setIsNewColorModalOpen(false)
			toast.success('Цвет успешно добавлен')
		} catch (error) {
			if (error instanceof Error && error.message !== 'offline') {
				console.error('Error saving color:', error)
				toast.error('Ошибка при сохранении цвета')
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

			const finalUpdates = {
				...updates,
				alternativeName: updates.alternativeName === null ? '' : updates.alternativeName,
				notes: updates.notes === null ? '' : updates.notes,
				manager: updates.manager === null ? '' : updates.manager,
			}

			await updateColor(colorId, finalUpdates)
			
			// Перезагружаем данные
			await loadData()

			// Если активен поиск по рецепту, обновляем результаты поиска
			if (isSearchActive && searchResults.length > 0) {
				const updatedSearchResults = searchResults.map(color => 
					color.id === colorId ? { ...color, ...finalUpdates } : color
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
			if (selectedCategory === categoryName) {
				setSelectedCategory('all')
			}
			toast.success('Категория успешно удалена')
		} catch (error) {
			console.error('Error deleting category:', error)
			toast.error('Ошибка при удалении категории')
		}
	}

	const getAllCustomers = () => {
		const customersSet = new Set<string>()
		colors.forEach(color => {
			color.customers?.forEach(customer => {
				customersSet.add(customer)
			})
		})
		return Array.from(customersSet).sort()
	}

	const handleLoadMoreCustomers = (e: React.MouseEvent) => {
		e.stopPropagation()
		setVisibleCustomersCount(prev => prev + CUSTOMERS_TO_LOAD_MORE)
	}

	const handleRecipeSearch = (recipe: { 
		items: Array<{ paint: string; amount: number }> 
	}) => {
		setSearchRecipe(recipe) // Сохраняем критерии поиска
		
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
				if (!searchPaints.every(paint => recipePaints.includes(paint))) return false

				return searchPaints.every(paint => {
					const searchPercentage = searchPercentages.get(paint) || 0
					const recipePercentage = recipePercentages.get(paint) || 0
					return Math.abs(searchPercentage - recipePercentage) <= 1
				})
			})
		})

		setSearchResults(results)
		setIsSearchActive(true)
		toast.success(`Найдено ${results.length} похожих рецептов`)
	}

	const filteredColors = isSearchActive 
		? searchResults 
		: colors.filter(color => {
			const searchLower = searchTerm.toLowerCase()
			const matchesSearch =
				color.name.toLowerCase().includes(searchLower) ||
				color.alternativeName?.toLowerCase().includes(searchLower) ||
				false ||
				color.hex.toLowerCase().includes(searchLower) ||
				color.customers?.some(customer =>
					customer.toLowerCase().includes(searchLower)
				) ||
				false
			const matchesCategory =
				selectedCategory === 'all' || color.category === selectedCategory
			const matchesCustomer =
				selectedCustomer === 'all' ||
				color.customers?.includes(selectedCustomer) ||
				false
			const matchesVerification =
				verificationFilter === 'all' ||
				(verificationFilter === 'verified' && color.isVerified) ||
				(verificationFilter === 'unverified' && !color.isVerified)

			return (
				matchesSearch &&
				matchesCategory &&
				matchesCustomer &&
				matchesVerification
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

	const paginatedColors = filteredColors.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	)

	const totalPages = Math.ceil(filteredColors.length / ITEMS_PER_PAGE)

	const categoryOptions = [
		{ id: 'all', label: 'Все категории' },
		...categories.map(cat => ({ id: cat, label: cat })),
	]

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

	const handleColorLink = async (color: PantoneColor) => {
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

	const handleResetSearch = () => {
		setIsSearchActive(false)
		setSearchResults([])
	}

	const handlePrintColorsList = () => {
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

	return (
		<div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
			<Header onSidebarOpen={() => setSidebarOpen(true)} />

			{/* Sidebar */}
			<aside
				id='sidebar'
				className={`fixed left-0 z-40 w-72 transform transition-all duration-300 ease-in-out ${
					isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} lg:translate-x-0 ${
					isDark
						? 'bg-gray-800/95 backdrop-blur-sm'
						: 'bg-white/95 backdrop-blur-sm'
				} border-r ${
					isDark ? 'border-gray-700/50' : 'border-gray-200/50'
				} top-16 bottom-0 shadow-xl`}
			>
				<div className='h-full flex flex-col'>
					<div className='flex-1 overflow-y-auto py-6'>
						{/* Поиск */}
						<div className='px-6 mb-6'>
							<div
								className={`relative ${
									isDark ? 'text-gray-200' : 'text-gray-900'
								}`}
							>
								<input
									type='text'
									placeholder='Поиск...'
									value={searchTerm}
									onChange={e => setSearchTerm(e.target.value)}
									className={`w-full px-4 py-2.5 pl-10 rounded-xl transition-all duration-200 ${
										isDark
											? 'bg-gray-700/50 text-gray-200 placeholder-gray-400 border-gray-600 focus:bg-gray-700 focus:ring-2 focus:ring-blue-500'
											: 'bg-gray-100/50 text-gray-900 placeholder-gray-500 border-gray-200 focus:bg-gray-100 focus:ring-2 focus:ring-blue-500'
									} border outline-none`}
								/>
								<svg
									className='absolute left-3 top-3 w-4 h-4 text-gray-400'
									fill='none'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
								</svg>
							</div>
						</div>

						{/* Кнопки админа */}
						{user?.isAdmin && (
							<div className='px-6 space-y-2 mb-6'>
								<Button
									className='w-full'
									leftIcon={<Plus className='w-4 h-4' />}
									onClick={() => {
										setIsNewColorModalOpen(true)
										setSidebarOpen(false)
									}}
								>
									Добавить цвет
								</Button>
								<Button
									className='w-full'
									variant='secondary'
									leftIcon={<FolderPlus className='w-4 h-4' />}
									onClick={() => {
										setIsNewCategoryModalOpen(true)
										setSidebarOpen(false)
									}}
								>
									Добавить категорию
								</Button>
								<Button
									className='w-full'
									variant='secondary'
									leftIcon={<RotateCcw className='w-4 h-4' />}
									onClick={handleResetAllCounts}
								>
									Сбросить счетчики
								</Button>
								<Button
									variant='secondary'
									leftIcon={<Link2 className='w-4 h-4' />}
									onClick={() => {
										setIsLinkingMode(!isLinkingMode)
										if (!isLinkingMode) {
											setSelectedForLink(null)
											toast.success('Выберите первый цвет для связи')
										} else {
											setSelectedForLink(null)
										}
									}}
									className='w-full'
								>
									{isLinkingMode ? 'Отменить связывание' : 'Связать цвета'}
								</Button>
								<Button
									className='w-full'
									variant='secondary'
									leftIcon={<Search className='w-4 h-4' />}
									onClick={() => {
										setIsRecipeSearchModalOpen(true)
										setSidebarOpen(false)
									}}
								>
									Поиск по рецепту
								</Button>
								{isSearchActive && (
									<Button
										className='w-full'
										variant='secondary'
										onClick={handleResetSearch}
									>
										Сбросить поиск
									</Button>
								)}
								<Button
									className='w-full'
									variant='secondary'
									leftIcon={<Printer className='w-4 h-4' />}
									onClick={() => {
										handlePrintColorsList()
										setSidebarOpen(false)
									}}
								>
									Печать списка
								</Button>
							</div>
						)}

						{/* Категории */}
						<div className='px-6 mb-6'>
							<DropdownSelect
								title='Категории'
								id='category-dropdown'
								value={selectedCategory}
								options={categoryOptions}
								onChange={setSelectedCategory}
								icon={<FolderPlus className='w-4 h-4' />}
								label='Выберите категорию'
								isOpen={isCategoryDropdownOpen}
								onToggle={() =>
									setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
								}
								customOptionRender={
									user?.isAdmin
										? option => (
												<div
													key={option.id}
													className='flex items-center group'
												>
													<button
														onClick={() => {
															setSelectedCategory(option.id)
															setIsCategoryDropdownOpen(false)
														}}
														className={`flex-1 text-left px-4 py-2.5 transition-colors duration-200 ${
															selectedCategory === option.id
																? isDark
																	? 'bg-gray-700 text-white'
																	: 'bg-gray-100 text-gray-900'
																: isDark
																? 'hover:bg-gray-700/50 text-gray-300'
																: 'hover:bg-gray-100 text-gray-700'
														}`}
													>
														{option.label}
													</button>
													{option.id !== 'all' && (
														<button
															onClick={e => {
																e.stopPropagation()
																if (
																	confirm(
																		`Вы точно хотите удалить категорию "${option.label}"?`
																	)
																) {
																	handleDeleteCategory(option.id)
																}
															}}
															className='p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
														>
															<Trash2
																className={`w-4 h-4 ${
																	isDark ? 'text-red-400' : 'text-red-500'
																} hover:text-red-600`}
															/>
														</button>
													)}
												</div>
										  )
										: undefined
								}
							/>
						</div>

						{/* Заказчики */}
						<div className='px-6 mb-6'>
							<h2
								className={`text-sm font-semibold mb-3 ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								} uppercase tracking-wider`}
							>
								Заказчики
							</h2>
							<div className='relative'>
								<button
									onClick={e => {
										e.stopPropagation()
										setIsCustomerDropdownOpen(!isCustomerDropdownOpen)
										if (!isCustomerDropdownOpen) {
											setIsCategoryDropdownOpen(false)
										} else {
											setVisibleCustomersCount(INITIAL_CUSTOMERS_TO_SHOW)
										}
									}}
									className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
										isDark
											? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
											: 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
									} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
								>
									<div className='flex items-center gap-2'>
										<Users className='w-4 h-4' />
										<span className='truncate'>
											{selectedCustomer === 'all'
												? 'Все заказчики'
												: selectedCustomer}
										</span>
									</div>
									<ChevronDown
										className={`w-4 h-4 transition-transform duration-200 
                    ${isCustomerDropdownOpen ? 'transform rotate-180' : ''}`}
									/>
								</button>

								{isCustomerDropdownOpen && (
									<div
										id='customer-dropdown'
										className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border 
                    transform transition-all duration-300 ease-out origin-top
                    ${
											isDark
												? 'bg-gray-800 border-gray-700'
												: 'bg-white border-gray-200'
										}
                    ${
											isCustomerDropdownOpen
												? 'opacity-100 scale-y-100 translate-y-0'
												: 'opacity-0 scale-y-0 -translate-y-2'
										}`}
									>
										<button
											onClick={() => {
												setSelectedCustomer('all')
												setIsCustomerDropdownOpen(false)
												setSidebarOpen(false)
											}}
											className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
													isDark
														? 'hover:bg-gray-700/50 text-gray-300'
														: 'hover:bg-gray-100 text-gray-700'
												}`}
										>
											Все заказчики
										</button>

										{getAllCustomers()
											.slice(0, visibleCustomersCount)
											.map(customer => (
												<button
													key={customer}
													onClick={() => {
														setSelectedCustomer(customer)
														setIsCustomerDropdownOpen(false)
														setSidebarOpen(false)
													}}
													className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                            ${
															selectedCustomer === customer
																? isDark
																	? 'bg-gray-700 text-white'
																	: 'bg-gray-100 text-gray-900'
																: isDark
																? 'hover:bg-gray-700/50 text-gray-300'
																: 'hover:bg-gray-100 text-gray-700'
														}`}
												>
													{customer}
												</button>
											))}

										{getAllCustomers().length > visibleCustomersCount && (
											<button
												onClick={handleLoadMoreCustomers}
												className={`w-full text-center px-4 py-2.5 transition-colors duration-200 border-t
                          ${
														isDark
															? 'hover:bg-gray-700/50 text-blue-400 border-gray-700'
															: 'hover:bg-gray-100 text-blue-600 border-gray-200'
													}`}
											>
												Показать ещё
											</button>
										)}
									</div>
								)}
							</div>
						</div>

						{/* Статус проверки */}
						<div className='px-6 mb-6'>
							<h2
								className={`text-sm font-semibold mb-3 ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								} uppercase tracking-wider`}
							>
								Статус проверки
							</h2>
							<div className='relative'>
								<button
									onClick={e => {
										e.stopPropagation()
										setIsVerificationDropdownOpen(!isVerificationDropdownOpen)
										if (!isVerificationDropdownOpen) {
											setIsCustomerDropdownOpen(false)
											setIsCategoryDropdownOpen(false)
										}
									}}
									className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 ${
										isDark
											? 'bg-gray-700/50 text-gray-200 hover:bg-gray-700'
											: 'bg-gray-100/50 text-gray-700 hover:bg-gray-200'
									} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
								>
									<div className='flex items-center gap-2'>
										<ShieldAlert className='w-4 h-4' />
										<span className='truncate'>
											{verificationFilter === 'all'
												? 'Все цвета'
												: verificationFilter === 'verified'
												? 'Проверенные'
												: 'Непроверенные'}
										</span>
									</div>
									<ChevronDown
										className={`w-4 h-4 transition-transform duration-200 
                    ${
											isVerificationDropdownOpen ? 'transform rotate-180' : ''
										}`}
									/>
								</button>

								{isVerificationDropdownOpen && (
									<div
										id='verification-dropdown'
										className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border 
                    transform transition-all duration-300 ease-out origin-top
                    ${
											isDark
												? 'bg-gray-800 border-gray-700'
												: 'bg-white border-gray-200'
										}
                    ${
											isVerificationDropdownOpen
												? 'opacity-100 scale-y-100 translate-y-0'
												: 'opacity-0 scale-y-0 -translate-y-2'
										}`}
									>
										<button
											onClick={() => {
												setVerificationFilter('all')
												setIsVerificationDropdownOpen(false)
												setSidebarOpen(false)
											}}
											className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
													verificationFilter === 'all'
														? isDark
															? 'bg-gray-700 text-white'
															: 'bg-gray-100 text-gray-900'
														: isDark
														? 'hover:bg-gray-700/50 text-gray-300'
														: 'hover:bg-gray-100 text-gray-700'
												}`}
										>
											Все цвета
										</button>
										<button
											onClick={() => {
												setVerificationFilter('verified')
												setIsVerificationDropdownOpen(false)
												setSidebarOpen(false)
											}}
											className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
													verificationFilter === 'verified'
														? isDark
															? 'bg-gray-700 text-white'
															: 'bg-gray-100 text-gray-900'
														: isDark
														? 'hover:bg-gray-700/50 text-gray-300'
														: 'hover:bg-gray-100 text-gray-700'
												}`}
										>
											Проверенные
										</button>
										<button
											onClick={() => {
												setVerificationFilter('unverified')
												setIsVerificationDropdownOpen(false)
												setSidebarOpen(false)
											}}
											className={`w-full text-left px-4 py-2.5 transition-colors duration-200
                        ${
													verificationFilter === 'unverified'
														? isDark
															? 'bg-gray-700 text-white'
															: 'bg-gray-100 text-gray-900'
														: isDark
														? 'hover:bg-gray-700/50 text-gray-300'
														: 'hover:bg-gray-100 text-gray-700'
												}`}
										>
											Непроверенные
										</button>
									</div>
								)}
							</div>
						</div>

						{/* Сортировка */}
						<div className='px-6 mt-6'>
							<h2
								className={`text-sm font-semibold mb-3 ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								} uppercase tracking-wider`}
							>
								Сортировка
							</h2>
							<SortControls
								sortField={sortField}
								sortOrder={sortOrder}
								onSortChange={field => {
									handleSortChange(field as SortField)
									setSidebarOpen(false)
								}}
							/>
						</div>

						{/* Кнопка выхода */}
						<Button
							variant='secondary'
							leftIcon={<LogOut className='w-4 h-4' />}
							onClick={() => signOut()}
							className='mt-3 mx-6 mb-6  sm:hidden'
						>
							Выйти
						</Button>
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

			{/* Main Content */}
			<main className='lg:pl-72 pt-20 pb-24 sm:pb-8'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 py-8'>
					{isSearchActive && (
						<div className='mb-6'>
							<div className={`p-4 rounded-lg ${
								isDark ? 'bg-blue-900/20' : 'bg-blue-50'
							}`}>
								<p className={`text-sm ${
									isDark ? 'text-blue-200' : 'text-blue-700'
								}`}>
									Найдено {searchResults.length} рецептов с похожим составом
								</p>
							</div>
						</div>
					)}
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
											setSelectedColor(color)
											setIsEditModalOpen(true)
										}
									}}
									onClick={() => {
										setSelectedColor(color)
										setIsDetailsModalOpen(true)
									}}
									onDelete={() => {
										if (
											user?.isAdmin &&
											confirm('Вы точно хотите удалить этот цвет?')
										) {
											handleDeleteColor(color.id)
										}
									}}
									isAdmin={user?.isAdmin || false}
									onUpdate={() => {
										handleUpdateColor(color.id, {
											usageCount: (color.usageCount || 0) + 1,
										})
									}}
									isLinkingMode={isLinkingMode}
									selectedForLink={selectedForLink}
									onLink={handleColorLink}
									onUnlink={async linkedColorId => {
										try {
											await unlinkColors(color.id, linkedColorId)
											await loadData()
											toast.success('Связь удалена')
										} catch (error) {
											console.error('Error unlinking colors:', error)
											toast.error('Ошибка при удалении связи')
										}
									}}
								/>
							))
						)}
					</div>

					{/* Добавьте пагинацию */}
					{!isLoading && filteredColors.length > 0 && (
						<div className='mt-8 flex justify-center gap-2 mb-6'>
							<button
								onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
									setCurrentPage(prev => Math.min(prev + 1, totalPages))
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
				</div>
			</main>

			{selectedColor && (
				<>
					<NewColorModal
						isOpen={isEditModalOpen}
						onClose={() => {
							setIsEditModalOpen(false)
							setSelectedColor(null)
						}}
						onSave={updates => handleUpdateColor(selectedColor.id, updates)}
						categories={categories}
						existingCustomers={getAllCustomers()}
						initialData={selectedColor}
					/>

					<ColorDetailsModal
						color={selectedColor}
						isOpen={isDetailsModalOpen}
						onClose={() => {
							setIsDetailsModalOpen(false)
							setSelectedColor(null)
						}}
						similarColors={getSimilarColors(selectedColor, colors).similarColors}
						similarRecipes={getSimilarColors(selectedColor, colors).similarRecipes}
						colors={colors}
						onUpdate={handleUpdateColor}
					/>
				</>
			)}

			{/* <NewColorModal
        isOpen={isNewColorModalOpen}
        onClose={() => setIsNewColorModalOpen(false)}
        onSave={handleSaveNewColor}
        categories={categories}
        existingCustomers={getAllCustomers()}
      /> */}

			<NewColorModal
				isOpen={isNewColorModalOpen}
				onClose={() => setIsNewColorModalOpen(false)}
				onSave={handleSaveNewColor}
				categories={categories}
				existingCustomers={getAllCustomers()}
			/>

			<NewCategoryModal
				isOpen={isNewCategoryModalOpen}
				onClose={() => setIsNewCategoryModalOpen(false)}
				onSave={handleAddCategory}
				existingCategories={categories}
			/>

			<RecipeSearchModal
				isOpen={isRecipeSearchModalOpen}
				onClose={() => setIsRecipeSearchModalOpen(false)}
				onSearch={handleRecipeSearch}
			/>
		</div>
	)
}
