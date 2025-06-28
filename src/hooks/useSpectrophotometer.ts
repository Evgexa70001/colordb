import { useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

// Типы данных для спектрофотометра
export interface SpectrometerReading {
	l: number
	a: number
	b: number
	x?: number
	y?: number
	z?: number
	timestamp: Date
	deviceName?: string
	measurementMode?: string
}

export interface SpectrometerDevice {
	id: string
	name: string
	type: 'serial' | 'bluetooth' | 'simulation'
	connected: boolean
}

// Интерфейс для различных типов спектрофотометров
interface SpectrometerProtocol {
	connect(): Promise<void>
	disconnect(): Promise<void>
	measure(): Promise<SpectrometerReading>
	isConnected(): boolean
}

// Реализация для Web Serial API (USB подключение)
class SerialSpectrometerProtocol implements SpectrometerProtocol {
	private port: any = null
	private reader: any = null
	private writer: any = null

	async connect(): Promise<void> {
		if (!('serial' in navigator)) {
			throw new Error('Web Serial API не поддерживается в вашем браузере')
		}

		try {
			// Запрашиваем доступ к серийному порту
			this.port = await (navigator as any).serial.requestPort({
				filters: [
					// X-Rite устройства
					{ usbVendorId: 0x0765 },
					// Konica Minolta устройства
					{ usbVendorId: 0x132a },
					// Общие спектрофотометры
					{ usbVendorId: 0x04d8 },
				],
			})

			if (!this.port) {
				throw new Error('Не удалось получить доступ к серийному порту')
			}

			await this.port.open({
				baudRate: 9600, // Стандартная скорость для большинства спектрофотометров
				dataBits: 8,
				stopBits: 1,
				parity: 'none',
			})

			if (this.port.readable) {
				this.reader = this.port.readable.getReader()
			}
			if (this.port.writable) {
				this.writer = this.port.writable.getWriter()
			}

			console.log('Спектрофотометр подключен через USB')
		} catch (error) {
			throw new Error(`Ошибка подключения USB: ${error}`)
		}
	}

	async disconnect(): Promise<void> {
		try {
			if (this.reader) {
				await this.reader.cancel()
				this.reader = null
			}
			if (this.writer) {
				await this.writer.close()
				this.writer = null
			}
			if (this.port) {
				await this.port.close()
				this.port = null
			}
		} catch (error) {
			console.error('Ошибка отключения:', error)
		}
	}

	async measure(): Promise<SpectrometerReading> {
		if (!this.port || !this.writer || !this.reader) {
			throw new Error('Спектрофотометр не подключен')
		}

		try {
			// Отправляем команду измерения (универсальная команда)
			const command = new TextEncoder().encode('M\r\n') // 'M' - стандартная команда измерения
			await this.writer.write(command)

			// Читаем ответ
			const { value } = await this.reader.read()
			const response = new TextDecoder().decode(value)

			// Парсим ответ (формат может отличаться для разных устройств)
			return this.parseResponse(response)
		} catch (error) {
			throw new Error(`Ошибка измерения: ${error}`)
		}
	}

	private parseResponse(response: string): SpectrometerReading {
		// Универсальный парсер для разных форматов ответов
		const lines = response.trim().split('\n')

		// Пытаемся найти LAB значения в разных форматах
		for (const line of lines) {
			// Формат: "L*a*b* 45.67 -12.34 23.45"
			let match = line.match(/L\*a\*b\*\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/)
			if (match) {
				return {
					l: parseFloat(match[1]),
					a: parseFloat(match[2]),
					b: parseFloat(match[3]),
					timestamp: new Date(),
					deviceName: 'USB Спектрофотометр',
				}
			}

			// Формат: "LAB 45.67 -12.34 23.45"
			match = line.match(/LAB\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/)
			if (match) {
				return {
					l: parseFloat(match[1]),
					a: parseFloat(match[2]),
					b: parseFloat(match[3]),
					timestamp: new Date(),
					deviceName: 'USB Спектрофотометр',
				}
			}

			// Формат с табуляцией: "L	a	b	45.67	-12.34	23.45"
			match = line.match(/L\s+a\s+b\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)/)
			if (match) {
				return {
					l: parseFloat(match[1]),
					a: parseFloat(match[2]),
					b: parseFloat(match[3]),
					timestamp: new Date(),
					deviceName: 'USB Спектрофотометр',
				}
			}
		}

		throw new Error('Не удалось распознать формат данных спектрофотометра')
	}

	isConnected(): boolean {
		return this.port !== null
	}
}

// Реализация для Web Bluetooth API
class BluetoothSpectrometerProtocol implements SpectrometerProtocol {
	private device: any = null
	private server: any = null

	async connect(): Promise<void> {
		if (!('bluetooth' in navigator)) {
			throw new Error('Web Bluetooth API не поддерживается в вашем браузере')
		}

		try {
			this.device = await (navigator as any).bluetooth.requestDevice({
				filters: [
					{ namePrefix: 'X-Rite' },
					{ namePrefix: 'Konica' },
					{ namePrefix: 'Spectro' },
				],
				optionalServices: ['battery_service', 'device_information'],
			})

			if (this.device.gatt) {
				this.server = await this.device.gatt.connect()
				if (!this.server)
					throw new Error('Не удалось подключиться к GATT серверу')
			} else {
				throw new Error('GATT не поддерживается устройством')
			}

			// Здесь нужно будет добавить специфичные UUID для каждого производителя
			console.log('Спектрофотометр подключен через Bluetooth')
		} catch (error) {
			throw new Error(`Ошибка подключения Bluetooth: ${error}`)
		}
	}

