// User types
export interface User {
	uid: string
	email: string | null
	isAdmin: boolean
}

// Color types
export interface AdditionalColor {
	name: string
	hex: string
	anilox: string
	labValues?: {
		l: number
		a: number
		b: number
	}
	labSource?: 'manual' | 'converted'
}

export interface PantoneColor {
	id: string
	name: string
	hex: string
	category: string
	inStock: boolean
	isVerified: boolean
	recipe?: string
	notes?: string
	manager?: string
	customers?: string[]
	alternativeName?: string
	createdAt?: string | { seconds: number; nanoseconds: number }
	updatedAt?: string | { seconds: number; nanoseconds: number }
	usageCount?: number
	linkedColors?: string[]
	images?: string[]
	labValues?: {
		l: number
		a: number
		b: number
	}
	labSource?: 'manual' | 'converted'
	additionalColors?: Array<{
		name: string
		hex: string
		anilox: string
		labValues?: {
			l: number
			a: number
			b: number
		}
		labSource?: 'manual' | 'converted'
	}>
	distance?: {
		deltaE2000: number
		deltaE76: number
	}
	shelfLocation?: string
	tasks?: Array<{ id: string; text: string; status: 'open' | 'done' }>
	recipeHistory?: Array<{
		recipe: string
		updatedAt: string | { seconds: number; nanoseconds: number }
		updatedBy?: string
	}>
}

export interface ColorData {
	name: string
	alternativeName?: string
	hex: string
	category: string
	recipe?: string
	customers?: string[]
	inStock: boolean
	isVerified: boolean
	notes?: string
	manager?: string
	images?: string[]
	labValues?: { l: number; a: number; b: number }
	labSource?: 'manual' | 'converted'
	additionalColors?: AdditionalColor[]
	shelfLocation?: string
	tasks?: Array<{ id: string; text: string; status: 'open' | 'done' }>
}

// Modal Props
export interface ColorModalProps {
	color: PantoneColor
	isOpen: boolean
	onClose: () => void
	onSave: (color: PantoneColor) => void
	categories: string[]
	existingCustomers: string[]
}

export interface NewColorModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (color: Omit<PantoneColor, 'id'>) => void
	categories: string[]
	existingCustomers: string[]
}

export interface NewCategoryModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (name: string) => void
	existingCategories: string[]
}

export interface ColorDetailsModalProps {
	color: PantoneColor
	isOpen: boolean
	onClose: () => void
	similarColors: (PantoneColor & {
		distance?: {
			deltaE2000: number
			deltaE76: number
		}
		matchingColor?: {
			name: string
			hex: string
			isAdditional: boolean
		}
		matchedWith?: {
			name: string
			hex: string
			isAdditional: boolean
		}
	})[]
}

// Recipe types
export interface Recipe {
	totalAmount: number
	material: string
	comment?: string
	name?: string
	anilox?: string
	items: { paint: string; amount: number }[]
}

// Color info types
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

export interface MetamerismAnalysis {
	isMetameric: boolean
	severity: 'low' | 'medium' | 'high'
	problematicLightSources: string[]
	deltaEUnderDifferentLights: Record<string, number>
	recommendation: string
	averageDeltaE: number
}

// Расширенные типы для работы с освещением
export interface LightSource {
	id: string
	name: string
	type: 'daylight' | 'fluorescent' | 'led' | 'incandescent' | 'uv'
	colorTemperature: number // в Кельвинах
	cri?: number // Color Rendering Index
	description?: string
}

// Расширенные типы для работы с освещением
export interface ExtendedLightSource extends LightSource {
	spectralPowerDistribution?: number[] // Спектральное распределение мощности
	uvContent?: number // Содержание УФ излучения (0-1)
	irContent?: number // Содержание ИК излучения (0-1)
	flickerFrequency?: number // Частота мерцания (Гц)
	usage: 'printing' | 'retail' | 'home' | 'office' | 'industrial' | 'outdoor'
	timeOfDay?: 'morning' | 'noon' | 'evening' | 'night'
	geography?: 'northern' | 'southern' | 'equatorial'
	quality: 'professional' | 'commercial' | 'consumer'
}

