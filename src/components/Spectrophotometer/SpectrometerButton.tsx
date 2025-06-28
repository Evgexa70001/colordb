import React, { useState } from 'react'
import { Button } from '@/components/ui/Button/Button'
import {
	Zap,
	Bluetooth,
	Usb,
	Beaker,
	Wifi,
	WifiOff,
	Loader2,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import {
	useSpectrophotometer,
	SpectrometerReading,
} from '@/hooks/useSpectrophotometer'
// import { Dropdown } from '@/components/ui/Dropdown/Dropdown'

interface SpectrometerButtonProps {
	onMeasurement: (reading: SpectrometerReading) => void
	disabled?: boolean
}

const SpectrometerButton: React.FC<SpectrometerButtonProps> = ({
	onMeasurement,
	disabled = false,
}) => {
	const { isDark } = useTheme()
	const [showConnectionOptions, setShowConnectionOptions] = useState(false)

	const {
		device,
		isConnecting,
		isMeasuring,
		lastReading,
		connect,
		disconnect,
		measure,
		isConnected,
	} = useSpectrophotometer()

	const handleConnect = async (type: 'serial' | 'bluetooth' | 'simulation') => {
		await connect(type)
		setShowConnectionOptions(false)
	}

	const handleMeasure = async () => {
		const reading = await measure()
		if (reading) {
			onMeasurement(reading)
		}
	}

	const connectionOptions = [
		{
			label: 'USB (Serial)',
			value: 'serial' as const,
			icon: Usb,
			description: 'Подключение через USB кабель',
		},
		{
			label: 'Bluetooth',
			value: 'bluetooth' as const,
			icon: Bluetooth,
			description: 'Беспроводное подключение',
		},
		{
			label: 'Симуляция',
			value: 'simulation' as const,
			icon: Beaker,
			description: 'Тестовый режим',
		},
	]

	return (
		<div className='space-y-3'>
			{/* Статус подключения */}
			<div
				className={`flex items-center justify-between p-3 rounded-lg border ${
					isDark ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
				}`}
			>
				<div className='flex items-center gap-3'>
					<div
						className={`w-3 h-3 rounded-full ${
							isConnected ? 'bg-green-500' : 'bg-gray-400'
						}`}
					/>
					<div>
						<div
							className={`font-medium ${
								isDark ? 'text-white' : 'text-gray-900'
							}`}
						>
							{device ? device.name : 'Спектрофотометр не подключен'}
						</div>
						{device && (
							<div
								className={`text-sm ${
									isDark ? 'text-gray-400' : 'text-gray-600'
								}`}
							>
								{device.type === 'serial' && 'USB подключение'}
								{device.type === 'bluetooth' && 'Bluetooth подключение'}
								{device.type === 'simulation' && 'Режим симуляции'}
							</div>
						)}
					</div>
				</div>
				{isConnected ? (
					<Wifi className='w-5 h-5 text-green-500' />
				) : (
					<WifiOff className='w-5 h-5 text-gray-400' />
				)}
			</div>

			{/* Кнопки управления */}
			<div className='flex gap-2'>
				{!isConnected ? (
					<div className='flex-1 relative'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setShowConnectionOptions(!showConnectionOptions)}
							disabled={isConnecting || disabled}
							className='w-full'
						>
							{isConnecting ? (
								<>
									<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									Подключение...
								</>
							) : (
								<>
									<Zap className='w-4 h-4 mr-2' />
									Подключить спектрофотометр
								</>
							)}
						</Button>

						{/* Выпадающее меню с опциями подключения */}
						{showConnectionOptions && (
							<div
								className={`absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border shadow-lg ${
									isDark
										? 'bg-gray-800 border-gray-600'
										: 'bg-white border-gray-200'
								}`}
							>
								{connectionOptions.map(option => {
									const IconComponent = option.icon
									return (
										<button
											key={option.value}
											onClick={() => handleConnect(option.value)}
											disabled={isConnecting}
											className={`w-full p-3 text-left flex items-start gap-3 hover:bg-opacity-50 first:rounded-t-lg last:rounded-b-lg ${
												isDark
													? 'hover:bg-gray-700 text-gray-200'
													: 'hover:bg-gray-100 text-gray-800'
											}`}
										>
											<IconComponent className='w-5 h-5 mt-0.5 flex-shrink-0' />
											<div>
												<div className='font-medium'>{option.label}</div>
												<div
													className={`text-sm ${
														isDark ? 'text-gray-400' : 'text-gray-600'
													}`}
												>
													{option.description}
												</div>
											</div>
										</button>
									)
								})}
							</div>
						)}
					</div>
				) : (
					<>
						<Button
							type='button'
							variant='primary'
							onClick={handleMeasure}
							disabled={isMeasuring || disabled}
							className='flex-1'
						>
							{isMeasuring ? (
								<>
									<Loader2 className='w-4 h-4 mr-2 animate-spin' />
									Измерение...
								</>
							) : (
								<>
									<Zap className='w-4 h-4 mr-2' />
									Измерить цвет
								</>
							)}
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={disconnect}
							disabled={isMeasuring || disabled}
							className='px-3'
						>
							Отключить
						</Button>
					</>
				)}
			</div>

			{/* Последнее измерение */}
			{lastReading && (
				<div
					className={`p-3 rounded-lg border ${
						isDark
							? 'bg-gray-800 border-gray-600'
							: 'bg-blue-50 border-blue-200'
					}`}
				>
					<div
						className={`text-sm font-medium mb-2 ${
							isDark ? 'text-white' : 'text-blue-900'
						}`}
					>
						Последнее измерение:
					</div>
					<div className='grid grid-cols-3 gap-3 text-sm'>
						<div className={`${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
							<span className='font-mono'>L*:</span> {lastReading.l.toFixed(2)}
						</div>
						<div className={`${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
							<span className='font-mono'>a*:</span> {lastReading.a.toFixed(2)}
						</div>
						<div className={`${isDark ? 'text-gray-300' : 'text-blue-800'}`}>
							<span className='font-mono'>b*:</span> {lastReading.b.toFixed(2)}
						</div>
					</div>
					<div
						className={`text-xs mt-2 ${
							isDark ? 'text-gray-500' : 'text-blue-600'
						}`}
					>
						{lastReading.timestamp.toLocaleTimeString()} •{' '}
						{lastReading.deviceName}
					</div>
				</div>
			)}

			{/* Закрытие выпадающего меню при клике вне области */}
			{showConnectionOptions && (
				<div
					className='fixed inset-0 z-40'
					onClick={() => setShowConnectionOptions(false)}
				/>
			)}
		</div>
	)
}

export default SpectrometerButton
