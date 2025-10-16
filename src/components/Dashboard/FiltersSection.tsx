import { useEffect } from 'react'
import { ChevronDown, ShieldAlert, FolderPlus, Trash2, Palette } from 'lucide-react'
import { DropdownSelect } from '@components/ui/DropdownSelect/DropdownSelect'
import SortControls from '@components/SortControls'
import { useTheme } from '@contexts/ThemeContext'
import type { SortField, SortOrder, VerificationFilter } from '@/types/dashboard'

interface FiltersSectionProps {
	categories: string[]
	selectedCategory: string
	setSelectedCategory: (category: string) => void
	verificationFilter: VerificationFilter
	setVerificationFilter: (filter: VerificationFilter) => void
	sortField: SortField
	sortOrder: SortOrder
	onSortChange: (field: SortField) => void
	onDeleteCategory: (category: string) => void
	user: { isAdmin?: boolean } | null
	isCategoryDropdownOpen: boolean
	setIsCategoryDropdownOpen: (open: boolean) => void
	isVerificationDropdownOpen: boolean
	setIsVerificationDropdownOpen: (open: boolean) => void
}

export const FiltersSection = ({
	categories,
	selectedCategory,
	setSelectedCategory,
	verificationFilter,
	setVerificationFilter,
	sortField,
	sortOrder,
	onSortChange,
	onDeleteCategory,
	user,
	isCategoryDropdownOpen,
	setIsCategoryDropdownOpen,
	isVerificationDropdownOpen,
	setIsVerificationDropdownOpen,
}: FiltersSectionProps) => {
	const { isDark } = useTheme()

	const categoryOptions = [
		{ id: 'all', label: 'Все категории' },
		...categories.map(cat => ({ id: cat, label: cat })),
	]

	// Обработчики клика вне dropdown'ов
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const categoryDropdown = document.getElementById('category-dropdown')
			if (categoryDropdown && !categoryDropdown.contains(event.target as Node)) {
				setIsCategoryDropdownOpen(false)
			}
		}

		if (isCategoryDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isCategoryDropdownOpen, setIsCategoryDropdownOpen])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const verificationDropdown = document.getElementById('verification-dropdown')
			if (verificationDropdown && !verificationDropdown.contains(event.target as Node)) {
				setIsVerificationDropdownOpen(false)
			}
		}

		if (isVerificationDropdownOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isVerificationDropdownOpen, setIsVerificationDropdownOpen])

	return (
		<>
			{/* Фильтры */}
			<div className="group">
				<div className='space-y-4'>
					{/* Категории */}
					<div>
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
													className={`flex-1 text-left px-4 py-2.5 transition-colors duration-200 text-sm ${
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
																onDeleteCategory(option.id)
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

					{/* Статус проверки */}
					<div>
						<div className='relative'>
							<button
								onClick={e => {
									e.stopPropagation()
									setIsVerificationDropdownOpen(!isVerificationDropdownOpen)
									if (!isVerificationDropdownOpen) {
										setIsCategoryDropdownOpen(false)
									}
								}}
								className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
									isDark
										? 'bg-gray-800/50 text-gray-200 hover:bg-gray-800/80 border-gray-700'
										: 'bg-gray-50/50 text-gray-700 hover:bg-gray-100/80 border-gray-200'
								} border`}
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
									className={`w-4 h-4 transition-transform duration-200 ${
										isVerificationDropdownOpen ? 'transform rotate-180' : ''
									}`}
								/>
							</button>

							{isVerificationDropdownOpen && (
								<div
									id='verification-dropdown'
									className={`absolute z-50 w-full mt-2 py-1 rounded-xl shadow-lg border transform transition-all duration-300 ease-out origin-top ${
										isDark
											? 'bg-gray-800 border-gray-700'
											: 'bg-white border-gray-200'
									} opacity-100 scale-y-100 translate-y-0`}
								>
									{[
										{ value: 'all', label: 'Все цвета' },
										{ value: 'verified', label: 'Проверенные' },
										{ value: 'unverified', label: 'Непроверенные' }
									].map(option => (
										<button
											key={option.value}
											onClick={() => {
												setVerificationFilter(option.value as VerificationFilter)
												setIsVerificationDropdownOpen(false)
											}}
											className={`w-full text-left px-4 py-2.5 transition-colors duration-200 text-sm ${
												verificationFilter === option.value
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
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Сортировка */}
			<div className="group">
				<div className="flex items-center gap-3 mb-4">
					<div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800/40' : 'bg-gray-100/40'}`}>
						<Palette className="w-4 h-4" />
					</div>
					<h3 className={`font-medium text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
						Сортировка
					</h3>
				</div>
				<SortControls
					sortField={sortField}
					sortOrder={sortOrder}
					onSortChange={field => {
						onSortChange(field as SortField)
					}}
				/>
			</div>
		</>
	)
}
