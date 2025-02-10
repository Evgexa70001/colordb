import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type SortField = 'name' | 'inStock' | 'createdAt'
type SortOrder = 'asc' | 'desc'

interface SortControlsProps {
	sortField: SortField
	sortOrder: SortOrder
	onSortChange: (field: SortField) => void
}

export default function SortControls({
	sortField,
	sortOrder,
	onSortChange,
}: SortControlsProps) {
	return (
		<div className='flex flex-col gap-2'>
			<Button
				variant={sortField === 'name' ? 'primary' : 'secondary'}
				justified
				onClick={() => onSortChange('name')}
				rightIcon={
					<ChevronUp
						className={cn(
							'w-4 h-4 transition-transform duration-200',
							sortField === 'name' && sortOrder === 'desc' && 'rotate-180'
						)}
					/>
				}
			>
				По названию
			</Button>
			<Button
				variant={sortField === 'inStock' ? 'primary' : 'secondary'}
				justified
				rightIcon={
					<ChevronUp
						className={cn(
							'w-4 h-4 transition-transform duration-200',
							sortField === 'inStock' && sortOrder === 'desc' && 'rotate-180'
						)}
					/>
				}
				onClick={() => onSortChange('inStock')}
			>
				По наличию
			</Button>
			<Button
				variant={sortField === 'createdAt' ? 'primary' : 'secondary'}
				justified
				rightIcon={
					<ChevronUp
						className={cn(
							'w-4 h-4 transition-transform duration-200',
							sortField === 'createdAt' && sortOrder === 'desc' && 'rotate-180'
						)}
					/>
				}
				onClick={() => onSortChange('createdAt')}
			>
				По дате создания
			</Button>
		</div>
	)
}
