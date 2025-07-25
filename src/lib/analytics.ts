import {
	collection,
	addDoc,
	query,
	where,
	getDocs,
	orderBy,
	limit,
	Timestamp,
	writeBatch,
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

	await trackEvent('recipe_used', colorId, metadata, userId)
}

// Получение базовых метрик
export async function getAnalyticsMetrics(
	selectedMonth?: Date
): Promise<AnalyticsMetrics> {
	try {
		// Получаем все цвета
		const colorsSnapshot = await getDocs(collection(db, 'colors'))
		const allColors = colorsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		})) as PantoneColor[]

		// Фильтруем только цвета с рецептами для аналитики
		const colors = allColors.filter(
			color => color.recipe && color.recipe.trim() !== ''
		)

		// Временные рамки
		const now = new Date()
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

		// Определяем границы выбранного месяца или используем текущий месяц
		let monthStart: Date
		let monthEnd: Date

		if (selectedMonth) {
			monthStart = new Date(
				selectedMonth.getFullYear(),
				selectedMonth.getMonth(),
				1
			)
			monthEnd = new Date(
				selectedMonth.getFullYear(),
				selectedMonth.getMonth() + 1,
				0,
				23,
				59,
				59,
				999
			)
		} else {
			// По умолчанию - текущий месяц
			monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
			monthEnd = now
		}

		let weekEvents, monthEvents, usageEvents, monthUsageEvents

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
				}),
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
					return eventTime && eventTime >= monthStart && eventTime <= monthEnd
				}),
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
				}),
			}

			// Фильтруем события использования за месяц в коде
			monthUsageEvents = {
				docs: usageEventsSnapshot.docs.filter(doc => {
					const data = doc.data()
					const eventTime = data.timestamp?.toDate?.() || data.timestamp
					return eventTime && eventTime >= monthStart && eventTime <= monthEnd
				}),
			}
		} catch (error) {
			usageEvents = { docs: [] }
			monthUsageEvents = { docs: [] }
		}

		// Подсчет использований по цветам
		const usageMap = new Map<
			string,
			{ count: number; name: string; hex: string }
		>()
		usageEvents.docs.forEach(doc => {
			const data = doc.data() as AnalyticsEvent
			const current = usageMap.get(data.colorId) || {
				count: 0,
				name: '',
				hex: '',
			}
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

		// Подсчет использований по цветам за месяц
		const monthUsageMap = new Map<
			string,
			{ count: number; name: string; hex: string }
		>()
		monthUsageEvents.docs.forEach(doc => {
			const data = doc.data() as AnalyticsEvent
			const current = monthUsageMap.get(data.colorId) || {
				count: 0,
				name: '',
				hex: '',
			}
			const color = colors.find(c => c.id === data.colorId)

			monthUsageMap.set(data.colorId, {
				count: current.count + (data.metadata.usageAmount || 1),
				name: color?.name || data.metadata.colorName || 'Неизвестный цвет',
				hex: color?.hex || '#000000',
			})
		})

		// Если нет данных из analytics за месяц, используем usageCount из colors (только с рецептами)
		if (monthUsageMap.size === 0) {
			colors
				.filter(color => (color.usageCount || 0) > 0)
				.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
				.slice(0, 5)
				.forEach(color => {
					monthUsageMap.set(color.id, {
						count: color.usageCount || 0,
						name: color.name,
						hex: color.hex,
					})
				})
		}

		const mostUsedColorsThisMonth = Array.from(monthUsageMap.entries())
			.map(([colorId, data]) => ({
				colorId,
				colorName: data.name,
				hex: data.hex,
				usageCount: data.count,
			}))
			.sort((a, b) => b.usageCount - a.usageCount)
			.slice(0, 5)

		// Цвета созданные за месяц
		const monthlyCreatedColors = await getColorsCreatedInMonth(
			colors,
			monthEvents.docs
		)

		// Подсчитываем общее использование за выбранный месяц
		const totalUsageThisMonth = monthUsageEvents.docs.reduce((sum, doc) => {
			const data = doc.data() as AnalyticsEvent
			return sum + (data.metadata.usageAmount || 1)
		}, 0)

		const result = {
			totalColors: colors.length, // Используем только цвета с рецептами
			totalUsage:
				totalUsageThisMonth > 0
					? totalUsageThisMonth
					: colors.reduce((sum, color) => sum + (color.usageCount || 0), 0),
			colorsCreatedThisWeek: weekEvents.docs.length,
			colorsCreatedThisMonth: monthEvents.docs.length,
			mostUsedColorsThisMonth,
			monthlyCreatedColors,
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
				const current = paintMap.get(item.paint) || {
					totalUsage: 0,
					usageCount: 0,
				}
				paintMap.set(item.paint, {
					totalUsage: current.totalUsage + item.amount * colorUsage,
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

// Получение цветов созданных за месяц
async function getColorsCreatedInMonth(
	colors: PantoneColor[],
	monthEvents: any[]
): Promise<
	Array<{
		colorId: string
		colorName: string
		hex: string
		createdAt: Date
		recipe?: string
	}>
> {
	const createdColorsMap = new Map<
		string,
		{
			colorName: string
			hex: string
			createdAt: Date
			recipe?: string
		}
	>()

	// Получаем цвета ТОЛЬКО из событий аналитики
	monthEvents.forEach(eventDoc => {
		// monthEvents - это массив документов из Firebase, нужно получить данные
		const event = eventDoc.data ? eventDoc.data() : eventDoc

		if (event.type === 'color_created') {
			const color = colors.find(c => c.id === event.colorId)

			if (color) {
				const eventDate = event.timestamp?.toDate?.() || event.timestamp

				createdColorsMap.set(event.colorId, {
					colorName: color.name,
					hex: color.hex,
					createdAt: eventDate,
					recipe: color.recipe,
				})
			}
		}
	})

	// НЕ используем fallback - показываем только те цвета, которые есть в аналитике

	return Array.from(createdColorsMap.entries())
		.map(([colorId, data]) => ({
			colorId,
			...data,
		}))
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, 10)
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
		const colorsCreated = currentWeekEvents.filter(
			e => e.type === 'color_created'
		).length
		const usageEvents = currentWeekEvents.filter(e => e.type === 'color_usage')
		const totalUsage = usageEvents.reduce(
			(sum, e) => sum + (e.metadata.usageAmount || 1),
			0
		)

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
				const colorsSnapshot = await getDocs(
					query(
						collection(db, 'colors'),
						orderBy('usageCount', 'desc'),
						limit(3)
					)
				)
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
		const lastWeekColorsCreated = lastWeekEvents.filter(
			e => e.type === 'color_created'
		).length
		const lastWeekUsage = lastWeekEvents
			.filter(e => e.type === 'color_usage')
			.reduce((sum, e) => sum + (e.metadata.usageAmount || 1), 0)

		const colorsCreatedChange =
			lastWeekColorsCreated > 0
				? Math.round(
						((colorsCreated - lastWeekColorsCreated) / lastWeekColorsCreated) *
							100
				  )
				: 0

		const usageChange =
			lastWeekUsage > 0
				? Math.round(((totalUsage - lastWeekUsage) / lastWeekUsage) * 100)
				: 0

		// Убираем генерацию старых алертов
		const alerts: WeeklyReport['alerts'] = []

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
	const colors = allColors.filter(
		color => color.recipe && color.recipe.trim() !== ''
	)

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
async function getEventsInRange(
	startDate: Date,
	endDate: Date
): Promise<AnalyticsEvent[]> {
	try {
		// Получаем все события и фильтруем по времени в коде
		const eventsQuery = query(collection(db, 'analytics'))
		const snapshot = await getDocs(eventsQuery)

		const events = snapshot.docs.map(doc => ({
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

/*
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
		const colors = allColors.filter(
			color => color.recipe && color.recipe.trim() !== ''
		)

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
				return (
					data.colorId === color.id && eventTime && eventTime >= thirtyDaysAgo
				)
			})

			if (!recentUsage && color.createdAt) {
				// Проверяем, что цвет создан больше 30 дней назад
				const createdDate =
					typeof color.createdAt === 'object' && 'seconds' in color.createdAt
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
*/

function calculateRecipeEfficiency(colors: PantoneColor[]): number {
	const colorsWithRecipes = colors.filter(
		color => color.recipe && (color.usageCount || 0) > 0
	)
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
	const colorsWithRecipes = colors.filter(
		color => color.recipe && color.recipe.trim() !== ''
	)

	// Анализ неиспользуемых цветов
	const unusedColors = colorsWithRecipes.filter(
		color => (color.usageCount || 0) === 0
	).length
	if (unusedColors > colorsWithRecipes.length * 0.3) {
		recommendations.push(
			`Большое количество неиспользуемых цветов с рецептами (${unusedColors}). Рассмотрите возможность архивирования.`
		)
	}

	// Анализ популярных красок
	const topPaints = calculateTopPaints(colorsWithRecipes)
	if (topPaints.length > 0) {
		recommendations.push(
			`Самые используемые краски: ${topPaints
				.slice(0, 3)
				.map(p => p.paintName)
				.join(', ')}. Обеспечьте достаточный запас.`
		)
	}

	return recommendations
}

// Функция для очистки старых данных аналитики (оставляем только последние 2 месяца)
export async function cleanupOldAnalyticsData(): Promise<{
	deletedCount: number
	success: boolean
	error?: string
}> {
	try {
		const now = new Date()
		// Оставляем данные за последние 2 месяца
		const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

		console.log(
			`Cleaning up analytics data older than ${twoMonthsAgo.toLocaleDateString(
				'ru-RU'
			)}`
		)

		// Получаем все события аналитики
		const analyticsQuery = query(collection(db, 'analytics'))
		const snapshot = await getDocs(analyticsQuery)

		// Фильтруем старые события
		const oldEvents: any[] = []
		snapshot.docs.forEach(docSnapshot => {
			const data = docSnapshot.data()
			const eventTime = data.timestamp?.toDate?.() || data.timestamp

			if (eventTime && eventTime < twoMonthsAgo) {
				oldEvents.push(docSnapshot)
			}
		})

		console.log(`Found ${oldEvents.length} old analytics events to delete`)

		if (oldEvents.length === 0) {
			return {
				deletedCount: 0,
				success: true,
			}
		}

		// Удаляем старые события пачками (максимум 500 за раз для Firestore)
		const batchSize = 500
		let deletedCount = 0

		for (let i = 0; i < oldEvents.length; i += batchSize) {
			const batch = writeBatch(db)
			const batchEvents = oldEvents.slice(i, i + batchSize)

			batchEvents.forEach(eventDoc => {
				batch.delete(eventDoc.ref)
			})

			await batch.commit()
			deletedCount += batchEvents.length

			console.log(
				`Deleted ${deletedCount}/${oldEvents.length} old analytics events`
			)
		}

		console.log(`Successfully cleaned up ${deletedCount} old analytics events`)

		return {
			deletedCount,
			success: true,
		}
	} catch (error) {
		console.error('Error cleaning up old analytics data:', error)
		return {
			deletedCount: 0,
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		}
	}
}

// Автоматическая очистка при каждой загрузке метрик (раз в день максимум)
let lastCleanupDate: Date | null = null

export async function performAutomaticCleanup(): Promise<void> {
	try {
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		// Проверяем, нужна ли очистка (раз в день максимум)
		if (lastCleanupDate && lastCleanupDate >= today) {
			return
		}

		console.log('Performing automatic cleanup of old analytics data...')
		const result = await cleanupOldAnalyticsData()

		if (result.success) {
			lastCleanupDate = today
			if (result.deletedCount > 0) {
				console.log(
					`Automatic cleanup completed: ${result.deletedCount} old records deleted`
				)
			}
		} else {
			console.error('Automatic cleanup failed:', result.error)
		}
	} catch (error) {
		console.error('Error in automatic cleanup:', error)
	}
}

// Функция для получения аналитики неиспользуемых цветов по месяцам
export async function getUnusedColorsAnalytics(
	period: '3months' | '6months' | '12months' = '6months'
): Promise<
	Array<{
		month: string
		totalUnused: number
		unusedColors: Array<{
			colorId: string
			colorName: string
			hex: string
			lastUsed: Date | null
			createdAt: Date
			daysUnused: number
			recipe?: string
		}>
		trend: 'increasing' | 'decreasing' | 'stable'
	}>
> {
	try {
		// Получаем все цвета
		const colorsSnapshot = await getDocs(collection(db, 'colors'))
		const allColors = colorsSnapshot.docs.map(doc => ({
			id: doc.id,
			...doc.data(),
		})) as PantoneColor[]

		// Фильтруем только цвета с рецептами и в наличии для аналитики
		const colors = allColors.filter(
			color => color.recipe && color.recipe.trim() !== '' && color.inStock
		)

		// Получаем все события использования
		const usageEventsQuery = query(
			collection(db, 'analytics'),
			where('type', '==', 'color_usage')
		)
		const allUsageEvents = await getDocs(usageEventsQuery)

		// Определяем период для анализа - начинаем с текущего месяца
		const now = new Date()
		const monthsToAnalyze =
			period === '3months' ? 3 : period === '6months' ? 6 : 12

		const monthlyStats: Array<{
			month: string
			totalUnused: number
			unusedColors: Array<{
				colorId: string
				colorName: string
				hex: string
				lastUsed: Date | null
				createdAt: Date
				daysUnused: number
				recipe?: string
			}>
			trend: 'increasing' | 'decreasing' | 'stable'
		}> = []

		// Анализируем каждый месяц, начиная с текущего
		for (let i = 0; i < monthsToAnalyze; i++) {
			const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
			const monthEnd = new Date(
				now.getFullYear(),
				now.getMonth() - i + 1,
				0,
				23,
				59,
				59,
				999
			)
			const monthName = monthStart.toLocaleDateString('ru-RU', {
				month: 'long',
				year: 'numeric',
			})

			// Находим неиспользуемые цвета для этого месяца
			const unusedColors = colors
				.filter(color => {
					// Ищем последнее использование цвета
					const colorUsageEvents = allUsageEvents.docs.filter(doc => {
						const data = doc.data()
						return data.colorId === color.id
					})

					if (colorUsageEvents.length === 0) {
						// Цвет никогда не использовался
						const createdDate =
							typeof color.createdAt === 'object' &&
							'seconds' in color.createdAt
								? new Date(color.createdAt.seconds * 1000)
								: new Date(color.createdAt || new Date())

						return createdDate <= monthEnd
					}

					// Находим последнее использование
					const lastUsage = colorUsageEvents.reduce((latest, doc) => {
						const data = doc.data()
						const eventTime = data.timestamp?.toDate?.() || data.timestamp
						return eventTime > latest ? eventTime : latest
					}, new Date(0))

					// Цвет не использовался в этом месяце
					return lastUsage < monthStart
				})
				.map(color => {
					// Находим последнее использование для расчета дней
					const colorUsageEvents = allUsageEvents.docs.filter(doc => {
						const data = doc.data()
						return data.colorId === color.id
					})

					let lastUsed: Date | null = null
					let daysUnused = 0

					if (colorUsageEvents.length > 0) {
						lastUsed = colorUsageEvents.reduce((latest, doc) => {
							const data = doc.data()
							const eventTime = data.timestamp?.toDate?.() || data.timestamp
							return eventTime > latest ? eventTime : latest
						}, new Date(0))

						daysUnused = Math.floor(
							(now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
						)
					} else {
						// Цвет никогда не использовался
						const createdDate =
							typeof color.createdAt === 'object' &&
							'seconds' in color.createdAt
								? new Date(color.createdAt.seconds * 1000)
								: new Date(color.createdAt || new Date())

						daysUnused = Math.floor(
							(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
						)
					}

					const createdDate =
						typeof color.createdAt === 'object' && 'seconds' in color.createdAt
							? new Date(color.createdAt.seconds * 1000)
							: new Date(color.createdAt || new Date())

					return {
						colorId: color.id,
						colorName: color.alternativeName
							? `${color.name} (${color.alternativeName})`
							: color.name,
						hex: color.hex,
						lastUsed,
						createdAt: createdDate,
						daysUnused,
						recipe: color.recipe,
					}
				})

			// Определяем тренд (сравниваем с предыдущим месяцем)
			let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
			if (monthlyStats.length > 0) {
				const previousMonth = monthlyStats[monthlyStats.length - 1]
				if (unusedColors.length > previousMonth.totalUnused) {
					trend = 'increasing'
				} else if (unusedColors.length < previousMonth.totalUnused) {
					trend = 'decreasing'
				}
			}

			monthlyStats.push({
				month: monthName,
				totalUnused: unusedColors.length,
				unusedColors: unusedColors.sort((a, b) => b.daysUnused - a.daysUnused),
				trend,
			})
		}

		return monthlyStats.reverse() // Сортируем по хронологии
	} catch (error) {
		console.error('Error getting unused colors analytics:', error)
		return []
	}
}
