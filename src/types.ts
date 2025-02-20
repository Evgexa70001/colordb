// User types
export interface User {
	uid: string
	email: string | null
	isAdmin: boolean
}

// Color types
export interface PantoneColor {
	id: string
	name: string
	alternativeName?: string | null
	hex: string
	category: string
	customers?: string[]
	inStock: boolean
	recipe?: string
	notes?: string | null
	manager?: string | null
	createdAt?: string | { seconds: number; nanoseconds: number }
	updatedAt?: string | { seconds: number; nanoseconds: number }
	isVerified?: boolean
	usageCount?: number
	linkedColors?: string[]
	images?: string[]
	labValues?: {
		l: number
		a: number
		b: number
	}
	labSource?: 'manual' | 'converted'
}

export interface ColorData {
	name: string
	alternativeName?: string | null
	hex: string
	category: string
	recipe?: string
	customers?: string[]
	inStock: boolean
	isVerified?: boolean
	notes?: string | null
	manager?: string | null
	images?: string[]
	labValues?: { l: number; a: number; b: number }
	labSource?: 'manual' | 'converted'
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
	similarColors: (PantoneColor & { distance?: number })[]
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

// Добавьте эти интерфейсы к существующим типам
export interface EquipmentSection {
	anilox: string
	paint: string
	additionalInfo: string
}

export interface EquipmentGroup {
	name: string
	material: string
	date: string
	sections: EquipmentSection[]
}

export interface Equipment {
	id: string
	imageUrl?: string
	groups: EquipmentGroup[]
	createdAt: Date
	customers?: string[]
}
