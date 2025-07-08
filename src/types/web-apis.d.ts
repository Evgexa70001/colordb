// Web Serial API types
declare global {
	interface Navigator {
		serial: Serial
	}

	interface Serial extends EventTarget {
		requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>
		getPorts(): Promise<SerialPort[]>
	}

	interface SerialPortRequestOptions {
		filters?: SerialPortFilter[]
	}

	interface SerialPortFilter {
		usbVendorId?: number
		usbProductId?: number
	}

	interface SerialPort extends EventTarget {
		readonly readable: ReadableStream<Uint8Array> | null
		readonly writable: WritableStream<Uint8Array> | null

		open(options: SerialOptions): Promise<void>
		close(): Promise<void>

		getInfo(): SerialPortInfo
		getSignals(): Promise<SerialInputSignals>
		setSignals(signals: SerialOutputSignals): Promise<void>
	}

	interface SerialOptions {
		baudRate: number
		dataBits?: 7 | 8
		stopBits?: 1 | 2
		parity?: 'none' | 'even' | 'odd'
		bufferSize?: number
		flowControl?: 'none' | 'hardware'
	}

	interface SerialPortInfo {
		usbVendorId?: number
		usbProductId?: number
	}

	interface SerialInputSignals {
		dataCarrierDetect: boolean
		clearToSend: boolean
		ringIndicator: boolean
		dataSetReady: boolean
	}

	interface SerialOutputSignals {
		dataTerminalReady?: boolean
		requestToSend?: boolean
		break?: boolean
	}

	// Web Bluetooth API types
	interface Navigator {
		bluetooth: Bluetooth
	}

	interface Bluetooth extends EventTarget {
		requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
		getDevices(): Promise<BluetoothDevice[]>
		getAvailability(): Promise<boolean>
	}

	interface RequestDeviceOptions {
		filters?: BluetoothLEScanFilter[]
		optionalServices?: BluetoothServiceUUID[]
		acceptAllDevices?: boolean
	}

	interface BluetoothLEScanFilter {
		services?: BluetoothServiceUUID[]
		name?: string
		namePrefix?: string
		manufacturerData?: BluetoothManufacturerDataFilter[]
		serviceData?: BluetoothServiceDataFilter[]
	}

	interface BluetoothManufacturerDataFilter {
		companyIdentifier: number
		dataPrefix?: BufferSource
		mask?: BufferSource
	}

	interface BluetoothServiceDataFilter {
		service: BluetoothServiceUUID
		dataPrefix?: BufferSource
		mask?: BufferSource
	}

	interface BluetoothDevice extends EventTarget {
		readonly id: string
		readonly name?: string
		readonly gatt?: BluetoothRemoteGATTServer

		watchAdvertisements(): Promise<void>
		unwatchAdvertisements(): void
	}

	interface BluetoothRemoteGATTServer {
		readonly device: BluetoothDevice
		readonly connected: boolean

		connect(): Promise<BluetoothRemoteGATTServer>
		disconnect(): void
		getPrimaryService(
			service: BluetoothServiceUUID
		): Promise<BluetoothRemoteGATTService>
		getPrimaryServices(
			service?: BluetoothServiceUUID
		): Promise<BluetoothRemoteGATTService[]>
	}

	interface BluetoothRemoteGATTService extends EventTarget {
		readonly device: BluetoothDevice
		readonly uuid: string
		readonly isPrimary: boolean

		getCharacteristic(
			characteristic: BluetoothCharacteristicUUID
		): Promise<BluetoothRemoteGATTCharacteristic>
		getCharacteristics(
			characteristic?: BluetoothCharacteristicUUID
		): Promise<BluetoothRemoteGATTCharacteristic[]>
		getIncludedService(
			service: BluetoothServiceUUID
		): Promise<BluetoothRemoteGATTService>
		getIncludedServices(
			service?: BluetoothServiceUUID
		): Promise<BluetoothRemoteGATTService[]>
	}

	interface BluetoothRemoteGATTCharacteristic extends EventTarget {
		readonly service: BluetoothRemoteGATTService
		readonly uuid: string
		readonly properties: BluetoothCharacteristicProperties
		readonly value?: DataView

		readValue(): Promise<DataView>
		writeValue(value: BufferSource): Promise<void>
		writeValueWithResponse(value: BufferSource): Promise<void>
		writeValueWithoutResponse(value: BufferSource): Promise<void>
		startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
		stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
	}

	interface BluetoothCharacteristicProperties {
		readonly broadcast: boolean
		readonly read: boolean
		readonly writeWithoutResponse: boolean
		readonly write: boolean
		readonly notify: boolean
		readonly indicate: boolean
		readonly authenticatedSignedWrites: boolean
		readonly reliableWrite: boolean
		readonly writableAuxiliaries: boolean
	}

	type BluetoothServiceUUID = number | string
	type BluetoothCharacteristicUUID = number | string
	type BluetoothDescriptorUUID = number | string
}

export {}
