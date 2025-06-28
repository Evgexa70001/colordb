import {
	ExtendedLightSource,
	MetamerismTest,
	ColorAppearance,
	MetamerismReport,
	LightingEnvironment,
} from '../types'
import { calculateDeltaE, hexToLab, labToHex } from './colorUtils'

// Расширенная база источников света для флексографии
export const EXTENDED_LIGHT_SOURCES: ExtendedLightSource[] = [
	{
		id: 'd50_print',
		name: 'D50 Печатная кабина',
		type: 'daylight',
		colorTemperature: 5000,
		cri: 98,
		description: 'Профессиональная кабина для оценки печатной продукции',
		usage: 'printing',
		quality: 'professional',
		uvContent: 0.02,
		irContent: 0.15,
	},
	{
		id: 'd65_office',
		name: 'D65 Офисное освещение',
		type: 'daylight',
		colorTemperature: 6500,
		cri: 95,
		description: 'Стандартное дневное освещение офиса',
		usage: 'office',
		timeOfDay: 'noon',
		quality: 'commercial',
		uvContent: 0.03,
		irContent: 0.12,
	},
	{
		id: 'store_led_4000k',
		name: 'Магазин LED 4000K',
		type: 'led',
		colorTemperature: 4000,
		cri: 85,
		description: 'Типичное светодиодное освещение супермаркета',
		usage: 'retail',
		quality: 'commercial',
		flickerFrequency: 120,
		uvContent: 0.001,
		irContent: 0.05,
	},
	{
		id: 'store_led_3000k',
		name: 'Магазин LED 3000K',
		type: 'led',
		colorTemperature: 3000,
		cri: 82,
		description: 'Теплое светодиодное освещение магазина',
		usage: 'retail',
		quality: 'commercial',
		flickerFrequency: 120,
		uvContent: 0.001,
		irContent: 0.06,
	},
	{
		id: 'home_led_2700k',
		name: 'Домашнее LED 2700K',
		type: 'led',
		colorTemperature: 2700,
		cri: 80,
		description: 'Теплое домашнее светодиодное освещение',
		usage: 'home',
		timeOfDay: 'evening',
		quality: 'consumer',
		flickerFrequency: 100,
		uvContent: 0.001,
		irContent: 0.08,
	},
	{
		id: 'fluorescent_cool',
		name: 'Флуоресцентный холодный',
		type: 'fluorescent',
		colorTemperature: 4100,
		cri: 75,
		description: 'Холодное флуоресцентное освещение',
		usage: 'office',
		quality: 'commercial',
		flickerFrequency: 50,
		uvContent: 0.15,
		irContent: 0.05,
	},
	{
		id: 'fluorescent_warm',
		name: 'Флуоресцентный теплый',
		type: 'fluorescent',
		colorTemperature: 3000,
		cri: 78,
		description: 'Теплое флуоресцентное освещение',
		usage: 'office',
		quality: 'commercial',
		flickerFrequency: 50,
		uvContent: 0.12,
		irContent: 0.06,
	},
	{
		id: 'incandescent',
		name: 'Лампа накаливания',
		type: 'incandescent',
		colorTemperature: 2700,
		cri: 100,
		description: 'Классическая лампа накаливания',
		usage: 'home',
		timeOfDay: 'evening',
		quality: 'consumer',
		uvContent: 0.001,
		irContent: 0.85,
	},
	{
		id: 'halogen',
		name: 'Галогенная лампа',
		type: 'incandescent',
		colorTemperature: 3000,
		cri: 100,
		description: 'Галогенная лампа для акцентного освещения',
		usage: 'retail',
		quality: 'commercial',
		uvContent: 0.02,
		irContent: 0.75,
	},
	{
		id: 'uv_booth_d50',
		name: 'UV кабина D50',
		type: 'uv',
		colorTemperature: 5000,
		cri: 98,
		description: 'Профессиональная кабина с УФ подсветкой',
		usage: 'printing',
		quality: 'professional',
		uvContent: 0.25,
		irContent: 0.1,
	},
	{
		id: 'outdoor_daylight',
		name: 'Естественный дневной свет',
		type: 'daylight',
		colorTemperature: 5500,
		cri: 100,
		description: 'Естественное освещение на открытом воздухе',
		usage: 'outdoor',
		timeOfDay: 'noon',
		geography: 'northern',
		quality: 'professional',
		uvContent: 0.05,
		irContent: 0.45,
	},
	{
		id: 'cloudy_daylight',
		name: 'Пасмурный день',
		type: 'daylight',
		colorTemperature: 6500,
		cri: 95,
		description: 'Естественное освещение в пасмурную погоду',
		usage: 'outdoor',
		timeOfDay: 'noon',
		geography: 'northern',
		quality: 'professional',
		uvContent: 0.03,
		irContent: 0.25,
	},
]