	async disconnect(): Promise<void> {
		try {
			if (this.server) {
				this.server.disconnect()
				this.server = null
			}
			this.device = null
		} catch (error) {
			console.error('Ошибка отключения Bluetooth:', error)
		}
	}

	async measure(): Promise<SpectrometerReading> {
		// Реализация измерения через Bluetooth
		// Пока возвращаем тестовые данные
		return {
			l: 50 + Math.random() * 50,
			a: -20 + Math.random() * 40,
			b: -20 + Math.random() * 40,
			timestamp: new Date(),
			deviceName: 'Bluetooth Спектрофотометр',
		}
	}

	isConnected(): boolean {
		return this.device !== null && this.device.gatt?.connected === true
	}
}

// Симуляция для тестирования
class SimulationSpectrometerProtocol implements SpectrometerProtocol {
	private connected = false

	async connect(): Promise<void> {
		// Симулируем задержку подключения
		await new Promise(resolve => setTimeout(resolve, 1000))
		this.connected = true
		console.log('Симуляция спектрофотометра подключена')
	}

	async disconnect(): Promise<void> {
		this.connected = false
		console.log('Симуляция спектрофотометра отключена')
	}

	async measure(): Promise<SpectrometerReading> {
		if (!this.connected) {
			throw new Error('Симуляция спектрофотометра не подключена')
		}

		// Симулируем задержку измерения
		await new Promise(resolve => setTimeout(resolve, 2000))

		// Генерируем реалистичные LAB значения
		const l = 20 + Math.random() * 80 // L* от 20 до 100
		const a = -60 + Math.random() * 120 // a* от -60 до 60
		const b = -60 + Math.random() * 120 // b* от -60 до 60

		return {
			l: Math.round(l * 100) / 100,
			a: Math.round(a * 100) / 100,
			b: Math.round(b * 100) / 100,
			timestamp: new Date(),
			deviceName: 'Симуляция спектрофотометра',
			measurementMode: 'SCI',
		}
	}

	isConnected(): boolean {
		return this.connected
	}
}

export const useSpectrophotometer = () => {
	const [device, setDevice] = useState<SpectrometerDevice | null>(null)
	const [isConnecting, setIsConnecting] = useState(false)
	const [isMeasuring, setIsMeasuring] = useState(false)
	const [lastReading, setLastReading] = useState<SpectrometerReading | null>(
		null
	)
	const protocolRef = useRef<SpectrometerProtocol | null>(null)

	const connect = useCallback(
		async (type: 'serial' | 'bluetooth' | 'simulation') => {
			if (device?.connected) {
				toast.error('Спектрофотометр уже подключен')
				return
			}

			setIsConnecting(true)

			try {
				let protocol: SpectrometerProtocol

				switch (type) {
					case 'serial':
						protocol = new SerialSpectrometerProtocol()
						break
					case 'bluetooth':
						protocol = new BluetoothSpectrometerProtocol()
						break
					case 'simulation':
						protocol = new SimulationSpectrometerProtocol()
						break
					default:
						throw new Error('Неизвестный тип подключения')
				}

				await protocol.connect()
				protocolRef.current = protocol

				setDevice({
					id: `${type}_${Date.now()}`,
					name: `${
						type.charAt(0).toUpperCase() + type.slice(1)
					} Спектрофотометр`,
					type,
					connected: true,
				})

				toast.success(`Спектрофотометр подключен (${type})`)
			} catch (error) {
				toast.error(`Ошибка подключения: ${error}`)
				console.error('Ошибка подключения спектрофотометра:', error)
			} finally {
				setIsConnecting(false)
			}
		},
		[device]
	)

	const disconnect = useCallback(async () => {
		if (!protocolRef.current) return

		try {
			await protocolRef.current.disconnect()
			protocolRef.current = null
			setDevice(null)
			toast.success('Спектрофотометр отключен')
		} catch (error) {
			toast.error(`Ошибка отключения: ${error}`)
			console.error('Ошибка отключения спектрофотометра:', error)
		}
	}, [])

	const measure = useCallback(async (): Promise<SpectrometerReading | null> => {
		if (!protocolRef.current) {
			toast.error('Спектрофотометр не подключен')
			return null
		}

		setIsMeasuring(true)

		try {
			const reading = await protocolRef.current.measure()
			setLastReading(reading)
			toast.success(
				`Измерение выполнено: L*${reading.l.toFixed(2)} a*${reading.a.toFixed(
					2
				)} b*${reading.b.toFixed(2)}`
			)
			return reading
		} catch (error) {
			toast.error(`Ошибка измерения: ${error}`)
			console.error('Ошибка измерения:', error)
			return null
		} finally {
			setIsMeasuring(false)
		}
	}, [])

	const isConnected = useCallback(() => {
		return device?.connected && protocolRef.current?.isConnected()
	}, [device])

	return {
		device,
		isConnecting,
		isMeasuring,
		lastReading,
		connect,
		disconnect,
		measure,
		isConnected: isConnected(),
	}
}
