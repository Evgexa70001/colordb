import React from 'react'
import { Dialog } from '@headlessui/react'
import type { ColorDetailsModalProps } from '../types'

export default function ColorDetailsModal({
	color,
	isOpen,
	onClose,
	similarColors,
}: ColorDetailsModalProps) {
	return (
		<Dialog open={isOpen} onClose={onClose} className='relative z-50'>
			<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
			<div className='fixed inset-0 flex items-center justify-center p-4'>
				<Dialog.Panel className='mx-auto max-w-2xl w-full rounded-lg bg-white p-6'>
					<Dialog.Title className='text-2xl font-bold mb-6'>
						{color.name} ({color.id})
					</Dialog.Title>

					<div className='space-y-6'>
						<div className='flex items-start space-x-6'>
							<div
								className='w-32 h-32 rounded-lg shadow-md flex-shrink-0'
								style={{ backgroundColor: color.hex }}
							/>
							<div className='space-y-3'>
								<p>
									<strong>HEX:</strong> {color.hex}
								</p>
								<p>
									<strong>Категория:</strong> {color.category}
								</p>
								{color.recipe && (
									<p>
										<strong>Рецепт:</strong> {color.recipe}
									</p>
								)}
								{color.customers && color.customers.length > 0 && (
									<p>
										<strong>Заказчики:</strong> {color.customers.join(', ')}
									</p>
								)}
								<p>
									<strong>Статус:</strong>{' '}
									<span
										className={
											color.inStock ? 'text-green-600' : 'text-red-600'
										}
									>
										{color.inStock ? 'В наличии' : 'Отсутствует'}
									</span>
								</p>
							</div>
						</div>

						<div>
							<h3 className='text-lg font-semibold mb-4'>Похожие цвета</h3>
							<div className='grid grid-cols-5 gap-4'>
								{similarColors.map(similarColor => (
									<div key={similarColor.id} className='space-y-2'>
										<div
											className='w-full h-20 rounded-lg shadow-sm'
											style={{ backgroundColor: similarColor.hex }}
										/>
										<p className='text-sm font-medium'>{similarColor.name}</p>
										<p className='text-xs text-gray-600'>{similarColor.id}</p>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className='mt-6 flex justify-end'>
						<button
							onClick={onClose}
							className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
						>
							Закрыть
						</button>
					</div>
				</Dialog.Panel>
			</div>
		</Dialog>
	)
}
