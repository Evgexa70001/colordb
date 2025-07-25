import pantoneDataRaw from '../data/pantone.json'

// Новая структура: [{ pantone: string, code: string, lab: {l,a,b}, hex: string }]
const pantoneData = (pantoneDataRaw.colors || []).map((entry: any) => {
	const [l, a, b] = entry.components;
	const lab = { l, a, b };
	const hex = labToHex(lab).toLowerCase();
	return {
		pantone: entry.name,
		code: entry.code,
		lab,
		hex,
	};
});

export function isValidHexColor(hex: string): boolean {
	return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

export function normalizeHexColor(hex: string): string {
	if (!isValidHexColor(hex)) return '#000000'

	// If it's a 3-digit hex, convert to 6-digit
	if (hex.length === 4) {
		const r = hex[1]
		const g = hex[2]
		const b = hex[3]
		return `#${r}${r}${g}${g}${b}${b}`
	}

	return hex
}

export function hexToRgb(hex: string): [number, number, number] {
	const normalizedHex = normalizeHexColor(hex)
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex)
	if (!result) return [0, 0, 0]

	return [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16),
	]
}

export function rgbToCmyk(
	r: number,
	g: number,
	b: number
): [number, number, number, number] {
	// Convert RGB to [0,1] range
	const red = r / 255
	const green = g / 255
	const blue = b / 255

	// Find K (black)
	const k = 1 - Math.max(red, green, blue)

	// Handle pure black
	if (k === 1) {
		return [0, 0, 0, 100]
	}

	// Calculate CMY
	const c = ((1 - red - k) / (1 - k)) * 100
	const m = ((1 - green - k) / (1 - k)) * 100
	const y = ((1 - blue - k) / (1 - k)) * 100

	// Convert K to percentage
	const kPercent = k * 100

	return [Math.round(c), Math.round(m), Math.round(y), Math.round(kPercent)]
}

export function rgbToLab(
	r: number,
	g: number,
	b: number
): [number, number, number] {
	// RGB to XYZ
	let r1 = r / 255
	let g1 = g / 255
	let b1 = b / 255

	r1 = r1 > 0.04045 ? Math.pow((r1 + 0.055) / 1.055, 2.4) : r1 / 12.92
	g1 = g1 > 0.04045 ? Math.pow((g1 + 0.055) / 1.055, 2.4) : g1 / 12.92
	b1 = b1 > 0.04045 ? Math.pow((b1 + 0.055) / 1.055, 2.4) : b1 / 12.92

	// D50 reference white point
	const xRef = 0.96422
	const yRef = 1.0
	const zRef = 0.82521

	// sRGB to XYZ transformation matrix for D50 illuminant
	const x = (r1 * 0.4360747 + g1 * 0.3850649 + b1 * 0.1430804) / xRef
	const y = (r1 * 0.2225045 + g1 * 0.7168786 + b1 * 0.0606169) / yRef
	const z = (r1 * 0.0139322 + g1 * 0.0971045 + b1 * 0.7141733) / zRef

	const fx = x > 0.008856 ? Math.pow(x, 1 / 3) : (903.3 * x + 16) / 116
	const fy = y > 0.008856 ? Math.pow(y, 1 / 3) : (903.3 * y + 16) / 116
	const fz = z > 0.008856 ? Math.pow(z, 1 / 3) : (903.3 * z + 16) / 116

	const l = Math.max(0, 116 * fy - 16)
	const a = 500 * (fx - fy)
	const b2 = 200 * (fy - fz)

	return [
		Math.round(l * 100) / 100,
		Math.round(a * 100) / 100,
		Math.round(b2 * 100) / 100,
	]
}