// Предустановленные тесты метамеризма для различных применений
export const METAMERISM_TESTS: MetamerismTest[] = [
	{
		id: 'flexo_standard',
		name: 'Флексографический стандарт',
		description: 'Стандартный тест для флексографической печати',
		lightSources: [
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd50_print')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'store_led_4000k')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'home_led_2700k')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'outdoor_daylight')!,
		],
		acceptanceThreshold: 2.0,
		criticalityLevel: 'medium',
		industry: 'flexography',
	},
	{
		id: 'packaging_retail',
		name: 'Упаковка для ритейла',
		description: 'Тест для упаковочной продукции в розничной торговле',
		lightSources: [
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd50_print')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'store_led_4000k')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'store_led_3000k')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'fluorescent_cool')!,
		],
		acceptanceThreshold: 1.5,
		criticalityLevel: 'high',
		industry: 'packaging',
	},
	{
		id: 'critical_matching',
		name: 'Критическое соответствие',
		description: 'Максимально строгий тест для критичных применений',
		lightSources: [
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd50_print')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd65_office')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'store_led_4000k')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'fluorescent_cool')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'uv_booth_d50')!,
		],
		acceptanceThreshold: 1.0,
		criticalityLevel: 'critical',
		industry: 'flexography',
	},
	{
		id: 'basic_check',
		name: 'Базовая проверка',
		description: 'Простой тест для базовой оценки метамеризма',
		lightSources: [
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd50_print')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'store_led_4000k')!,
			EXTENDED_LIGHT_SOURCES.find(l => l.id === 'incandescent')!,
		],
		acceptanceThreshold: 3.0,
		criticalityLevel: 'low',
		industry: 'flexography',
	},
]

// Типичные среды освещения
export const LIGHTING_ENVIRONMENTS: LightingEnvironment[] = [
	{
		id: 'print_shop',
		name: 'Типография',
		description: 'Производственная среда типографии',
		lighting: {
			primaryLight: EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd50_print')!,
			secondaryLights: [
				EXTENDED_LIGHT_SOURCES.find(l => l.id === 'fluorescent_cool')!,
			],
			ambientLevel: 0.7,
			surfaceProperties: {
				gloss: 0.2,
				texture: 'smooth',
				substrate: 'paper',
			},
		},
		typicalUse: ['Печать', 'Цветопроба', 'Контроль качества'],
		criticalFactors: ['Цветовая точность', 'Консистентность'],
	},
	{
		id: 'supermarket',
		name: 'Супермаркет',
		description: 'Типичная среда супермаркета',
		lighting: {
			primaryLight: EXTENDED_LIGHT_SOURCES.find(
				l => l.id === 'store_led_4000k'
			)!,
			secondaryLights: [
				EXTENDED_LIGHT_SOURCES.find(l => l.id === 'fluorescent_cool')!,
			],
			ambientLevel: 0.8,
			surfaceProperties: {
				gloss: 0.3,
				texture: 'smooth',
				substrate: 'plastic',
			},
		},
		typicalUse: ['Продажа товаров', 'Презентация упаковки'],
		criticalFactors: ['Привлекательность', 'Узнаваемость бренда'],
	},
	{
		id: 'home_kitchen',
		name: 'Домашняя кухня',
		description: 'Типичная домашняя кухня',
		lighting: {
			primaryLight: EXTENDED_LIGHT_SOURCES.find(
				l => l.id === 'home_led_2700k'
			)!,
			ambientLevel: 0.6,
			surfaceProperties: {
				gloss: 0.1,
				texture: 'smooth',
				substrate: 'paper',
			},
		},
		typicalUse: ['Хранение продуктов', 'Повседневное использование'],
		criticalFactors: ['Читаемость', 'Естественность цвета'],
	},
	{
		id: 'office',
		name: 'Офис',
		description: 'Типичная офисная среда',
		lighting: {
			primaryLight: EXTENDED_LIGHT_SOURCES.find(l => l.id === 'd65_office')!,
			secondaryLights: [
				EXTENDED_LIGHT_SOURCES.find(l => l.id === 'fluorescent_cool')!,
			],
			ambientLevel: 0.75,
			surfaceProperties: {
				gloss: 0.2,
				texture: 'smooth',
				substrate: 'paper',
			},
		},
		typicalUse: ['Документооборот', 'Презентации'],
		criticalFactors: ['Читаемость', 'Профессиональный вид'],
	},
]

