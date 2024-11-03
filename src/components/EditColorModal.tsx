import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import type { ColorModalProps } from '../types'

export default function EditColorModal({
	color,
	isOpen,
	onClose,
	onSave,
	categories,
}: ColorModalProps) {
	const [name, setName] = useState(color.name)
	const [hex, setHex] = useState(color.hex)
	const [recipe, setRecipe] = useState(color.recipe || '')
	const [customers, setCustomers] = useState(color.customers?.join(', ') || '')
	const [inStock, setInStock] = useState(color.inStock)
	const [category, setCategory] = useState(color.category)

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSave({
			...color,
			name,
			hex,
			recipe,
			category,
			customers: customers
				.split(',')
				.map(c => c.trim())
				.filter(Boolean),
			inStock,
		})
	}

	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel className='mx-auto max-w-lg rounded-lg bg-white p-6'>
					<Dialog.Title className='text-lg font-medium mb-4'>
						Edit {color.name}
					</Dialog.Title>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Name
							</label>
							<input
								type='text'
								value={name}
								onChange={e => setName(e.target.value)}
								required
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700'>
								HEX Color
							</label>
							<div className='mt-1 flex items-center space-x-2'>
								<input
									type='text'
									value={hex}
									onChange={e => setHex(e.target.value)}
									pattern='^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'
									required
									className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
								/>
								<div
									className='w-10 h-10 rounded border'
									style={{ backgroundColor: hex }}
								/>
							</div>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Category
							</label>
							<select
								value={category}
								onChange={e => setCategory(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							>
								{categories.map(cat => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Recipe
							</label>
							<textarea
								value={recipe}
								onChange={e => setRecipe(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
								rows={3}
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Customers (comma separated)
							</label>
							<input
								type='text'
								value={customers}
								onChange={e => setCustomers(e.target.value)}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							/>
						</div>

						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Stock Status
							</label>
							<select
								value={inStock.toString()}
								onChange={e => setInStock(e.target.value === 'true')}
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							>
								<option value='true'>In Stock</option>
								<option value='false'>Out of Stock</option>
							</select>
						</div>

						<div className='flex justify-end space-x-3 mt-6'>
							<button
								type='button'
								onClick={onClose}
								className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
							>
								Cancel
							</button>
							<button
								type='submit'
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
							>
								Save
							</button>
						</div>
					</form>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
