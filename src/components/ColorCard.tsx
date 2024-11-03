import React from 'react'
import { Edit, Trash2 } from 'lucide-react'
import type { PantoneColor } from '../types'

interface ColorCardProps {
	color: PantoneColor
	onEdit: () => void
	onClick: () => void
	onDelete: () => void
}

export default function ColorCard({
	color,
	onEdit,
	onClick,
	onDelete,
}: ColorCardProps) {
	return (
		<div
			className='relative group cursor-pointer bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105'
			onClick={onClick}
		>
			<div className='h-40' style={{ backgroundColor: color.hex }} />
			<div className='p-4 space-y-3'>
				<div>
					<h3 className='text-lg font-semibold'>{color.name}</h3>
					<p className='text-sm text-gray-600'>{color.id}</p>
				</div>

				{color.recipe && (
					<div>
						<p className='text-sm font-medium text-gray-700'>Рецепт:</p>
						<p className='text-sm text-gray-600 line-clamp-2'>{color.recipe}</p>
					</div>
				)}

				{color.customers && color.customers.length > 0 && (
					<div>
						<p className='text-sm font-medium text-gray-700'>Заказчики:</p>
						<p className='text-sm text-gray-600 line-clamp-1'>
							{color.customers.join(', ')}
						</p>
					</div>
				)}

				<div className='flex items-center justify-between'>
					<span
						className={`px-2 py-1 rounded-full text-xs ${
							color.inStock
								? 'bg-green-100 text-green-800'
								: 'bg-red-100 text-red-800'
						}`}
					>
						{color.inStock ? 'В наличии' : 'Отсутствует'}
					</span>
					<div className='flex items-center space-x-2'>
						<button
							onClick={e => {
								e.stopPropagation()
								onEdit()
							}}
							className='p-2 rounded-full hover:bg-gray-100'
						>
							<Edit className='w-4 h-4' />
						</button>
						<button
							onClick={e => {
								e.stopPropagation()
								if (confirm('Вы уверены, что хотите удалить этот цвет?')) {
									onDelete()
								}
							}}
							className='p-2 rounded-full hover:bg-gray-100 text-red-600 hover:text-red-700'
						>
							<Trash2 className='w-4 h-4' />
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}
