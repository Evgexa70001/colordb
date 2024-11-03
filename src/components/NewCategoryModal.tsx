import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import type { NewCategoryModalProps } from '../types'

export default function NewCategoryModal({
	isOpen,
	onClose,
	onSave,
	existingCategories,
}: NewCategoryModalProps) {
	const [category, setCategory] = useState('')

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (existingCategories.includes(category)) {
			alert('Такая категория уже существует')
			return
		}
		onSave(category)
		onClose()
		setCategory('')
	}

	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel className='mx-auto max-w-lg w-full rounded-lg bg-white p-6'>
					<Dialog.Title className='text-lg font-medium mb-4'>
						Добавить новую категорию
					</Dialog.Title>

					<form onSubmit={handleSubmit} className='space-y-4'>
						<div>
							<label className='block text-sm font-medium text-gray-700'>
								Название категории
							</label>
							<input
								type='text'
								value={category}
								onChange={e => setCategory(e.target.value)}
								required
								className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
							/>
						</div>

						<div className='flex justify-end space-x-3 mt-6'>
							<button
								type='button'
								onClick={onClose}
								className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
							>
								Отмена
							</button>
							<button
								type='submit'
								className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
							>
								Добавить
							</button>
						</div>
					</form>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