export interface LightingConditions {
	primaryLight: ExtendedLightSource
	secondaryLights?: ExtendedLightSource[]
	ambientLevel: number // 0-1, уровень окружающего света
	directionalLight?: {
		angle: number // Угол падения света
		intensity: number // Интенсивность
		shadowSoftness: number // Мягкость теней
	}
	surfaceProperties?: {
		gloss: number // Глянцевость поверхности (0-1)
		texture: 'smooth' | 'textured' | 'matte'
		substrate: 'paper' | 'plastic' | 'metal' | 'fabric'
	}
}

export interface MetamerismTest {
	id: string
	name: string
	description: string
	lightSources: ExtendedLightSource[]
	acceptanceThreshold: number // Максимальный допустимый ΔE
	criticalityLevel: 'low' | 'medium' | 'high' | 'critical'
	industry: 'flexography' | 'offset' | 'digital' | 'packaging' | 'textile'
}

export interface ColorAppearance {
	lightSourceId: string
	perceivedColor: {
		hex: string
		lab: { l: number; a: number; b: number }
		description: string // Словесное описание цвета
	}
	contrast: number // Контраст с фоном
	visibility: number // Видимость (0-1)
	colorShift: {
		magnitude: number // Величина сдвига
		direction: string // Направление сдвига (warmer/cooler/lighter/darker)
	}
	warnings: string[]
}

export interface MetamerismReport {
	colorId: string
	testDate: Date
	conditions: LightingConditions
	appearances: ColorAppearance[]
	overallAssessment: {
		severity: 'acceptable' | 'noticeable' | 'problematic' | 'critical'
		recommendation: string
		suitableApplications: string[]
		restrictedApplications: string[]
	}
	comparisonPairs: Array<{
		light1: string
		light2: string
		deltaE: number
		visualDifference: 'imperceptible' | 'slight' | 'noticeable' | 'significant'
		acceptanceStatus: 'pass' | 'marginal' | 'fail'
	}>
}

export interface LightingEnvironment {
	id: string
	name: string
	description: string
	lighting: LightingConditions
	typicalUse: string[]
	criticalFactors: string[]
}

// Новые типы для журнала отклонений и корректировок
export interface ColorDeviation {
	id: string
	colorId: string
	colorName: string
	deviationType:
		| 'color_mismatch'
		| 'recipe_adjustment'
		| 'quality_issue'
		| 'customer_feedback'
		| 'production_error'
	techCardNumber?: string // Заменили severity на номер тех.карты
	detectedAt: Date
	detectedBy: string // ID пользователя
	description: string
	originalValues: {
		hex?: string
		lab?: { l: number; a: number; b: number }
		recipe?: string
	}
	targetValues: {
		hex?: string
		lab?: { l: number; a: number; b: number }
		recipe?: string
	}
	// Поля для координат эталона и текущего образца
	referenceCoordinates?: {
		l: number
		a: number
		b: number
	}
	currentCoordinates?: {
		l: number
		a: number
		b: number
	}
	deltaE?: {
		deltaE2000: number
	}
	correctionApplied: boolean
	correctionDetails?: string
	status: 'open' | 'in_progress' | 'resolved' | 'rejected'
	assignedTo?: string
	resolvedAt?: Date
	resolvedBy?: string
	attachments?: string[] // URLs к изображениям/документам
}

export interface ColorCorrection {
	id: string
	deviationId: string
	correctionType:
		| 'recipe_adjustment'
		| 'color_replacement'
		| 'process_change'
		| 'parameter_tuning'
	appliedAt: Date
	appliedBy: string
	correctionData: {
		beforeValues: {
			hex?: string
			lab?: { l: number; a: number; b: number }
			recipe?: string
		}
		afterValues: {
			hex?: string
			lab?: { l: number; a: number; b: number }
			recipe?: string
		}
		adjustments: string[]
	}
	effectivenessRating?: number // 1-5 звезд
	verificationResults?: {
		deltaEImprovement: number
		visualAssessment: 'poor' | 'fair' | 'good' | 'excellent'
		approvedBy: string
		approvedAt: Date
	}
	notes?: string
}
