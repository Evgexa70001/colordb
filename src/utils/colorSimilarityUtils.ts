import type { PantoneColor } from '@/types'
import type { Recipe } from '@/types/recipe'
import {
	getColorDistance,
	isValidHexColor,
	calculateDeltaEWithCalibration,
	SPECTROPHOTOMETER_CALIBRATIONS,
} from '@utils/colorUtils'
import { getSimilarRecipes } from '@utils/recipeUtils'

export const getSimilarColors = (
	targetColor: PantoneColor,
	colors: PantoneColor[]
): {
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
	similarRecipes: Array<{
		color: PantoneColor
		similarRecipes: Array<{
			recipe: Recipe
			differences: Array<{ paint: string; difference: number }>
		}>
	}>
} => {
	const similarColors = !isValidHexColor(targetColor.hex)
		? []
		: colors
				.filter(
					color => color.id !== targetColor.id && isValidHexColor(color.hex)
				)
				.map(color => {
					// Start with the main color distance - приоритет основным цветам
					let minDistance = getColorDistance(targetColor.hex, color.hex)
					let matchingColor = {
						name: color.name,
						hex: color.hex,
						isAdditional: false,
					}
					let matchedWith = {
						name: targetColor.name,
						hex: targetColor.hex,
						isAdditional: false,
					}

					// Проверяем дополнительные цвета только если основные не совпадают достаточно хорошо
					const MAIN_COLOR_THRESHOLD = 5 // Если основные цвета совпадают лучше этого порога, не проверяем дополнительные
					
					// Если основные цвета совпадают достаточно хорошо, не проверяем дополнительные
					if (minDistance.deltaE2000 <= MAIN_COLOR_THRESHOLD) {
						// Оставляем результат с основными цветами
					} else {
						// Проверяем дополнительные цвета только если основные не совпадают
						
						// Check target's additional colors against color's main hex
						if (
							targetColor.additionalColors &&
							targetColor.additionalColors.length > 0
						) {
							targetColor.additionalColors.forEach(additionalColor => {
								if (isValidHexColor(additionalColor.hex)) {
									const distance = getColorDistance(
										additionalColor.hex,
										color.hex
									)
									
									if (distance.deltaE2000 < minDistance.deltaE2000) {
										minDistance = distance
										matchingColor = {
											name: color.name,
											hex: color.hex,
											isAdditional: false,
										}
										matchedWith = {
											name: additionalColor.name,
											hex: additionalColor.hex,
											isAdditional: true,
										}
									}
								}
							})
						}

						// Check color's additional colors against target's main hex
						const colorWithAdditional = color as PantoneColor & {
							additionalColors?: Array<{ name: string; hex: string }>
						}
						if (
							colorWithAdditional.additionalColors &&
							colorWithAdditional.additionalColors.length > 0
						) {
							colorWithAdditional.additionalColors.forEach(additionalColor => {
								if (isValidHexColor(additionalColor.hex)) {
									const distance = getColorDistance(
										targetColor.hex,
										additionalColor.hex
									)
									if (distance.deltaE2000 < minDistance.deltaE2000) {
										minDistance = distance
										matchingColor = {
											name: additionalColor.name,
											hex: additionalColor.hex,
											isAdditional: true,
										}
										matchedWith = {
											name: targetColor.name,
											hex: targetColor.hex,
											isAdditional: false,
										}
									}
								}
							})
						}

						// Check additional colors against each other
						if (
							targetColor.additionalColors &&
							targetColor.additionalColors.length > 0 &&
							colorWithAdditional.additionalColors &&
							colorWithAdditional.additionalColors.length > 0
						) {
							targetColor.additionalColors.forEach(targetAdditional => {
								if (isValidHexColor(targetAdditional.hex)) {
									colorWithAdditional.additionalColors!.forEach(
										colorAdditional => {
											if (isValidHexColor(colorAdditional.hex)) {
												const distance = getColorDistance(
													targetAdditional.hex,
													colorAdditional.hex
												)
												
												if (distance.deltaE2000 < minDistance.deltaE2000) {
													minDistance = distance
													matchingColor = {
														name: colorAdditional.name,
														hex: colorAdditional.hex,
														isAdditional: true,
													}
													matchedWith = {
														name: targetAdditional.name,
														hex: targetAdditional.hex,
														isAdditional: true,
													}
												}
											}
										}
									)
								}
							})
						}
					}

					// Если у цветов есть LAB значения, используем калиброванный дельта E
					if (targetColor.labValues && color.labValues) {
						const calibratedDeltaE = calculateDeltaEWithCalibration(
							targetColor.labValues,
							color.labValues,
							SPECTROPHOTOMETER_CALIBRATIONS.xrite
						)

						// Всегда используем калиброванный дельта E если доступен
						minDistance = {
							deltaE2000: calibratedDeltaE,
							deltaE76: calibratedDeltaE
						}
					}

					return {
						...color,
						distance: minDistance,
						matchingColor,
						matchedWith,
					}
				})
				.filter(color => {
					// Используем более высокий порог для включения цветов с дельта E 2.7
					const passes = color.distance.deltaE2000 < 6
					
					return passes
				}) // Увеличиваем порог до 15 для включения цветов с дельта E 2.7
				.sort((a, b) => a.distance.deltaE2000 - b.distance.deltaE2000)
				.slice(0, 12) // Увеличиваем количество результатов до 12

	const similarRecipes = getSimilarRecipes(targetColor, colors)

	return { similarColors, similarRecipes }
}
