import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PantoneColor } from '@/types'
import { getColors } from '@/lib/colors'
import { useTheme } from '@/contexts/ThemeContext'
import ColorVisualizationHub from '@/components/ColorVisualization/ColorVisualizationHub'
import { Button } from '@/components/ui/Button/Button'

const ColorVisualization: React.FC = () => {
	const [colors, setColors] = useState<PantoneColor[]>([])
	const [selectedColor, setSelectedColor] = useState<PantoneColor | undefined>()
	const [compareWith, setCompareWith] = useState<PantoneColor | undefined>()
	const [loading, setLoading] = useState(true)
	const { isDark } = useTheme()

	useEffect(() => {
		loadColors()
	}, [])

	const loadColors = async () => {
		try {
			setLoading(true)
			const colorsData = await getColors()
			setColors(colorsData)
		} catch (error) {
			console.error('Ошибка загрузки цветов:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleColorSelect = (color: PantoneColor) => {
		setSelectedColor(color)
	}

	const handleCompareWith = (color: PantoneColor | undefined) => {
		setCompareWith(color)
	}

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div
					className={`text-center ${
						isDark ? 'text-gray-400' : 'text-gray-600'
					}`}
				>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
					<div>Загрузка цветов...</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen'>
			{/* Шапка */}
			<div
				className={`border-b ${
					isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
				}`}
			>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex items-center justify-between h-16'>
						<div className='flex items-center gap-4'>
							<h1
								className={`text-xl font-semibold ${
									isDark ? 'text-white' : 'text-gray-900'
								}`}
							>
								2D карта цветов
							</h1>
						</div>

						{/* Быстрые действия */}
						<div className='flex items-center gap-2'>
							{selectedColor && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => setSelectedColor(undefined)}
								>
									Сбросить выбор
								</Button>
							)}
							{compareWith && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => setCompareWith(undefined)}
								>
									Сбросить сравнение
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Основной контент */}
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{colors.length > 0 ? (
					<ColorVisualizationHub
						colors={colors}
						selectedColor={selectedColor}
						onColorSelect={handleColorSelect}
						compareWith={compareWith}
						onCompareWith={handleCompareWith}
					/>
				) : (
					<div
						className={`text-center py-12 ${
							isDark ? 'text-gray-400' : 'text-gray-600'
						}`}
					>
						<div className='text-lg font-medium mb-2'>Нет доступных цветов</div>
						<div className='text-sm'>
							Добавьте цвета в базу данных для использования инструментов
							визуализации
						</div>
						<Link to='/' className='mt-4 inline-block'>
							<Button variant='primary'>Перейти к управлению цветами</Button>
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}

export default ColorVisualization