/**
 * Создает полный отчет о метамеризме для цвета
 */
export function generateMetamerismReport(
	color: { hex: string; lab?: { l: number; a: number; b: number } },
	test: MetamerismTest = METAMERISM_TESTS[0]
): MetamerismReport {
	const colorLab = color.lab || hexToLab(color.hex)
	const appearances: ColorAppearance[] = []
	const comparisonPairs: MetamerismReport['comparisonPairs'] = []

	// Анализируем внешний вид под каждым источником света
	test.lightSources.forEach(lightSource => {
		const appearance = simulateColorAppearance(colorLab, lightSource)
		appearances.push(appearance)
	})

	// Создаем пары для сравнения
	for (let i = 0; i < appearances.length; i++) {
		for (let j = i + 1; j < appearances.length; j++) {
			const deltaE = calculateDeltaE(
				appearances[i].perceivedColor.lab,
				appearances[j].perceivedColor.lab
			)

			const visualDifference = getVisualDifferenceCategory(deltaE)
			const acceptanceStatus =
				deltaE <= test.acceptanceThreshold
					? 'pass'
					: deltaE <= test.acceptanceThreshold * 1.5
					? 'marginal'
					: 'fail'

			comparisonPairs.push({
				light1: appearances[i].lightSourceId,
				light2: appearances[j].lightSourceId,
				deltaE,
				visualDifference,
				acceptanceStatus,
			})
		}
	}

	// Общая оценка
	const maxDeltaE = Math.max(...comparisonPairs.map(p => p.deltaE))
	const failedPairs = comparisonPairs.filter(
		p => p.acceptanceStatus === 'fail'
	).length
	const marginalPairs = comparisonPairs.filter(
		p => p.acceptanceStatus === 'marginal'
	).length

	let severity: MetamerismReport['overallAssessment']['severity']
	let recommendation = ''
	const suitableApplications: string[] = []
	const restrictedApplications: string[] = []

	if (maxDeltaE <= test.acceptanceThreshold) {
		severity = 'acceptable'
		recommendation =
			'Цвет показывает отличную стабильность при различном освещении. Подходит для всех применений.'
		suitableApplications.push(
			'Критичные применения',
			'Брендинг',
			'Упаковка премиум-класса'
		)
	} else if (failedPairs === 0 && marginalPairs <= 1) {
		severity = 'noticeable'
		recommendation =
			'Незначительные различия в некоторых условиях освещения. Приемлемо для большинства применений.'
		suitableApplications.push('Стандартная упаковка', 'Печатная продукция')
		restrictedApplications.push('Критичные цветовые совпадения')
	} else if (failedPairs <= 2) {
		severity = 'problematic'
		recommendation =
			'Заметные различия при некоторых источниках света. Требует осторожности при выборе применения.'
		suitableApplications.push('Внутренняя печать', 'Неответственные применения')
		restrictedApplications.push(
			'Розничная торговля',
			'Упаковка пищевых продуктов'
		)
	} else {
		severity = 'critical'
		recommendation =
			'Критически сильный метамеризм. Не рекомендуется для коммерческого использования.'
		restrictedApplications.push(
			'Все коммерческие применения',
			'Брендинг',
			'Упаковка'
		)
	}

	return {
		colorId: color.hex,
		testDate: new Date(),
		conditions: {
			primaryLight: test.lightSources[0],
			ambientLevel: 0.7,
		},
		appearances,
		overallAssessment: {
			severity,
			recommendation,
			suitableApplications,
			restrictedApplications,
		},
		comparisonPairs,
	}
}

/**
 * Симулирует внешний вид цвета под определенным источником света
 */
