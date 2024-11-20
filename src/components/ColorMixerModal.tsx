import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { useTheme } from '../contexts/ThemeContext'

interface ColorMixerModalProps {
	isOpen: boolean
	onClose: () => void
}

interface InkColor {
	name: string
	amount: number
	hex: string
	cmyk: CMYKColor
}

interface CMYKColor {
	c: number
	m: number
	y: number
	k: number
}

interface RGBColor {
	r: number
	g: number
	b: number
}

function rgbToCmyk(r: number, g: number, b: number): CMYKColor {
	// Нормализация RGB значений
	const red = r / 255
	const green = g / 255
	const blue = b / 255

	const k = 1 - Math.max(red, green, blue)

	if (k === 1) {
		return { c: 0, m: 0, y: 0, k: 100 }
	}

	const c = ((1 - red - k) / (1 - k)) * 100
	const m = ((1 - green - k) / (1 - k)) * 100
	const y = ((1 - blue - k) / (1 - k)) * 100

	return {
		c: Math.round(c),
		m: Math.round(m),
		y: Math.round(y),
		k: Math.round(k * 100),
	}
}

function cmykToRgb(c: number, m: number, y: number, k: number): RGBColor {
	// Нормализация CMYK значений
	const cyan = c / 100
	const magenta = m / 100
	const yellow = y / 100
	const key = k / 100

	// Преобразование в RGB
	const r = 255 * (1 - cyan) * (1 - key)
	const g = 255 * (1 - magenta) * (1 - key)
	const b = 255 * (1 - yellow) * (1 - key)

	return {
		r: Math.round(r),
		g: Math.round(g),
		b: Math.round(b),
	}
}

function hexToRgb(hex: string): RGBColor {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: { r: 0, g: 0, b: 0 }
}

function rgbToHex(r: number, g: number, b: number): string {
	return (
		'#' +
		[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
	)
}

function calculateInkMixture(
	inks: InkColor[],
	substrate: 'paper' | 'film'
): string {
	const totalAmount = inks.reduce((sum, ink) => sum + ink.amount, 0)

	if (totalAmount === 0) return '#FFFFFF'

	const transparentAmount =
		inks.find(ink => ink.name === 'Transparent White')?.amount || 0
	const opacity = Math.max(
		0,
		Math.min(1, (totalAmount - transparentAmount) / totalAmount)
	)

	// Вычисляем средневзвешенные значения CMYK
	let finalC = 0
	let finalM = 0
	let finalY = 0
	let finalK = 0

	inks.forEach(ink => {
		const weight = ink.amount / totalAmount
		const rgb = hexToRgb(ink.hex)
		const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)

		// Учитываем нелинейность смешивания красок
		finalC += (1 - Math.pow(1 - cmyk.c / 100, weight)) * 100
		finalM += (1 - Math.pow(1 - cmyk.m / 100, weight)) * 100
		finalY += (1 - Math.pow(1 - cmyk.y / 100, weight)) * 100
		finalK += (1 - Math.pow(1 - cmyk.k / 100, weight)) * 100
	})

	// Применяем корректировку насыщенности
	const saturationFactor = 1.1 // Можно настроить для более точного соответствия реальным краскам
	finalC = Math.min(100, finalC * saturationFactor)
	finalM = Math.min(100, finalM * saturationFactor)
	finalY = Math.min(100, finalY * saturationFactor)
	finalK = Math.min(100, finalK)

	// Преобразуем обратно в RGB
	const rgb = cmykToRgb(finalC, finalM, finalY, finalK)

	// Применяем гамма-коррекцию для более реалистичного отображения
	const whiteRgb = { r: 255, g: 255, b: 255 }

	const substrateOpacity = substrate === 'film' ? opacity * 0.9 : opacity * 0.95

	const correctedRgb = {
		r: rgb.r * substrateOpacity + whiteRgb.r * (1 - substrateOpacity),
		g: rgb.g * substrateOpacity + whiteRgb.g * (1 - substrateOpacity),
		b: rgb.b * substrateOpacity + whiteRgb.b * (1 - substrateOpacity),
	}

	return rgbToHex(correctedRgb.r, correctedRgb.g, correctedRgb.b)
}

