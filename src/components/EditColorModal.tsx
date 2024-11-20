import React, { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { Plus, X, Copy, ChevronDown } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { normalizeHexColor } from '../utils/colorUtils'
import { UNCATEGORIZED } from '../lib/categories'
import { UNCATEGORIZEDS } from '../lib/groups'
import type { ColorModalProps } from '../types'

// Часто используемые материалы и анилоксы
const COMMON_MATERIALS = ['Пленка Белая', 'Бумага']

const COMMON_ANILOX = ['800', '500', '350']

const COMMON_PAINTS = ['M', 'Y', 'C', 'K', 'Tr.W']

const baseClasses = {
	input: `block w-full rounded-md shadow-sm transition-colors duration-200 ease-in-out`,
	button: `transition-colors duration-200 ease-in-out rounded-md font-medium w-full flex items-center justify-center gap-2`,
	panel: `mx-auto max-w-4xl w-full rounded-lg p-6 shadow-xl transition-colors duration-200 max-h-[90vh] overflow-y-auto`,
}

// Обновленные темные/светлые варианты
const themeClasses = {
	input: {
		light:
			'border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-200',
		dark: 'border-gray-700 bg-gray-800 text-gray-100 focus:border-blue-400 focus:ring-blue-500/20',
	},
	button: {
		primary: {
			light:
				'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow',
			dark: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow',
		},
		secondary: {
			light:
				'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-200',
			dark: 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500 border border-gray-600',
		},
	},
	recipe: {
		light: 'bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm',
		dark: 'bg-gray-800 border border-gray-700 hover:border-gray-600 shadow-sm',
	},
	suggestions: {
		container: {
			light: 'bg-white border border-gray-200 shadow-lg',
			dark: 'bg-gray-800 border border-gray-700 shadow-lg',
		},
		item: {
			light: 'text-gray-700 hover:bg-gray-50',
			dark: 'text-gray-200 hover:bg-gray-700',
		},
	},
}

interface Recipe {
	totalAmount: number
	material: string
	anilox?: string
	comment?: string
	items: {
		paint: string
		amount: number
	}[]
}

export default function EditColorModal({
	color,
	isOpen,
	onClose,
	onSave,
	categories,
	groups,
}: ColorModalProps) {
	const { isDark } = useTheme()
	const [name, setName] = useState(color.name)
	const [hex, setHex] = useState(color.hex)
	const [customers, setCustomers] = useState(color.customers?.join(', ') || '')
	const [inStock, setInStock] = useState(color.inStock)
	const [category, setCategory] = useState(
		color.category === UNCATEGORIZED ? '' : color.category
	)
	const [group, setGroup] = useState(
		color.group === UNCATEGORIZEDS ? '' : color.group
	)
	const [notes, setNotes] = useState(color.notes || '')
	const [manager, setManager] = useState(color.manager || '')
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false)
	const [showAniloxSuggestions, setShowAniloxSuggestions] = useState(false)
	const [showPaintSuggestions, setShowPaintSuggestions] = useState(false)
	const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(
		null
	)
	const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
		null
	)

	useEffect(() => {
		setName(color.name)
		setHex(color.hex)
		setCustomers(color.customers?.join(', ') || '')
		setInStock(color.inStock)
		setCategory(color.category === UNCATEGORIZED ? '' : color.category)
		setGroup(color.group === UNCATEGORIZEDS ? '' : color.group)
		setNotes(color.notes || '')
		setManager(color.manager || '')

		if (color.recipe) {
			const lines = color.recipe.split('\n')
			const parsedRecipes: Recipe[] = []
			let currentRecipe: Recipe | null = null

			lines.forEach(line => {
				const totalAmountMatch = line.match(/^Общее количество: (\d+)/)
				const materialMatch = line.match(/^Материал: (.+)/)
				const aniloxMatch = line.match(/^Анилокс: (.+)/)
				const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)
				const commentMatch = line.match(/^Комментарий: (.+)/)

				if (totalAmountMatch) {
					if (currentRecipe) {
						parsedRecipes.push(currentRecipe)
					}
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

			if (currentRecipe) {
				parsedRecipes.push(currentRecipe)
			}

			setRecipes(parsedRecipes)
		}
	}, [color])

	const addRecipe = () => {
		setRecipes([
			...recipes,
			{
				totalAmount: 0,
				material: '',
				items: [{ paint: '', amount: 0 }],
			},
		])
	}

	const duplicateRecipe = (index: number) => {
		const recipeToDuplicate = recipes[index]
		const duplicatedRecipe = {
			...recipeToDuplicate,
			items: recipeToDuplicate.items.map(item => ({ ...item })),
		}

		const newRecipes = [...recipes]
		newRecipes.splice(index + 1, 0, duplicatedRecipe)
		setRecipes(newRecipes)
	}

	const removeRecipe = (index: number) => {
		setRecipes(recipes.filter((_, i) => i !== index))
	}

	const updateRecipe = (index: number, updates: Partial<Recipe>) => {
		setRecipes(
			recipes.map((recipe, i) =>
				i === index ? { ...recipe, ...updates } : recipe
			)
		)
	}

	const addRecipeItem = (recipeIndex: number) => {
		setRecipes(
			recipes.map((recipe, i) =>
				i === recipeIndex
					? { ...recipe, items: [...recipe.items, { paint: '', amount: 0 }] }
					: recipe
			)
		)
	}

	const removeRecipeItem = (recipeIndex: number, itemIndex: number) => {
		setRecipes(
			recipes.map((recipe, i) =>
				i === recipeIndex
					? { ...recipe, items: recipe.items.filter((_, j) => j !== itemIndex) }
					: recipe
			)
		)
	}

	const updateRecipeItem = (
		recipeIndex: number,
		itemIndex: number,
		updates: Partial<{ paint: string; amount: number }>
	) => {
		setRecipes(
			recipes.map((recipe, i) =>
				i === recipeIndex
					? {
							...recipe,
							items: recipe.items.map((item, j) =>
								j === itemIndex ? { ...item, ...updates } : item
							),
					  }
					: recipe
			)
		)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		const finalHex = normalizeHexColor(hex.trim())

		const recipeString = recipes
			.map(recipe => {
				const lines = [
					`Общее количество: ${recipe.totalAmount}`,
					`Материал: ${recipe.material}`,
				]

				if (recipe.anilox) {
					lines.push(`Анилокс: ${recipe.anilox}`)
				}

				if (recipe.comment) {
					lines.push(`Комментарий: ${recipe.comment}`)
				}

				recipe.items
					.filter(item => item.paint.trim() !== '' && item.amount > 0)
					.forEach(item => {
						lines.push(`Краска: ${item.paint}, Количество: ${item.amount}`)
					})

				return lines.join('\n')
			})
			.join('\n\n')

		onSave({
			...color,
			name: name.trim(),
			hex: finalHex,
			recipe: recipeString || undefined,
			category: category || UNCATEGORIZED,
			group: group || UNCATEGORIZEDS,
			customers: customers
				.split(',')
				.map(c => c.trim())
				.filter(Boolean),
			inStock,
			notes: notes.trim() || undefined,
			manager: manager.trim() || undefined,
		})
	}

	const handleMaterialSelect = (material: string, recipeIndex: number) => {
		updateRecipe(recipeIndex, { material })
		setShowMaterialSuggestions(false)
	}

	const handleAniloxSelect = (anilox: string, recipeIndex: number) => {
		updateRecipe(recipeIndex, { anilox })
		setShowAniloxSuggestions(false)
	}

	const handlePaintSelect = (
		paint: string,
		recipeIndex: number,
		itemIndex: number
	) => {
		updateRecipeItem(recipeIndex, itemIndex, { paint })
		setShowPaintSuggestions(false)
	}

	const dropdownButtonClasses = `px-2 border-l-0 rounded-l-none rounded-r-md ${
		isDark
			? 'bg-gray-700 border-gray-600 text-gray-400 hover:text-gray-300'
			: 'bg-white border-gray-300 text-gray-500 hover:text-gray-700'
	} border`

	const inputClasses = `${baseClasses.input} ${
		isDark ? themeClasses.input.dark : themeClasses.input.light
	}`

	const primaryButtonClasses = `${baseClasses.button} ${
		isDark
			? themeClasses.button.primary.dark
			: themeClasses.button.primary.light
	} px-4 py-2 text-sm`

	const secondaryButtonClasses = `${baseClasses.button} ${
		isDark
			? themeClasses.button.secondary.dark
			: themeClasses.button.secondary.light
	} px-4 py-2 text-sm`

	// Обновленные классы для рецептов
	const recipeClasses = `p-4 rounded-xl transition-all duration-200 space-y-4 ${
		isDark ? themeClasses.recipe.dark : themeClasses.recipe.light
	}`

	const labelClasses = `block text-sm font-medium mb-1 ${
		isDark ? 'text-gray-300' : 'text-gray-700'
	}`

	const suggestionClasses = `absolute z-10 mt-1 w-full rounded-md border shadow-lg max-h-60 overflow-auto focus:outline-none text-sm ${
		isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
	}`

	const suggestionItemClasses = `cursor-default select-none relative py-2 pl-3 pr-9 ${
		isDark
			? 'text-gray-300 hover:bg-gray-700'
			: 'text-gray-900 hover:bg-gray-100'
	}`

	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel
					className={`${baseClasses.panel} ${
						isDark
							? 'bg-gray-900 border border-gray-700'
							: 'bg-white border border-gray-100'
					}`}
				>
					<div className='flex justify-between items-start mb-6'>
						<Dialog.Title
							className={`text-lg font-medium ${
								isDark ? 'text-gray-100' : 'text-gray-900'
							}`}
						>
							Редактировать цвет
						</Dialog.Title>
						<button
							onClick={onClose}
							className={`p-2 rounded-full ${
								isDark
									? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300'
									: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
							}`}
						>
							<X className='w-5 h-5' />
						</button>
					</div>

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='name' className={labelClasses}>
								Название
							</label>
							<input
								type='text'
								id='name'
								value={name}
								onChange={e => setName(e.target.value)}
								required
								className={inputClasses}
							/>
						</div>

						<div className='flex gap-4 items-end'>
							<div className='flex-1'>
								<label htmlFor='hex' className={labelClasses}>
									HEX код
								</label>
								<input
									type='text'
									id='hex'
									value={hex}
									onChange={e => setHex(e.target.value)}
									required
									pattern='^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
									className={inputClasses}
								/>
							</div>
							<div
								className='w-10 h-10 rounded-md border shadow-sm flex-shrink-0'
								style={{
									backgroundColor: normalizeHexColor(hex),
									borderColor: isDark
										? 'rgba(75, 85, 99, 0.6)'
										: 'rgba(209, 213, 219, 1)',
								}}
							/>
						</div>

						<div>
							<label htmlFor='category' className={labelClasses}>
								Категория
							</label>
							<select
								id='category'
								value={category}
								onChange={e => setCategory(e.target.value)}
								className={inputClasses}
							>
								<option value=''>Без категории</option>
								{categories.map(cat => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor='group' className={labelClasses}>
								Группа
							</label>
							<select
								id='group'
								value={group}
								onChange={e => setGroup(e.target.value)}
								className={inputClasses}
							>
								<option value=''>Без группы</option>
								{groups.map(gr => (
									<option key={gr} value={gr}>
										{gr}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor='customers' className={labelClasses}>
								Клиенты (через запятую)
							</label>
							<input
								type='text'
								id='customers'
								value={customers}
								onChange={e => setCustomers(e.target.value)}
								className={inputClasses}
							/>
						</div>

						<div>
							<label htmlFor='manager' className={labelClasses}>
								Менеджер
							</label>
							<input
								type='text'
								id='manager'
								value={manager}
								onChange={e => setManager(e.target.value)}
								className={inputClasses}
							/>
						</div>

						<div>
							<label htmlFor='notes' className={labelClasses}>
								Заметки
							</label>
							<textarea
								id='notes'
								value={notes}
								onChange={e => setNotes(e.target.value)}
								rows={3}
								className={inputClasses}
							/>
						</div>

						<div>
							<label className={labelClasses}>Рецепты</label>
							<div className={recipeClasses}>
								{recipes.map((recipe, recipeIndex) => (
									<div
										key={recipeIndex}
										className={`p-4 rounded-xl ${
											isDark
												? 'bg-gray-800 border border-gray-700'
												: 'bg-gray-50 border border-gray-200'
										}`}
									>
										<div className='flex justify-between items-start mb-4'>
											<h4
												className={`font-medium ${
													isDark ? 'text-gray-200' : 'text-gray-700'
												}`}
											>
												Рецепт {recipeIndex + 1}
											</h4>
											<div className='flex gap-2'>
												<button
													type='button'
													onClick={() => duplicateRecipe(recipeIndex)}
													className={secondaryButtonClasses}
												>
													<Copy className='w-4 h-4' />
												</button>
												<button
													type='button'
													onClick={() => removeRecipe(recipeIndex)}
													className={secondaryButtonClasses}
												>
													<X className='w-4 h-4' />
												</button>
											</div>
										</div>

										<div className='space-y-4'>
											<div className='grid grid-cols-2 gap-4'>
												<div className='relative'>
													<label className={`${labelClasses} text-xs`}>
														Материал
													</label>
													<div className='relative flex'>
														<input
															type='text'
															value={recipe.material}
															onChange={e => {
																updateRecipe(recipeIndex, {
																	material: e.target.value,
																})
																setSelectedRecipeIndex(recipeIndex)
															}}
															className={`${inputClasses} rounded-r-none`}
															onFocus={() => {
																setSelectedRecipeIndex(recipeIndex)
																setShowMaterialSuggestions(true)
																setShowAniloxSuggestions(false)
																setShowPaintSuggestions(false)
															}}
														/>
														<button
															type='button'
															onClick={() => {
																setSelectedRecipeIndex(recipeIndex)
																setShowMaterialSuggestions(
																	!showMaterialSuggestions
																)
																setShowAniloxSuggestions(false)
																setShowPaintSuggestions(false)
															}}
															className={dropdownButtonClasses}
														>
															<ChevronDown
																className={`w-4 h-4 transform transition-transform duration-200 ${
																	showMaterialSuggestions &&
																	selectedRecipeIndex === recipeIndex
																		? 'rotate-180'
																		: ''
																}`}
															/>
														</button>
													</div>
													{showMaterialSuggestions &&
														selectedRecipeIndex === recipeIndex && (
															<ul className={suggestionClasses}>
																{COMMON_MATERIALS.map((material, index) => (
																	<li
																		key={material}
																		className={suggestionItemClasses}
																		onClick={() =>
																			handleMaterialSelect(
																				material,
																				recipeIndex
																			)
																		}
																		role='option'
																		aria-selected={index === 0}
																	>
																		{material}
																	</li>
																))}
															</ul>
														)}
												</div>
												<div className='relative'>
													<label className={`${labelClasses} text-xs`}>
														Анилокс
													</label>
													<div className='relative flex'>
														<input
															type='text'
															value={recipe.anilox || ''}
															onChange={e => {
																updateRecipe(recipeIndex, {
																	anilox: e.target.value,
																})
																setSelectedRecipeIndex(recipeIndex)
															}}
															className={`${inputClasses} rounded-r-none`}
														/>
														<button
															type='button'
															onClick={() => {
																setSelectedRecipeIndex(recipeIndex)
																setShowAniloxSuggestions(!showAniloxSuggestions)
																setShowMaterialSuggestions(false)
																setShowPaintSuggestions(false)
															}}
															className={dropdownButtonClasses}
														>
															<ChevronDown
																className={`w-4 h-4 transform transition-transform duration-200 ${
																	showAniloxSuggestions &&
																	selectedRecipeIndex === recipeIndex
																		? 'rotate-180'
																		: ''
																}`}
															/>
														</button>
													</div>
													{showAniloxSuggestions &&
														selectedRecipeIndex === recipeIndex && (
															<ul className={suggestionClasses}>
																{COMMON_ANILOX.map((anilox, index) => (
																	<li
																		key={anilox}
																		className={suggestionItemClasses}
																		onClick={() =>
																			handleAniloxSelect(anilox, recipeIndex)
																		}
																		role='option'
																		aria-selected={index === 0}
																	>
																		{anilox}
																	</li>
																))}
															</ul>
														)}
												</div>
											</div>

											<div>
												<label className={`${labelClasses} text-xs`}>
													Общее количество (гр.)
												</label>
												<input
													type='number'
													value={recipe.totalAmount}
													onChange={e =>
														updateRecipe(recipeIndex, {
															totalAmount: parseInt(e.target.value),
														})
													}
													min='0'
													className={inputClasses}
												/>
											</div>

											<div>
												<label className={`${labelClasses} text-xs`}>
													Комментарий
												</label>
												<input
													type='text'
													value={recipe.comment || ''}
													onChange={e =>
														updateRecipe(recipeIndex, {
															comment: e.target.value,
														})
													}
													className={inputClasses}
												/>
											</div>

											<div className='space-y-2'>
												<label className={`${labelClasses} text-xs`}>
													Компоненты
												</label>
												{recipe.items.map((item, itemIndex) => (
													<div
														key={itemIndex}
														className={`p-4 rounded-xl ${
															isDark
																? 'bg-gray-700 border border-gray-600'
																: 'bg-white border border-gray-200'
														}`}
													>
														<div className='flex items-center gap-4'>
															<div className='flex-1 relative'>
																<label className={`${labelClasses} text-xs`}>
																	Название краски
																</label>
																<div className='flex'>
																	<input
																		type='text'
																		value={item.paint}
																		onChange={e => {
																			updateRecipeItem(recipeIndex, itemIndex, {
																				paint: e.target.value,
																			})
																			setSelectedRecipeIndex(recipeIndex)
																			setSelectedItemIndex(itemIndex)
																		}}
																		className={`${inputClasses} rounded-r-none`}
																	/>
																	<button
																		type='button'
																		onClick={() => {
																			setSelectedRecipeIndex(recipeIndex)
																			setSelectedItemIndex(itemIndex)
																			setShowPaintSuggestions(
																				!showPaintSuggestions
																			)
																			setShowMaterialSuggestions(false)
																			setShowAniloxSuggestions(false)
																		}}
																		className={dropdownButtonClasses}
																	>
																		<ChevronDown
																			className={`w-4 h-4 transform transition-transform duration-200 ${
																				showPaintSuggestions &&
																				selectedRecipeIndex === recipeIndex &&
																				selectedItemIndex === itemIndex
																					? 'rotate-180'
																					: ''
																			}`}
																		/>
																	</button>
																</div>
																{showPaintSuggestions &&
																	selectedRecipeIndex === recipeIndex &&
																	selectedItemIndex === itemIndex && (
																		<ul className={suggestionClasses}>
																			{COMMON_PAINTS.map((paint, index) => (
																				<li
																					key={paint}
																					className={suggestionItemClasses}
																					onClick={() =>
																						handlePaintSelect(
																							paint,
																							recipeIndex,
																							itemIndex
																						)
																					}
																					role='option'
																					aria-selected={index === 0}
																				>
																					{paint}
																				</li>
																			))}
																		</ul>
																	)}
															</div>
															<div className='w-60'>
																<label className={`${labelClasses} text-xs`}>
																	Количество (гр.)
																</label>
																<input
																	type='number'
																	value={item.amount}
																	onChange={e =>
																		updateRecipeItem(recipeIndex, itemIndex, {
																			amount: parseInt(e.target.value),
																		})
																	}
																	min='0'
																	className={inputClasses}
																/>
															</div>
															<button
																type='button'
																onClick={() =>
																	removeRecipeItem(recipeIndex, itemIndex)
																}
																className={`self-end p-3 rounded-md ${
																	isDark
																		? 'hover:bg-gray-600 text-gray-400 hover:text-gray-300'
																		: 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
																}`}
															>
																<X className='w-5 h-5' />
															</button>
														</div>
													</div>
												))}
												<button
													type='button'
													onClick={() => addRecipeItem(recipeIndex)}
													className={primaryButtonClasses}
												>
													<Plus className='w-4 h-4' />
													<span>Добавить компонент</span>
												</button>
											</div>
										</div>
									</div>
								))}
								<button
									type='button'
									onClick={addRecipe}
									className={secondaryButtonClasses}
								>
									<Plus className='w-4 h-4' />
									<span>Добавить рецепт</span>
								</button>
							</div>
						</div>

						<div className='flex items-center'>
							<input
								type='checkbox'
								id='inStock'
								checked={inStock}
								onChange={e => setInStock(e.target.checked)}
								className={`rounded ${
									isDark ? 'bg-gray-700 border-gray-600' : 'border-gray-300'
								}`}
							/>
							<label htmlFor='inStock' className={`ml-2 ${labelClasses}`}>
								В наличии
							</label>
						</div>

						<div className='flex justify-end space-x-3'>
							<button
								type='button'
								onClick={onClose}
								className={`px-4 py-2 text-sm font-medium rounded-md ${
									isDark
										? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							>
								Отмена
							</button>
							<button
								type='submit'
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
							>
								Сохранить
							</button>
						</div>
					</form>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
