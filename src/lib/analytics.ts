import {
	collection,
	addDoc,
	query,
	where,
	getDocs,
	orderBy,
	limit,
	Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { PantoneColor } from '@/types'
import type {
	AnalyticsEvent,
	AnalyticsMetrics,
	WeeklyReport,
	MonthlyReport,
} from '@/types/analytics'

// Функция для тестирования подключения к Firebase
export async function testFirebaseConnection(): Promise<boolean> {
	try {
		const testQuery = query(collection(db, 'colors'), limit(1))
		await getDocs(testQuery)
		return true
	} catch (error) {
		console.error('Firebase connection failed:', error)
		return false
	}
}

// Функции трекинга событий
export async function trackEvent(
	type: AnalyticsEvent['type'],
	colorId: string,
	metadata: AnalyticsEvent['metadata'] = {},
	userId?: string
): Promise<void> {
	try {
		const event: Omit<AnalyticsEvent, 'id'> = {
			type,
			colorId,
			timestamp: Timestamp.now(),
			metadata,
		}

		// Добавляем userId только если он определен
		if (userId) {
			event.userId = userId
		}

		await addDoc(collection(db, 'analytics'), event)
	} catch (error) {
		console.error('Error tracking analytics event:', error)
		throw error
	}
}

// Специализированные функции трекинга
export async function trackColorCreated(
	colorId: string,
	colorName: string,
	manager?: string,
	userId?: string,
	recipe?: string
): Promise<void> {
	// Если у цвета нет рецепта, не записываем событие в аналитику
	// Это исключает тестовые/поисковые цвета из отчетов
	if (!recipe || recipe.trim() === '') {
		return
	}
	
	try {
		const metadata: AnalyticsEvent['metadata'] = {
			colorName,
		}
		
		// Добавляем manager только если он определен
		if (manager) {
			metadata.manager = manager
		}

		const result = await trackEvent('color_created', colorId, metadata, userId)
		return result
	} catch (error) {
		console.error('Error in trackColorCreated:', error)
		throw error
	}
}

export async function trackColorUsage(
	colorId: string,
	colorName: string,
	usageAmount: number = 1,
	userId?: string,
	recipe?: string
): Promise<void> {
	// Если передан рецепт и он пустой, не записываем событие
	if (recipe !== undefined && (!recipe || recipe.trim() === '')) {
		return
	}
	
	const metadata: AnalyticsEvent['metadata'] = {
		colorName,
		usageAmount,
	}
	
	await trackEvent('color_usage', colorId, metadata, userId)
}

export async function trackRecipeUsed(
	colorId: string,
	colorName: string,
	recipeComponents: number,
	customer?: string,
	userId?: string,
	recipe?: string
): Promise<void> {
	// Если передан рецепт и он пустой, не записываем событие
	if (recipe !== undefined && (!recipe || recipe.trim() === '')) {
		return
	}
	
	const metadata: AnalyticsEvent['metadata'] = {
		colorName,
		recipeComponents,
	}
	
	// Добавляем customer только если он определен
	if (customer) {
		metadata.customer = customer
	}
	
	await trackEvent('recipe_used', colorId, metadata, userId)
}

// Получение базовых метрик
export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
	try {
		// Получаем все цвета
		const colorsSnapshot = await getDocs(collection(db, 'colors'))
		const allColors = colorsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		})) as PantoneColor[]
		
		// Фильтруем только цвета с рецептами для аналитики
		const colors = allColors.filter(color => color.recipe && color.recipe.trim() !== '')

		// Временные рамки
		const now = new Date()
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

		let weekEvents, monthEvents, usageEvents
		
		try {
			// Получаем все события color_created и фильтруем по времени в коде
			const weekEventsQuery = query(
				collection(db, 'analytics'),
				where('type', '==', 'color_created')
			)
			const weekEventsSnapshot = await getDocs(weekEventsQuery)
			
			// Фильтруем события за неделю в коде
			weekEvents = {
				docs: weekEventsSnapshot.docs.filter(doc => {
					const data = doc.data()
					const eventTime = data.timestamp?.toDate?.() || data.timestamp
					return eventTime && eventTime >= oneWeekAgo
				})
			}
		} catch (error) {
			weekEvents = { docs: [] }
		}

		try {
			// Получаем все события color_created и фильтруем по времени в коде
			const monthEventsQuery = query(
				collection(db, 'analytics'),
				where('type', '==', 'color_created')
			)
			const monthEventsSnapshot = await getDocs(monthEventsQuery)
			
			// Фильтруем события за месяц в коде
			monthEvents = {
				docs: monthEventsSnapshot.docs.filter(doc => {
					const data = doc.data()
					const eventTime = data.timestamp?.toDate?.() || data.timestamp
					return eventTime && eventTime >= oneMonthAgo
				})
			}
		} catch (error) {
			monthEvents = { docs: [] }
		}

		try {
			// Получаем все события color_usage и фильтруем по времени в коде
			const usageEventsQuery = query(
				collection(db, 'analytics'),
				where('type', '==', 'color_usage')
			)
			const usageEventsSnapshot = await getDocs(usageEventsQuery)
			
			// Фильтруем события за неделю в коде
			usageEvents = {
				docs: usageEventsSnapshot.docs.filter(doc => {
					const data = doc.data()
					const eventTime = data.timestamp?.toDate?.() || data.timestamp
					return eventTime && eventTime >= oneWeekAgo
				})
			}
		} catch (error) {
			usageEvents = { docs: [] }
		}

		// Подсчет использований по цветам
		const usageMap = new Map<string, { count: number; name: string; hex: string }>()
		usageEvents.docs.forEach(doc => {
			const data = doc.data() as AnalyticsEvent
			const current = usageMap.get(data.colorId) || { count: 0, name: '', hex: '' }
			const color = colors.find(c => c.id === data.colorId)
			
			usageMap.set(data.colorId, {
				count: current.count + (data.metadata.usageAmount || 1),
				name: color?.name || data.metadata.colorName || 'Неизвестный цвет',
				hex: color?.hex || '#000000',
			})
		})

		// Если нет данных из analytics, используем usageCount из colors (только с рецептами)
		if (usageMap.size === 0) {
			colors
				.filter(color => (color.usageCount || 0) > 0)
				.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
				.slice(0, 5)
				.forEach(color => {
					usageMap.set(color.id, {
						count: color.usageCount || 0,
						name: color.name,
						hex: color.hex,
					})
				})
		}

		const mostUsedColorsThisWeek = Array.from(usageMap.entries())
			.map(([colorId, data]) => ({
				colorId,
				colorName: data.name,
				hex: data.hex,
				usageCount: data.count,
			}))
			.sort((a, b) => b.usageCount - a.usageCount)
			.slice(0, 5)

		// Топ красок
		const topPaints = calculateTopPaints(colors)

		const result = {
			totalColors: colors.length, // Используем только цвета с рецептами
			totalUsage: colors.reduce((sum, color) => sum + (color.usageCount || 0), 0),
			colorsCreatedThisWeek: weekEvents.docs.length,
			colorsCreatedThisMonth: monthEvents.docs.length,
			mostUsedColorsThisWeek,
			topPaints,
		}
		
		return result
	} catch (error) {
		console.error('Error getting analytics metrics:', error)
		throw error
	}
}

