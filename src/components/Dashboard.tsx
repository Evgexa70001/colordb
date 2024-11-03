import React, { useState, useEffect } from 'react'
import { Search, Plus, LogOut, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ColorCard from './ColorCard'
import EditColorModal from './EditColorModal'
import ColorDetailsModal from './ColorDetailsModal'
import NewColorModal from './NewColorModal'
import NewCategoryModal from './NewCategoryModal'
import {
	getColors,
	getCategories,
	saveColor,
	updateColor,
	deleteColor,
	saveCategory,
} from '../lib/storage'
import { useAuth } from '../contexts/AuthContext'
import type { PantoneColor } from '../types'

export default function Dashboard() {
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [categories, setCategories] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [editingColor, setEditingColor] = useState<PantoneColor | null>(null)
	const [selectedColor, setSelectedColor] = useState<PantoneColor | null>(null)
	const [isNewColorModalOpen, setIsNewColorModalOpen] = useState(false)
	const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)

	const { user, signOut } = useAuth()
	const navigate = useNavigate()

	useEffect(() => {
		if (!user) {
			navigate('/login')
			return
		}
		loadData()
	}, [user, navigate])

	const loadData = async () => {
		try {
			setIsLoading(true)
			setIsCategoriesLoading(true)

			// Load categories first
			const loadedCategories = await getCategories()
			setCategories(loadedCategories)
			setIsCategoriesLoading(false)

			// Then load colors
			const loadedColors = await getColors()
			setColors(loadedColors)
		} catch (error) {
			console.error('Error loading data:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleSignOut = async () => {
		try {
			await signOut()
			navigate('/login')
		} catch (error) {
			console.error('Error signing out:', error)
		}
	}

	const filteredColors = colors.filter(color => {
		const matchesSearch =
			color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			color.hex.toLowerCase().includes(searchTerm.toLowerCase())
		const matchesCategory =
			!selectedCategory || color.category === selectedCategory
		return matchesSearch && matchesCategory
	})

	if (isLoading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className='flex flex-col items-center gap-2'>
					<Loader2 className='w-8 h-8 animate-spin text-blue-600' />
					<p className='text-gray-600'>Loading colors...</p>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gray-50'>
			<nav className='bg-white shadow-sm'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between h-16'>
						<div className='flex-shrink-0 flex items-center'>
							<h1 className='text-xl font-bold text-gray-900'>
								Pantone Colors
							</h1>
						</div>
						<div className='flex items-center'>
							<span className='text-gray-600 mr-4'>{user?.email}</span>
							<button
								onClick={handleSignOut}
								className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition'
							>
								<LogOut className='h-4 w-4 mr-2' />
								Sign Out
							</button>
						</div>
					</div>
				</div>
			</nav>

			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<div className='flex items-center space-x-4 mb-8'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
						<input
							type='text'
							placeholder='Search colors'
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
							className='w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
						/>
					</div>
					<button
						onClick={() => setIsNewColorModalOpen(true)}
						disabled={isCategoriesLoading}
						className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
					>
						<Plus className='w-5 h-5' />
						<span>New Color</span>
					</button>
					<button
						onClick={() => setIsNewCategoryModalOpen(true)}
						className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2'
					>
						<Plus className='w-5 h-5' />
						<span>New Category</span>
					</button>
				</div>

				<div className='flex flex-wrap gap-3 mb-8'>
					{isCategoriesLoading ? (
						<div className='flex items-center gap-2 text-gray-500'>
							<Loader2 className='w-4 h-4 animate-spin' />
							<span>Loading categories...</span>
						</div>
					) : categories.length > 0 ? (
						categories.map(category => (
							<button
								key={category}
								onClick={() =>
									setSelectedCategory(
										selectedCategory === category ? null : category
									)
								}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
										selectedCategory === category
											? 'bg-blue-600 text-white'
											: 'bg-white text-gray-700 hover:bg-gray-100'
									}`}
							>
								{category}
							</button>
						))
					) : (
						<p className='text-gray-500'>No categories available</p>
					)}
				</div>

				<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
					{filteredColors.map(color => (
						<ColorCard
							key={color.id}
							color={color}
							onEdit={() => setEditingColor(color)}
							onClick={() => setSelectedColor(color)}
							onDelete={async () => {
								if (confirm('Are you sure you want to delete this color?')) {
									await deleteColor(color.id)
									loadData()
								}
							}}
						/>
					))}
				</div>

				{editingColor && (
					<EditColorModal
						color={editingColor}
						isOpen={true}
						onClose={() => setEditingColor(null)}
						onSave={async updatedColor => {
							await updateColor(updatedColor)
							loadData()
							setEditingColor(null)
						}}
						categories={categories}
					/>
				)}

				{selectedColor && (
					<ColorDetailsModal
						color={selectedColor}
						isOpen={true}
						onClose={() => setSelectedColor(null)}
						similarColors={colors
							.filter(
								c =>
									c.id !== selectedColor.id &&
									c.category === selectedColor.category
							)
							.slice(0, 10)}
					/>
				)}

				<NewColorModal
					isOpen={isNewColorModalOpen}
					onClose={() => setIsNewColorModalOpen(false)}
					onSave={async newColor => {
						await saveColor(newColor)
						loadData()
						setIsNewColorModalOpen(false)
					}}
					categories={categories}
				/>

				<NewCategoryModal
					isOpen={isNewCategoryModalOpen}
					onClose={() => setIsNewCategoryModalOpen(false)}
					onSave={async newCategory => {
						await saveCategory(newCategory)
						loadData()
						setIsNewCategoryModalOpen(false)
					}}
					existingCategories={categories}
				/>
			</div>
		</div>
	)
}