export function labToRgb(
	l: number,
	a: number,
	b: number
): [number, number, number] {
	// Lab to XYZ
	const y = (l + 16) / 116
	const x = a / 500 + y
	const z = y - b / 200

	// D50 reference white point
	const xRef = 0.96422
	const yRef = 1.0
	const zRef = 0.82521

	const x3 = Math.pow(x, 3)
	const y3 = Math.pow(y, 3)
	const z3 = Math.pow(z, 3)

	const xr = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787
	const yr = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787
	const zr = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787

	const x1 = xr * xRef
	const y1 = yr * yRef
	const z1 = zr * zRef

	// XYZ to sRGB transformation matrix for D50 illuminant
	let r = x1 * 3.1338561 - y1 * 1.6168667 - z1 * 0.4906146
	let g = -x1 * 0.9787684 + y1 * 1.9161415 + z1 * 0.0334540
	let b1 = x1 * 0.0719453 - y1 * 0.2289914 + z1 * 1.4052427

	// Gamma correction
	r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r
	g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g
	b1 = b1 > 0.0031308 ? 1.055 * Math.pow(b1, 1 / 2.4) - 0.055 : 12.92 * b1

	return [
		Math.max(0, Math.min(255, Math.round(r * 255))),
		Math.max(0, Math.min(255, Math.round(g * 255))),
		Math.max(0, Math.min(255, Math.round(b1 * 255))),
	]
}

export function rgbToHex(r: number, g: number, b: number): string {
	const toHex = (n: number) => {
		const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
		return hex.length === 1 ? '0' + hex : hex
	}
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

export function labToHex(
	lab: LAB | { l: number; a: number; b: number }
): string {
	const rgb = labToRgb(lab.l, lab.a, lab.b)
	return rgbToHex(...rgb)
}

function pow2(n: number): number {
	return Math.pow(n, 2)
}

function deg2rad(deg: number): number {
	return (deg * Math.PI) / 180
}

function rad2deg(rad: number): number {
	return (rad * 180) / Math.PI
}

export function calculateDeltaE76(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number }
): number {
	const deltaL = lab1.l - lab2.l
	const deltaA = lab1.a - lab2.a
	const deltaB = lab1.b - lab2.b
	return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

export function getColorDistance(
	hex1: string,
	hex2: string
): { deltaE2000: number; deltaE76: number } {
	const normalized1 = normalizeHexColor(hex1)
	const normalized2 = normalizeHexColor(hex2)

	if (normalized1 === '#000000' || normalized2 === '#000000') {
		return { deltaE2000: Infinity, deltaE76: Infinity }
	}

	const rgb1 = hexToRgb(normalized1)
	const rgb2 = hexToRgb(normalized2)

	const lab1 = rgbToLab(...rgb1)
	const lab2 = rgbToLab(...rgb2)

	const deltaE2000 = calculateDeltaE(
		{ l: lab1[0], a: lab1[1], b: lab1[2] },
		{ l: lab2[0], a: lab2[1], b: lab2[2] }
	)
	const deltaE76 = calculateDeltaE76(
		{ l: lab1[0], a: lab1[1], b: lab1[2] },
		{ l: lab2[0], a: lab2[1], b: lab2[2] }
	)

	return { deltaE2000, deltaE76 }
}

export interface ColorInfo {
	rgb: {
		r: number
		g: number
		b: number
	}
	cmyk: {
		c: number
		m: number
		y: number
		k: number
	}
	lab: {
		l: number
		a: number
		b: number
	}
}

export function getColorInfo(hex: string): ColorInfo {
	const normalizedHex = normalizeHexColor(hex)
	if (normalizedHex === '#000000') {
		return {
			rgb: { r: 0, g: 0, b: 0 },
			cmyk: { c: 0, m: 0, y: 0, k: 0 },
			lab: { l: 0, a: 0, b: 0 },
		}
	}

	const rgb = hexToRgb(normalizedHex)
	const cmyk = rgbToCmyk(...rgb)
	const lab = rgbToLab(...rgb)

	return {
		rgb: {
			r: rgb[0],
			g: rgb[1],
			b: rgb[2],
		},
		cmyk: {
			c: cmyk[0],
			m: cmyk[1],
			y: cmyk[2],
			k: cmyk[3],
		},
		lab: {
			l: lab[0],
			a: lab[1],
			b: lab[2],
		},
	}
}

interface LAB {
	l: number
	a: number
	b: number
}

export function hexToLab(hex: string): LAB {
	const rgb = hexToRgb(hex)
	const [l, a, b] = rgbToLab(...rgb)
	return { l, a, b }
}

export function calculateLabDistance(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number }
): number {
	const deltaL = lab1.l - lab2.l
	const deltaA = lab1.a - lab2.a
	const deltaB = lab1.b - lab2.b

	return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB)
}

