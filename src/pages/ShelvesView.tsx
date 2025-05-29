import { useEffect, useState } from 'react'
import type { PantoneColor } from '@/types'
import { getColors, updateColor } from '@lib/colors'
import { Link } from 'react-router-dom'
import { Dialog } from '@headlessui/react'
import { X } from 'lucide-react'
import { deleteField } from 'firebase/firestore'

// TODO: Получить реальные цвета из props или контекста
// const exampleColors: PantoneColor[] = [];

// Конфигурация для стеллажей 1 и 6
// const SHELVES_1_6 = [1, 6];
const SHELF_COUNT = 5
const BUCKETS_PER_ROW = 4

// Стеллажи 2-5
const SHELVES_2_5 = [2, 3, 4, 5]
const SHELF_COUNT_2_5 = 4

// Мапа для подписей стеллажей
const SHELF_LABELS: Record<number, string> = {
	1: '1 (беж/кор)',
	2: '2 (зеленые)',
	3: '3 (красные)',
	4: '4 (синие)',
	5: '5',
	6: '6',
}

// Функция для поиска всех цветов в конкретной позиции (стеллаж, секция, полка)
// function findColorsInPosition(colors: PantoneColor[], shelfId: number, section: number, shelfLevel: number) { ... }

// Функция для поиска цвета по точному местоположению (стеллаж полка/секция/ряд/позиция)
function findColorByLocation(colors: PantoneColor[], location: string) {
	return colors.find(color => {
		if (!color.shelfLocation) return false
		// Поддержка старого и нового формата
		// Новый формат: 1 4/2/1/1
		// Старый формат: 1 4/2 (будет найден только если location совпадает без /ряд/позиция)
		return color.shelfLocation.replace(/\\/g, '/') === location
	})
}

// Вспомогательная функция для поиска всех цветов на полке/секции (и части)
function findColorsInShelf(
	colors: PantoneColor[],
	shelfId: number,
	sectionNumber: number,
	shelfLevel: number,
	part?: string
) {
	// part используется только для стеллажей 2-5
	return colors.filter(color => {
		if (!color.shelfLocation) return false
		const loc = color.shelfLocation.replace(/\\/g, '/')
		if (part) {
			// Формат: "2 Левая 1/4/1/1" или "2 Левая 1/4"
			return loc.startsWith(`${shelfId} ${part} ${sectionNumber}/${shelfLevel}`)
		} else {
			// Формат: "1 1/4/1/1" или "1 1/4"
			return loc.startsWith(`${shelfId} ${sectionNumber}/${shelfLevel}`)
		}
	})
}