const DEFAULT_INKS: InkColor[] = [
	{
		name: 'Magenta',
		amount: 0,
		hex: '#cb0056',
		cmyk: { c: 0, m: 100, y: 58, k: 20 },
	},
	{
		name: 'Cyan',
		amount: 0,
		hex: '#0080c8',
		cmyk: { c: 100, m: 36, y: 0, k: 22 },
	},
	{
		name: 'Yellow',
		amount: 0,
		hex: '#fedf00',
		cmyk: { c: 0, m: 12, y: 100, k: 0 },
	},
	{
		name: 'Kontur',
		amount: 0,
		hex: '#000000',
		cmyk: { c: 0, m: 0, y: 0, k: 100 },
	},
	{
		name: 'Transparent White',
		amount: 0,
		hex: '#FFFFFF',
		cmyk: { c: 0, m: 0, y: 0, k: 0 },
	},
]

export default function ColorMixerModal({
	isOpen,
	onClose,
}: ColorMixerModalProps) {
	const { isDark } = useTheme()
	const [inks, setInks] = useState<InkColor[]>(DEFAULT_INKS)
	const [mixedColor, setMixedColor] = useState('#FFFFFF')
	const [substrate, setSubstrate] = useState<'paper' | 'film'>('paper')

	useEffect(() => {
		const mixedColor = calculateInkMixture(inks, substrate)
		setMixedColor(mixedColor)
	}, [inks, substrate])

	const handleAmountChange = (index: number, amount: number) => {
		const newInks = [...inks]
		newInks[index].amount = Math.max(0, Math.min(1000, amount))
		setInks(newInks)
	}

	return (
		<Dialog
			open={isOpen}
			onClose={onClose}
			className='fixed inset-0 z-50 overflow-y-auto'
		>
			<div className='flex items-center justify-center min-h-screen p-4'>
				<Dialog.Overlay className='fixed inset-0 bg-black/50' />

				<div
					className={`relative w-full max-w-md p-6 rounded-2xl shadow-xl ${
						isDark ? 'bg-gray-800' : 'bg-white'
					}`}
				>
					<Dialog.Title
						className={`text-xl font-bold mb-6 ${
							isDark ? 'text-white' : 'text-gray-900'
						}`}
					>
						Смешивание красок
					</Dialog.Title>

					<div className='space-y-4'>
						<div className='flex gap-4 mb-4'>
							<button
								onClick={() => setSubstrate('paper')}
								className={`px-4 py-2 rounded-lg ${
									substrate === 'paper'
										? isDark
											? 'bg-gray-600'
											: 'bg-gray-200'
										: isDark
										? 'bg-gray-700'
										: 'bg-gray-100'
								}`}
							>
								Бумага
							</button>
							<button
								onClick={() => setSubstrate('film')}
								className={`px-4 py-2 rounded-lg ${
									substrate === 'film'
										? isDark
											? 'bg-gray-600'
											: 'bg-gray-200'
										: isDark
										? 'bg-gray-700'
										: 'bg-gray-100'
								}`}
							>
								Пленка
							</button>
						</div>
						{inks.map((ink, index) => (
							<div key={ink.name} className='flex items-center gap-4'>
								<div
									className='w-6 h-6 rounded-full'
									style={{ backgroundColor: ink.hex }}
								/>
								<span
									className={`flex-1 ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									{ink.name}
								</span>
								<input
									type='number'
									value={ink.amount}
									onChange={e =>
										handleAmountChange(index, Number(e.target.value))
									}
									className={`w-20 px-3 py-1.5 rounded-lg ${
										isDark
											? 'bg-gray-700 text-white'
											: 'bg-gray-100 text-gray-900'
									} border-0`}
									min='0'
									max='1000'
								/>
								<span
									className={`w-8 ${
										isDark ? 'text-gray-400' : 'text-gray-500'
									}`}
								>
									г
								</span>
							</div>
						))}

						<div className='mt-6'>
							<div className='text-sm font-medium mb-2'>
								Результат смешивания:
							</div>
							<div className='flex items-center gap-4'>
								<div
									className='w-16 h-16 rounded-xl shadow-inner'
									style={{ backgroundColor: mixedColor }}
								/>
								<span
									className={`font-mono ${
										isDark ? 'text-gray-200' : 'text-gray-700'
									}`}
								>
									{mixedColor.toUpperCase()}
								</span>
							</div>
						</div>
					</div>

					<button
						onClick={onClose}
						className={`mt-6 w-full py-2.5 rounded-xl ${
							isDark
								? 'bg-gray-700 text-white hover:bg-gray-600'
								: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
						}`}
					>
						Закрыть
					</button>
				</div>
			</div>
		</Dialog>
	)
}