export function calculateAniloxChange(
	lab: { l: number; a: number; b: number },
	fromAnilox: string,
	toAnilox: string
): { l: number; a: number; b: number } {
	// Коэффициенты изменения при переходе с 500 на 800
	const coefficients = {
		l: 1.693,
		a: 1.196,
		b: 1.097,
	}

	if (fromAnilox === '500' && toAnilox === '800') {
		return {
			l: lab.l * coefficients.l,
			a: lab.a * coefficients.a,
			b: lab.b * coefficients.b,
		}
	} else if (fromAnilox === '800' && toAnilox === '500') {
		return {
			l: lab.l / coefficients.l,
			a: lab.a / coefficients.a,
			b: lab.b / coefficients.b,
		}
	}

	return lab
}

export type DeltaEAlgorithm = 'CIEDE76' | 'CIEDE94' | 'CIEDE2000'

export function calculateDeltaE(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number },
	algorithm: DeltaEAlgorithm = 'CIEDE2000'
): number {
	switch (algorithm) {
		case 'CIEDE76':
			return calculateDeltaE76(lab1, lab2)
		case 'CIEDE94':
			return calculateDeltaE94(lab1, lab2)
		case 'CIEDE2000':
		default:
			return calculateDeltaE2000(lab1, lab2)
	}
}

export function calculateDeltaE2000(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number }
): number {
	const kL = 1
	const kC = 1
	const kH = 1

	const C1 = Math.sqrt(pow2(lab1.a) + pow2(lab1.b))
	const C2 = Math.sqrt(pow2(lab2.a) + pow2(lab2.b))
	const Cb = (C1 + C2) / 2

	const G = 0.5 * (1 - Math.sqrt(pow2(Cb) / (pow2(Cb) + 25 * 25 * 25 * 25)))

	const a1p = (1 + G) * lab1.a
	const a2p = (1 + G) * lab2.a

	const C1p = Math.sqrt(pow2(a1p) + pow2(lab1.b))
	const C2p = Math.sqrt(pow2(a2p) + pow2(lab2.b))
	const Cbp = (C1p + C2p) / 2

	let h1p = rad2deg(Math.atan2(lab1.b, a1p))
	if (h1p < 0) h1p += 360

	let h2p = rad2deg(Math.atan2(lab2.b, a2p))
	if (h2p < 0) h2p += 360

	const Hbp =
		Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2

	const T =
		1 -
		0.17 * Math.cos(deg2rad(Hbp - 30)) +
		0.24 * Math.cos(deg2rad(2 * Hbp)) +
		0.32 * Math.cos(deg2rad(3 * Hbp + 6)) -
		0.2 * Math.cos(deg2rad(4 * Hbp - 63))

	let dhp = h2p - h1p
	if (Math.abs(dhp) > 180) {
		if (h2p <= h1p) {
			dhp += 360
		} else {
			dhp -= 360
		}
	}

	const dLp = lab2.l - lab1.l
	const dCp = C2p - C1p
	const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deg2rad(dhp) / 2)

	const SL = 1 + (0.015 * pow2(lab1.l - 50)) / Math.sqrt(20 + pow2(lab1.l - 50))
	const SC = 1 + 0.045 * Cbp
	const SH = 1 + 0.015 * Cbp * T

	const dTheta = 30 * Math.exp(-pow2((Hbp - 275) / 25))
	const RC = 2 * Math.sqrt(pow2(Cbp) / (pow2(Cbp) + 25 * 25 * 25 * 25))
	const RT = -RC * Math.sin(2 * deg2rad(dTheta))

	const dE = Math.sqrt(
		pow2(dLp / (kL * SL)) +
			pow2(dCp / (kC * SC)) +
			pow2(dHp / (kH * SH)) +
			RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
	)

	return dE
}