// Вспомогательные функции для расчетов
function calculateTopPaints(colors: PantoneColor[]): Array<{
	paintName: string
	totalUsage: number
	usageCount: number
}> {
	const paintMap = new Map<string, { totalUsage: number; usageCount: number }>()

	colors.forEach(color => {
		if (!color.recipe) return

		const recipes = parseRecipes(color.recipe)
		const colorUsage = color.usageCount || 0

		recipes.forEach(recipe => {
			recipe.items.forEach(item => {
				const current = paintMap.get(item.paint) || { totalUsage: 0, usageCount: 0 }
				paintMap.set(item.paint, {
					totalUsage: current.totalUsage + (item.amount * colorUsage),
					usageCount: current.usageCount + colorUsage,
				})
			})
		})
	})

	return Array.from(paintMap.entries())
		.map(([paintName, data]) => ({
			paintName,
			totalUsage: data.totalUsage,
			usageCount: data.usageCount,
		}))
		.sort((a, b) => b.totalUsage - a.totalUsage)
		.slice(0, 10)
}

function parseRecipes(recipeString: string) {
	const lines = recipeString.split('\n')
	const recipes: Array<{
		totalAmount: number
		material: string
		items: Array<{ paint: string; amount: number }>
	}> = []

	let currentRecipe: (typeof recipes)[0] | null = null

	lines.forEach(line => {
		const totalAmountMatch = line.match(/^Общее количество: (\d+)/)
		const materialMatch = line.match(/^Материал: (.+)/)
		const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)

		if (totalAmountMatch) {
			if (currentRecipe) recipes.push(currentRecipe)
			currentRecipe = {
				totalAmount: parseInt(totalAmountMatch[1]),
				material: '',
				items: [],
			}
		} else if (materialMatch && currentRecipe) {
			currentRecipe.material = materialMatch[1]
		} else if (paintMatch && currentRecipe) {
			currentRecipe.items.push({
				paint: paintMatch[1],
				amount: parseInt(paintMatch[2]),
			})
		}
	})

	if (currentRecipe) recipes.push(currentRecipe)
	return recipes
}

