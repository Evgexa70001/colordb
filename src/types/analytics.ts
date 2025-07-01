export interface AnalyticsEvent {
	id?: string
	type: 'color_created' | 'color_usage' | 'color_searched' | 'recipe_used' | 'color_edited'
	colorId: string
	userId?: string
	timestamp: any // FirebaseTimestamp
	metadata: {
		colorName?: string
		usageAmount?: number
		searchQuery?: string
		recipeComponents?: number
			category?: string
		oldValue?: any
		newValue?: any
	}
}

export interface AnalyticsMetrics {
	totalColors: number
	totalUsage: number
	colorsCreatedThisWeek: number
	colorsCreatedThisMonth: number
	mostUsedColorsThisWeek: Array<{
		colorId: string
		colorName: string
		hex: string
		usageCount: number
	}>
	monthlyCreatedColors: Array<{
		colorId: string
		colorName: string
		hex: string
		createdAt: Date
		recipe?: string
	}>
}

export interface PaintUsageStats {
	paintName: string
	totalUsage: number // в граммах
	usageCount: number // количество раз использования
	usageByWeek: Array<{
		week: string
		amount: number
	}>
	topRecipes: Array<{
		colorId: string
		colorName: string
		percentage: number
		usageCount: number
	}>
}

export interface RecipeEfficiencyStats {
	colorId: string
	colorName: string
	totalUsage: number
	complexity: number // количество компонентов
	lastUsed: Date
	averageUsagePerWeek: number
	isUnderutilized: boolean // не использовался >30 дней
}

export interface WeeklyReport {
	weekStart: Date
	weekEnd: Date
	metrics: {
		colorsCreated: number
		totalUsage: number
		totalOrders: number
		paintsUsed: number // в кг
	}
	topColors: Array<{
		colorName: string
		usageCount: number
	}>
	alerts: Array<{
		type: 'low_paint' | 'inefficient_recipe' | 'unused_color'
		message: string
		priority: 'low' | 'medium' | 'high'
	}>
	comparison: {
		colorsCreatedChange: number // процент к прошлой неделе
		usageChange: number
	}
}

export interface MonthlyReport extends WeeklyReport {
	monthStart: Date
	monthEnd: Date
	paintAnalytics: Array<{
		paintName: string
		totalUsage: number
		cost?: number
	}>
	recipeEfficiency: number // общий процент эффективности
	recommendations: string[]
} 