export function calculateDeltaE94(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number }
): number {
	const kL = 1
	const kC = 1
	const kH = 1

	const deltaL = lab2.l - lab1.l
	const deltaA = lab2.a - lab1.a
	const deltaB = lab2.b - lab1.b

	const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b)
	const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b)
	const deltaC = C2 - C1

	let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
	deltaH = deltaH > 0 ? Math.sqrt(deltaH) : 0

	const SL = 1
	const SC = 1 + 0.045 * C1
	const SH = 1 + 0.015 * C1

	const dE = Math.sqrt(
		(deltaL / (kL * SL)) * (deltaL / (kL * SL)) +
			(deltaC / (kC * SC)) * (deltaC / (kC * SC)) +
			(deltaH / (kH * SH)) * (deltaH / (kH * SH))
	)

	return dE
}

// Коэффициенты калибровки для спектрофотометра
export interface SpectrophotometerCalibration {
	algorithm: DeltaEAlgorithm
	calibrationFactor: number
	offset: number
}

export function calculateDeltaEWithCalibration(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number },
	calibration: SpectrophotometerCalibration
): number {
	const rawDeltaE = calculateDeltaE(lab1, lab2, calibration.algorithm)
	return rawDeltaE * calibration.calibrationFactor + calibration.offset
}

// Предустановленные калибровки для разных спектрофотометров
export const SPECTROPHOTOMETER_CALIBRATIONS: Record<string, SpectrophotometerCalibration> = {
	'default': {
		algorithm: 'CIEDE2000',
		calibrationFactor: 1.0,
		offset: 0.0
	},
	'xrite': {
		algorithm: 'CIEDE2000',
		calibrationFactor: 0.67, // Примерный коэффициент для X-Rite
		offset: 0.0
	},
	'konica_minolta': {
		algorithm: 'CIEDE2000',
		calibrationFactor: 0.71, // Примерный коэффициент для Konica Minolta
		offset: 0.0
	},
	'custom_calibration': {
		algorithm: 'CIEDE2000',
		calibrationFactor: 0.67, // Коэффициент для вашего случая (14.17 -> 9.5)
		offset: 0.0
	}
}

// Функция для тестирования калибровки
export function testCalibration(
	lab1: { l: number; a: number; b: number },
	lab2: { l: number; a: number; b: number },
	expectedDeltaE: number
): SpectrophotometerCalibration {
	const rawDeltaE = calculateDeltaE2000(lab1, lab2)
	const calibrationFactor = expectedDeltaE / rawDeltaE
	
	return {
		algorithm: 'CIEDE2000',
		calibrationFactor,
		offset: 0.0
	}
}

export function findPantoneByHex(hex: string) {
	const normalizedHex = normalizeHexColor(hex).toLowerCase();
	return pantoneData.find((color: any) => color.hex === normalizedHex);
}

export function findClosestPantoneByLab(lab: { l: number; a: number; b: number }) {
	let minDelta = Infinity;
	let closest = null;
	for (const color of pantoneData) {
		const pantoneLab = hexToLab(color.hex);
		const deltaE = calculateDeltaE(lab, pantoneLab);
		if (deltaE < minDelta) {
			minDelta = deltaE;
			closest = { ...color, lab: pantoneLab, deltaE };
		}
	}
	return closest;
}