// Генерация еженедельного отчета
export async function generateWeeklyReport(): Promise<WeeklyReport> {
	try {
		const now = new Date()
		const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

		let currentWeekEvents: AnalyticsEvent[] = []
		let lastWeekEvents: AnalyticsEvent[] = []

		try {
			// События за текущую неделю
			currentWeekEvents = await getEventsInRange(weekStart, now)
		} catch (error) {
			// Используем пустой массив при ошибке
		}
		
		try {
			// События за прошлую неделю для сравнения
			lastWeekEvents = await getEventsInRange(twoWeeksAgo, weekStart)
		} catch (error) {
			// Используем пустой массив при ошибке
		}

		// Подсчет метрик
		const colorsCreated = currentWeekEvents.filter(e => e.type === 'color_created').length
		const usageEvents = currentWeekEvents.filter(e => e.type === 'color_usage')
		const totalUsage = usageEvents.reduce((sum, e) => sum + (e.metadata.usageAmount || 1), 0)

		// Топ цвета недели
		const colorUsageMap = new Map<string, { name: string; count: number }>()
		usageEvents.forEach(event => {
			const current = colorUsageMap.get(event.colorId) || { name: '', count: 0 }
			colorUsageMap.set(event.colorId, {
				name: event.metadata.colorName || 'Неизвестный цвет',
				count: current.count + (event.metadata.usageAmount || 1),
			})
		})

		let topColors = Array.from(colorUsageMap.entries())
			.map(([_, data]) => ({
				colorName: data.name,
				usageCount: data.count,
			}))
			.sort((a, b) => b.usageCount - a.usageCount)
			.slice(0, 3)

		// Если нет данных из событий, используем общие данные о цветах
		if (topColors.length === 0) {
			try {
				const colorsSnapshot = await getDocs(query(collection(db, 'colors'), orderBy('usageCount', 'desc'), limit(3)))
				topColors = colorsSnapshot.docs.map(doc => {
					const data = doc.data()
					return {
						colorName: data.name || 'Неизвестный цвет',
						usageCount: data.usageCount || 0,
					}
				})
			} catch (error) {
				// Используем пустой массив при ошибке
			}
		}

		// Сравнение с прошлой неделей
		const lastWeekColorsCreated = lastWeekEvents.filter(e => e.type === 'color_created').length
		const lastWeekUsage = lastWeekEvents
			.filter(e => e.type === 'color_usage')
			.reduce((sum, e) => sum + (e.metadata.usageAmount || 1), 0)

		const colorsCreatedChange = lastWeekColorsCreated > 0 
			? Math.round(((colorsCreated - lastWeekColorsCreated) / lastWeekColorsCreated) * 100)
			: 0

		const usageChange = lastWeekUsage > 0 
			? Math.round(((totalUsage - lastWeekUsage) / lastWeekUsage) * 100)
			: 0

		// Генерация алертов
		let alerts: WeeklyReport['alerts'] = []
		try {
			alerts = await generateAlerts()
		} catch (error) {
			// Используем пустой массив при ошибке
		}

		const result = {
			weekStart,
			weekEnd: now,
			metrics: {
				colorsCreated,
				totalUsage,
				totalOrders: Math.ceil(totalUsage / 10), // примерная оценка
				paintsUsed: Math.round(totalUsage * 0.015 * 100) / 100, // примерно 1.5% от общего использования
			},
			topColors,
			alerts,
			comparison: {
				colorsCreatedChange,
				usageChange,
			},
		}
		
		return result
	} catch (error) {
		console.error('Error generating weekly report:', error)
		throw error
	}
}

// Генерация месячного отчета
export async function generateMonthlyReport(): Promise<MonthlyReport> {
	const weeklyReport = await generateWeeklyReport()
	
	const now = new Date()
	const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

	// Получаем все цвета для анализа красок
	const colorsSnapshot = await getDocs(collection(db, 'colors'))
	const allColors = colorsSnapshot.docs.map(doc => ({
		id: doc.id,
		...doc.data(),
	})) as PantoneColor[]
	
	// Фильтруем только цвета с рецептами для аналитики
	const colors = allColors.filter(color => color.recipe && color.recipe.trim() !== '')

	const paintAnalytics = calculateTopPaints(colors).slice(0, 5)

	// Рекомендации
	const recommendations = generateRecommendations(colors)

	return {
		...weeklyReport,
		monthStart,
		monthEnd: now,
		paintAnalytics,
		recipeEfficiency: calculateRecipeEfficiency(colors),
		recommendations,
	}
}