function simulateColorAppearance(
	lab: { l: number; a: number; b: number },
	lightSource: ExtendedLightSource
): ColorAppearance {
	// Упрощенная симуляция влияния источника света на цвет
	let adjustedLab = { ...lab }
	const warnings: string[] = []

	// Корректировка в зависимости от цветовой температуры
	const tempFactor = (lightSource.colorTemperature - 5000) / 2000
	adjustedLab.a += tempFactor * 5
	adjustedLab.b += tempFactor * 10

	// Влияние CRI
	const criFactor = lightSource.cri ? lightSource.cri / 100 : 0.8
	if (criFactor < 0.85) {
		adjustedLab.a *= criFactor
		adjustedLab.b *= criFactor
		warnings.push('Низкий CRI может исказить цветопередачу')
	}

	// Влияние UV содержания
	if (lightSource.uvContent && lightSource.uvContent > 0.1) {
		warnings.push('Высокое UV содержание может вызывать выцветание')
	}

	// Влияние мерцания
	if (lightSource.flickerFrequency && lightSource.flickerFrequency < 100) {
		warnings.push('Низкая частота мерцания может влиять на восприятие цвета')
	}

	const adjustedHex = labToHex(adjustedLab)

	// Определение направления сдвига цвета
	const deltaA = adjustedLab.a - lab.a
	const deltaB = adjustedLab.b - lab.b
	const magnitude = Math.sqrt(deltaA * deltaA + deltaB * deltaB)

	let direction = 'neutral'
	if (magnitude > 1) {
		if (deltaB > Math.abs(deltaA)) direction = 'warmer'
		else if (deltaB < -Math.abs(deltaA)) direction = 'cooler'
		else if (deltaA > Math.abs(deltaB)) direction = 'more red'
		else if (deltaA < -Math.abs(deltaB)) direction = 'more green'
	}

	return {
		lightSourceId: lightSource.id,
		perceivedColor: {
			hex: adjustedHex,
			lab: adjustedLab,
			description: generateColorDescription(adjustedLab),
		},
		contrast: calculateContrast(adjustedLab),
		visibility: calculateVisibility(adjustedLab, lightSource),
		colorShift: {
			magnitude,
			direction,
		},
		warnings,
	}
}

// Вспомогательные функции

function getVisualDifferenceCategory(
	deltaE: number
): 'imperceptible' | 'slight' | 'noticeable' | 'significant' {
	if (deltaE < 1) return 'imperceptible'
	if (deltaE < 2) return 'slight'
	if (deltaE < 4) return 'noticeable'
	return 'significant'
}

function generateColorDescription(lab: {
	l: number
	a: number
	b: number
}): string {
	const { l, a, b } = lab

	let lightness = ''
	if (l < 30) lightness = 'очень темный'
	else if (l < 50) lightness = 'темный'
	else if (l < 70) lightness = 'средний'
	else if (l < 85) lightness = 'светлый'
	else lightness = 'очень светлый'

	let hue = ''
	if (Math.abs(a) < 5 && Math.abs(b) < 5) hue = 'нейтральный'
	else if (a > 5 && Math.abs(b) < Math.abs(a)) hue = 'красноватый'
	else if (a < -5 && Math.abs(b) < Math.abs(a)) hue = 'зеленоватый'
	else if (b > 5 && Math.abs(a) < Math.abs(b)) hue = 'желтоватый'
	else if (b < -5 && Math.abs(a) < Math.abs(b)) hue = 'синеватый'
	else if (a > 0 && b > 0) hue = 'оранжевый'
	else if (a > 0 && b < 0) hue = 'пурпурный'
	else if (a < 0 && b > 0) hue = 'зеленовато-желтый'
	else hue = 'сине-зеленый'

	return `${lightness} ${hue} цвет`
}

function calculateContrast(lab: { l: number; a: number; b: number }): number {
	// Упрощенный расчет контраста с белым фоном
	const whiteLab = { l: 95, a: 0, b: 0 }
	const deltaE = calculateDeltaE(lab, whiteLab)
	return Math.min(10, deltaE / 10)
}

function calculateVisibility(
	lab: { l: number; a: number; b: number },
	lightSource: ExtendedLightSource
): number {
	// Базовая видимость на основе светлоты
	let visibility = lab.l / 100

	// Корректировка на основе CRI
	if (lightSource.cri) {
		visibility *= lightSource.cri / 100
	}

	// Корректировка на основе типа источника света
	if (
		lightSource.type === 'fluorescent' &&
		lightSource.cri &&
		lightSource.cri < 80
	) {
		visibility *= 0.9
	}

	return Math.max(0, Math.min(1, visibility))
}