// Для стеллажей 2-5: левая и правая часть, в каждой части — секция 1 и секция 2
function ShelfPart({
	shelfId,
	partName,
	shelfCount,
	colors,
	setSelectedCell,
}: {
	shelfId: number
	partName: string // 'Левая часть' или 'Правая часть'
	shelfCount: number
	colors: PantoneColor[]
	setSelectedCell: (cell: {
		shelfId: number
		sectionNumber: number
		shelfLevel: number
		part?: string
		rowIdx: number
		bucketIdx: number
	}) => void
}) {
	const usedColorIds = new Set<string>()
	const part = partName.toLowerCase().includes('левая') ? 'Левая' : 'Правая'

	return (
		<div>
			<div className='text-center text-xs font-bold mb-2'>{partName}</div>
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
				{[2, 1].map(sectionNumber => (
					<div key={sectionNumber}>
						<div className='text-center text-xs font-semibold mb-1'>
							Секция {sectionNumber}
						</div>
						<div className='flex flex-col gap-2'>
							{[...Array(shelfCount)].map((_, shelfIdx) => {
								const shelfLevel = shelfCount - shelfIdx
								const shelfColors = findColorsInShelf(
									colors,
									shelfId,
									sectionNumber,
									shelfLevel,
									part
								)
								const bucketCount = Math.max(8, shelfColors.length + 1)
								const buckets = []
								for (let i = 0; i < bucketCount; i++) {
									buckets.push(i)
								}
								const rows = []
								for (let i = 0; i < bucketCount; i += BUCKETS_PER_ROW) {
									rows.push(buckets.slice(i, i + BUCKETS_PER_ROW))
								}
								const showScroll = bucketCount > 8
								return (
									<div
										key={shelfIdx}
										className='border rounded p-2 mb-1 bg-gray-50'
									>
										<div className='text-xs font-semibold mb-1 text-gray-700 text-center'>
											Секция {sectionNumber} / Полка {shelfLevel}
										</div>
										<div
											className={
												showScroll
													? 'flex flex-col gap-1 overflow-y-auto h-[112px] sm:h-[120px] pr-1'
													: 'flex flex-col gap-1 h-[112px] sm:h-[120px]'
											}
											style={{ maxHeight: 'none' }}
										>
											{rows.map((row, rowIdx) => (
												<div key={rowIdx} className='grid grid-cols-4 gap-2'>
													{row.map((bucketIdx, i) => {
														const shortLocation = `${shelfId} ${part} ${sectionNumber}/${shelfLevel}`
														const fullLocation = `${shelfId} ${part} ${sectionNumber}/${shelfLevel}/${
															rowIdx + 1
														}/${(bucketIdx % BUCKETS_PER_ROW) + 1}`
														let color = findColorByLocation(
															colors,
															fullLocation
														)
														if (!color) {
															const candidate = colors.find(
																c =>
																	c.shelfLocation &&
																	c.shelfLocation.replace(/\\/g, '/') ===
																		shortLocation &&
																	!usedColorIds.has(c.id)
															)
															if (candidate) {
																color = candidate
																usedColorIds.add(candidate.id)
															}
														}
														if (
															color &&
															color.shelfLocation &&
															color.shelfLocation.replace(/\\/g, '/') ===
																shortLocation
														) {
															usedColorIds.add(color.id)
														}
														return (
															<div
																key={i}
																className={`w-14 h-14 sm:w-12 sm:h-12 border-2 rounded flex flex-col items-center justify-center text-[8px] sm:text-[11px] font-bold transition-colors duration-200 overflow-hidden ${
																	color ? '' : 'bg-gray-200 text-gray-400'
																}`}
																style={
																	color ? { backgroundColor: color.hex } : {}
																}
																title={
																	color
																		? color.name +
																		  (color.alternativeName
																				? ` (${color.alternativeName})`
																				: '')
																		: 'Свободно'
																}
																onClick={() =>
																	setSelectedCell({
																		shelfId,
																		sectionNumber,
																		shelfLevel,
																		part:
																			typeof part !== 'undefined'
																				? part
																				: undefined,
																		rowIdx,
																		bucketIdx,
																	})
																}
															>
																{color ? (
																	<>
																		<span className='text-[8px] text-white text-center w-full truncate'>
																			{color.name}
																		</span>
																		{color.alternativeName && (
																			<span className='text-[8px] text-white text-center w-full truncate'>
																				{color.alternativeName}
																			</span>
																		)}
																	</>
																) : (
																	''
																)}
															</div>
														)
													})}
												</div>
											))}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

// Для стеллажей 1 и 6: только одна часть, но две секции (1 и 2) на каждой полке
function ShelfSinglePart({
	shelfId,
	shelfCount,
	colors,
	setSelectedCell,
}: {
	shelfId: number
	shelfCount: number
	colors: PantoneColor[]
	setSelectedCell: (cell: {
		shelfId: number
		sectionNumber: number
		shelfLevel: number
		part?: string
		rowIdx: number
		bucketIdx: number
	}) => void
}) {
	const usedColorIds = new Set<string>()

	return (
		<div>
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
				{[2, 1].map(sectionNumber => (
					<div key={sectionNumber}>
						<div className='text-center text-xs font-semibold mb-1'>
							Секция {sectionNumber}
						</div>
						<div className='flex flex-col gap-2'>
							{[...Array(shelfCount)].map((_, shelfIdx) => {
								const shelfLevel = shelfCount - shelfIdx
								const shelfColors = findColorsInShelf(
									colors,
									shelfId,
									sectionNumber,
									shelfLevel
								)
								const bucketCount = Math.max(8, shelfColors.length + 1)
								const buckets = []
								for (let i = 0; i < bucketCount; i++) {
									buckets.push(i)
								}
								const rows = []
								for (let i = 0; i < bucketCount; i += BUCKETS_PER_ROW) {
									rows.push(buckets.slice(i, i + BUCKETS_PER_ROW))
								}
								const showScroll = bucketCount > 8
								return (
									<div
										key={shelfIdx}
										className='border rounded p-2 mb-1 bg-gray-50'
									>
										<div className='text-xs font-semibold mb-1 text-gray-700 text-center'>
											Секция {sectionNumber}/ Полка {shelfLevel}
										</div>
										<div
											className={
												showScroll
													? 'flex flex-col gap-1 overflow-y-auto h-[112px] sm:h-[120px] pr-1'
													: 'flex flex-col gap-1 h-[112px] sm:h-[120px]'
											}
											style={{ maxHeight: 'none' }}
										>
											{rows.map((row, rowIdx) => (
												<div key={rowIdx} className='grid grid-cols-4 gap-2'>
													{row.map((bucketIdx, i) => {
														const shortLocation = `${shelfId} ${sectionNumber}/${shelfLevel}`
														const fullLocation = `${shelfId} ${sectionNumber}/${shelfLevel}/${
															rowIdx + 1
														}/${(bucketIdx % BUCKETS_PER_ROW) + 1}`
														let color = findColorByLocation(
															colors,
															fullLocation
														)
														if (!color) {
															const candidate = colors.find(
																c =>
																	c.shelfLocation &&
																	c.shelfLocation.replace(/\\/g, '/') ===
																		shortLocation &&
																	!usedColorIds.has(c.id)
															)
															if (candidate) {
																color = candidate
																usedColorIds.add(candidate.id)
															}
														}
														if (
															color &&
															color.shelfLocation &&
															color.shelfLocation.replace(/\\/g, '/') ===
																shortLocation
														) {
															usedColorIds.add(color.id)
														}
														return (
															<div
																key={i}
																className={`w-14 h-14 sm:w-12 sm:h-12 border-2 rounded flex flex-col items-center justify-center text-[8px] sm:text-[11px] font-bold transition-colors duration-200 overflow-hidden ${
																	color ? '' : 'bg-gray-200 text-gray-400'
																}`}
																style={
																	color ? { backgroundColor: color.hex } : {}
																}
																title={
																	color
																		? color.name +
																		  (color.alternativeName
																				? ` (${color.alternativeName})`
																				: '')
																		: 'Свободно'
																}
																onClick={() =>
																	setSelectedCell({
																		shelfId,
																		sectionNumber,
																		shelfLevel,
																		part: undefined,
																		rowIdx,
																		bucketIdx,
																	})
																}
															>
																{color ? (
																	<>
																		<span className='text-[8px] text-white text-center w-full truncate'>
																			{color.name}
																		</span>
																		{color.alternativeName && (
																			<span className='text-[8px] text-white text-center w-full truncate'>
																				{color.alternativeName}
																			</span>
																		)}
																	</>
																) : (
																	''
																)}
															</div>
														)
													})}
												</div>
											))}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}

export default function ShelvesView() {
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// Новое состояние для выбранной ячейки и поиска
	const [selectedCell, setSelectedCell] = useState<{
		shelfId: number
		sectionNumber: number
		shelfLevel: number
		part?: string
		rowIdx: number
		bucketIdx: number
	} | null>(null)
	const [search, setSearch] = useState('')

	useEffect(() => {
		setLoading(true)
		getColors()
			.then(data => {
				setColors(data)
				setLoading(false)
			})
			.catch(() => {
				setError('Ошибка загрузки цветов')
				setLoading(false)
			})
	}, [])

	if (loading) {
		return <div className='p-6 text-lg'>Загрузка цветов...</div>
	}
	if (error) {
		return <div className='p-6 text-lg text-red-600'>{error}</div>
	}

	// Функция для генерации shelfLocation по selectedCell
	function getCellLocation(cell: typeof selectedCell) {
		if (!cell) return ''
		if (cell.part) {
			return `${cell.shelfId} ${cell.part} ${cell.sectionNumber}/${
				cell.shelfLevel
			}/${cell.rowIdx + 1}/${(cell.bucketIdx % BUCKETS_PER_ROW) + 1}`
		} else {
			return `${cell.shelfId} ${cell.sectionNumber}/${cell.shelfLevel}/${
				cell.rowIdx + 1
			}/${(cell.bucketIdx % BUCKETS_PER_ROW) + 1}`
		}
	}

	// Найти цвет в выбранной ячейке
	const currentCellColor = selectedCell
		? findColorByLocation(colors, getCellLocation(selectedCell))
		: null

	// Обработчик выбора цвета
	async function handleSelectColor(color: PantoneColor) {
		if (!selectedCell) return
		const location = getCellLocation(selectedCell)
		await updateColor(color.id, { shelfLocation: location })
		setColors(prev =>
			prev.map(c =>
				c.id === color.id
					? { ...c, shelfLocation: location }
					: c.shelfLocation === location
					? { ...c, shelfLocation: undefined }
					: c
			)
		)
		setSelectedCell(null)
		setSearch('')
	}

	// Обработчик очистки ячейки
	async function handleClearCell() {
		if (!selectedCell) return
		const location = getCellLocation(selectedCell)
		const color = colors.find(
			c => c.shelfLocation && c.shelfLocation.replace(/\\/g, '/') === location
		)
		console.log('Очистка ячейки:', location, color)
		if (color) {
			await updateColor(color.id, { shelfLocation: deleteField() } as any)
			setColors(prev =>
				prev.map(c =>
					c.id === color.id ? { ...c, shelfLocation: undefined } : c
				)
			)
		}
		setSelectedCell(null)
		setSearch('')
	}

	// Перед рендером модалки:
	const cellLocation = selectedCell ? getCellLocation(selectedCell) : ''
	const canClearCell =
		currentCellColor &&
		currentCellColor.shelfLocation &&
		currentCellColor.shelfLocation.replace(/\\/g, '/') === cellLocation

	return (
		<div className='p-6'>
			<div className='mb-4'>
				<Link
					to='/'
					className='inline-block px-4 py-2 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium transition-colors'
				>
					← К списку цветов
				</Link>
			</div>
			<h1 className='text-2xl font-bold mb-6'>Схема стеллажей</h1>
			<div className='flex gap-8 flex-wrap'>
				{/* Стеллажи 1 и 6 */}
				{[1, 6].map(shelfId => (
					<div
						key={shelfId}
						className='border rounded-lg p-4 bg-white shadow-md min-w-[340px]'
					>
						<h2 className='font-semibold mb-4'>
							Стеллаж {SHELF_LABELS[shelfId] || shelfId}
						</h2>
						<ShelfSinglePart
							shelfId={shelfId}
							shelfCount={SHELF_COUNT}
							colors={colors}
							setSelectedCell={setSelectedCell}
						/>
					</div>
				))}
				{/* Стеллажи 2-5 */}
				{SHELVES_2_5.map(shelfId => (
					<div
						key={shelfId}
						className='border rounded-lg p-4 bg-white shadow-md min-w-[600px]'
					>
						<h2 className='font-semibold mb-4'>
							Стеллаж {SHELF_LABELS[shelfId] || shelfId}
						</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-8'>
							<ShelfPart
								shelfId={shelfId}
								partName='Левая часть'
								shelfCount={SHELF_COUNT_2_5}
								colors={colors}
								setSelectedCell={setSelectedCell}
							/>
							<div className='my-4 border-t border-gray-200 sm:hidden' />
							<ShelfPart
								shelfId={shelfId}
								partName='Правая часть'
								shelfCount={SHELF_COUNT_2_5}
								colors={colors}
								setSelectedCell={setSelectedCell}
							/>
						</div>
					</div>
				))}
			</div>

			{/* Модальное окно выбора цвета */}
			<Dialog
				open={!!selectedCell}
				onClose={() => setSelectedCell(null)}
				className='relative z-50'
			>
				<div className='fixed inset-0 bg-black/30' aria-hidden='true' />
				<div className='fixed inset-0 flex items-center justify-center p-4'>
					<Dialog.Panel className='mx-auto max-w-lg w-full rounded-lg p-6 bg-white'>
						<div className='flex justify-between items-center mb-4'>
							<Dialog.Title className='text-lg font-bold'>
								Выбор цвета
							</Dialog.Title>
							<button
								onClick={() => setSelectedCell(null)}
								className='p-2 rounded-full hover:bg-gray-100'
							>
								<X className='w-5 h-5' />
							</button>
						</div>
						<input
							type='text'
							placeholder='Поиск по названию'
							value={search}
							onChange={e => setSearch(e.target.value)}
							className='mb-2 p-2 border rounded w-full'
						/>
						<div className='max-h-60 overflow-y-auto'>
							{colors
								.filter(c =>
									c.name.toLowerCase().includes(search.toLowerCase())
								)
								.map(color => (
									<div
										key={color.id}
										className='p-2 hover:bg-gray-100 cursor-pointer rounded flex items-center gap-2'
										style={{ backgroundColor: color.hex + '22' }}
										onClick={() => handleSelectColor(color)}
									>
										<div
											className='w-6 h-6 rounded'
											style={{ backgroundColor: color.hex }}
										/>
										<div className='flex flex-col'>
											<span>{color.name}</span>
											{color.alternativeName && (
												<span className='text-xs text-gray-500'>
													{color.alternativeName}
												</span>
											)}
										</div>
									</div>
								))}
						</div>
						{canClearCell && (
							<button
								className='mt-4 w-full py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-semibold'
								onClick={handleClearCell}
							>
								Очистить ячейку
							</button>
						)}
					</Dialog.Panel>
				</div>
			</Dialog>
		</div>
	)
}