// Вспомогательные функции
async function getEventsInRange(startDate: Date, endDate: Date): Promise<AnalyticsEvent[]> {
	try {
		// Получаем все события и фильтруем по времени в коде
		const eventsQuery = query(collection(db, 'analytics'))
		const snapshot = await getDocs(eventsQuery)
		
		const events = snapshot.docs
			.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as AnalyticsEvent[]
		
		// Фильтруем по времени в коде
		return events.filter(event => {
			const eventTime = event.timestamp?.toDate?.() || event.timestamp
			return eventTime && eventTime >= startDate && eventTime <= endDate
		})
	} catch (error) {
		console.error('Error getting events in range:', error)
		return []
	}
}

async function generateAlerts(): Promise<WeeklyReport['alerts']> {
	const alerts: WeeklyReport['alerts'] = []

	try {
		// Получаем все цвета
		const colorsSnapshot = await getDocs(collection(db, 'colors'))
		const allColors = colorsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		})) as PantoneColor[]
		
		// Фильтруем только цвета с рецептами для аналитики
		const colors = allColors.filter(color => color.recipe && color.recipe.trim() !== '')

		// Проверяем неиспользуемые цвета (>30 дней без использования)
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
		
		// Получаем все события использования
		const usageEventsQuery = query(
			collection(db, 'analytics'),
			where('type', '==', 'color_usage')
		)
		const allUsageEvents = await getDocs(usageEventsQuery)
		
		for (const color of colors) {
			// Ищем недавние использования этого цвета
			const recentUsage = allUsageEvents.docs.find(doc => {
				const data = doc.data()
				const eventTime = data.timestamp?.toDate?.() || data.timestamp
				return data.colorId === color.id && eventTime && eventTime >= thirtyDaysAgo
			})
			
			if (!recentUsage && color.createdAt) {
				// Проверяем, что цвет создан больше 30 дней назад
				const createdDate = typeof color.createdAt === 'object' && 'seconds' in color.createdAt
					? new Date(color.createdAt.seconds * 1000) 
					: new Date(color.createdAt)
				
				if (createdDate < thirtyDaysAgo) {
					const colorDisplayName = color.alternativeName 
						? `${color.name} (${color.alternativeName})`
						: color.name
					
					alerts.push({
						type: 'unused_color',
						message: `Цвет "${colorDisplayName}" не использовался более 30 дней`,
						priority: 'medium',
					})
				}
			}
		}
	} catch (error) {
		console.error('Error generating alerts:', error)
	}

	return alerts
}

function calculateRecipeEfficiency(colors: PantoneColor[]): number {
	const colorsWithRecipes = colors.filter(color => color.recipe && (color.usageCount || 0) > 0)
	if (colorsWithRecipes.length === 0) return 0

	// Упрощенный расчет эффективности на основе использования
	const totalEfficiency = colorsWithRecipes.reduce((sum, color) => {
		const usage = color.usageCount || 0
		// Эффективность = использование (максимум 10)
		const efficiency = Math.min(usage, 10)
		return sum + efficiency
	}, 0)

	return Math.round((totalEfficiency / colorsWithRecipes.length) * 10)
}

function generateRecommendations(colors: PantoneColor[]): string[] {
	const recommendations: string[] = []
	
	// Фильтруем только цвета с рецептами
	const colorsWithRecipes = colors.filter(color => color.recipe && color.recipe.trim() !== '')

	// Анализ неиспользуемых цветов
	const unusedColors = colorsWithRecipes.filter(color => (color.usageCount || 0) === 0).length
	if (unusedColors > colorsWithRecipes.length * 0.3) {
		recommendations.push(`Большое количество неиспользуемых цветов с рецептами (${unusedColors}). Рассмотрите возможность архивирования.`)
	}

	// Анализ популярных красок
	const topPaints = calculateTopPaints(colorsWithRecipes)
	if (topPaints.length > 0) {
		recommendations.push(`Самые используемые краски: ${topPaints.slice(0, 3).map(p => p.paintName).join(', ')}. Обеспечьте достаточный запас.`)
	}

	return recommendations
} 