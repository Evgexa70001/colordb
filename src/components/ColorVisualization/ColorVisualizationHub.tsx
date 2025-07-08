// import React, { useState } from 'react'
import { PantoneColor } from '@/types'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button/Button'
import ColorMap2D from './ColorMap2D'

interface ColorVisualizationHubProps {
	colors: PantoneColor[]
	selectedColor?: PantoneColor
	compareWith?: PantoneColor
	onCompareWith?: (color: PantoneColor | undefined) => void
}

const ColorVisualizationHub: React.FC<ColorVisualizationHubProps> = ({
	colors,
	selectedColor,
	compareWith,
	onCompareWith,
}) => {
	const { isDark } = useTheme()



	const handleSetCompareColor = () => {
		if (selectedColor && onCompareWith) {
			onCompareWith(selectedColor)
		}
	}

	const handleClearCompareColor = () => {
		if (onCompareWith) {
			onCompareWith(undefined)
		}
	}

	// Фильтруем цвета с LAB значениями для 2D визуализации
	const colorsWithLab = colors.filter(color => color.labValues)

	return (
		<div
			className={`space-y-6 p-6 rounded-xl border ${
				isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
			} shadow-sm`}
		>
			{/* Заголовок */}
			<div className='flex items-center justify-between'>
				<div>
					<h2
						className={`text-2xl font-bold ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						2D карта цветов
					</h2>
					<p
						className={`mt-1 text-sm ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						Интерактивная карта цветов в пространстве a*b* с настройкой
						светлости
					</p>
				</div>

				{/* Статистика */}
				<div
					className={`text-right text-sm ${
						isDark ? 'text-gray-400' : 'text-gray-600'
					}`}
				>
					<div>Всего цветов: {colors.length}</div>
					<div>С LAB данными: {colorsWithLab.length}</div>
					{selectedColor && (
						<div className='mt-1 font-medium'>Выбран: {selectedColor.name}</div>
					)}
				</div>
			</div>

			{/* Панель управления сравнением */}
			{selectedColor && (
				<div
					className={`p-4 rounded-lg border ${
						isDark
							? 'bg-gray-700 border-gray-600'
							: 'bg-gray-50 border-gray-200'
					}`}
				>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div
								className='w-6 h-6 rounded border-2 border-white shadow-sm'
								style={{ backgroundColor: selectedColor.hex }}
							/>
							<div>
								<div
									className={`font-medium ${
										isDark ? 'text-white' : 'text-gray-900'
									}`}
								>
									{selectedColor.name}
								</div>
								{selectedColor.labValues && (
									<div
										className={`text-xs ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										L*: {selectedColor.labValues.l.toFixed(1)}, a*:{' '}
										{selectedColor.labValues.a.toFixed(1)}, b*:{' '}
										{selectedColor.labValues.b.toFixed(1)}
									</div>
								)}
							</div>
						</div>

						<div className='flex gap-2'>
							{!compareWith ? (
								<Button
									variant='outline'
									size='sm'
									onClick={handleSetCompareColor}
								>
									Добавить для сравнения
								</Button>
							) : (
								<div className='flex items-center gap-2'>
									<span
										className={`text-sm ${
											isDark ? 'text-gray-400' : 'text-gray-600'
										}`}
									>
										Сравнивается с: {compareWith.name}
									</span>
									<Button
										variant='outline'
										size='sm'
										onClick={handleClearCompareColor}
									>
										Очистить
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* 2D карта цветов */}
			<div className='space-y-4'>
				<div
					className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
				>
					2D карта цветов в координатах a*b* с регулировкой уровня светлости L*.
				</div>
				{colorsWithLab.length > 0 ? (
					<ColorMap2D />
				) : (
					<div
						className={`text-center py-12 ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						Нет цветов с LAB данными для отображения
					</div>
				)}
			</div>

			{/* Подсказки */}
			<div
				className={`p-4 rounded-lg border ${
					isDark
						? 'bg-gray-700/50 border-gray-600'
						: 'bg-blue-50 border-blue-200'
				}`}
			>
				<div
					className={`text-sm ${isDark ? 'text-gray-300' : 'text-blue-800'}`}
				>
					<strong>Подсказки:</strong>
					<ul className='mt-1 space-y-1 text-xs'>
						<li>
							• Используйте ползунок светлости для фильтрации цветов по L*
						</li>
						<li>
							• Настройте допуск для отображения цветов в заданном диапазоне
						</li>
						<li>• Нажмите "Показать все цвета" для полного обзора коллекции</li>
						<li>
							• Кликните на цвет для выбора, двойной клик для поиска ближайшего
						</li>
						<li>
							• Включите "показать только похожие цвета" для анализа близких
							оттенков
						</li>
					</ul>
				</div>
			</div>
		</div>
	)
}

export default ColorVisualizationHub
