import type { PantoneColor } from '@/types'
import type { Recipe } from '@/types/recipe'

export const parseRecipe = (recipeString: string): Recipe[] => {
	const lines = recipeString.split('\n')
	const recipes: Recipe[] = []
	let currentRecipe: Recipe | null = null

	lines.forEach(line => {
		const totalAmountMatch = line.match(/^Общее количество: (\d+)/)
		const materialMatch = line.match(/^Материал: (.+)/)
		const aniloxMatch = line.match(/^Анилокс: (.+)/)
		const paintMatch = line.match(/^Краска: (.+), Количество: (\d+)/)
		const commentMatch = line.match(/^Комментарий: (.+)/)

		if (totalAmountMatch) {
			if (currentRecipe) recipes.push(currentRecipe)
			currentRecipe = {
				totalAmount: parseInt(totalAmountMatch[1]),
				material: '',
				items: [],
			}
		} else if (materialMatch && currentRecipe) {
			currentRecipe.material = materialMatch[1]
		} else if (aniloxMatch && currentRecipe) {
			currentRecipe.anilox = aniloxMatch[1]
		} else if (commentMatch && currentRecipe) {
			currentRecipe.comment = commentMatch[1]
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

export const getSimilarRecipes = (
	targetColor: PantoneColor,
	colors: PantoneColor[]
): Array<{
	color: PantoneColor
	similarRecipes: Array<{
		recipe: Recipe
		differences: Array<{ paint: string; difference: number }>
	}>
}> => {
	if (!targetColor.recipe) return []

	const targetRecipes = parseRecipe(targetColor.recipe)
	const similarRecipesResults: Array<{
		color: PantoneColor
		similarRecipes: Array<{
			recipe: Recipe
			differences: Array<{ paint: string; difference: number }>
		}>
	}> = []

	colors
		.filter(color => color.id !== targetColor.id && color.recipe)
		.forEach(color => {
			const comparisonRecipes = parseRecipe(color.recipe!)
			const similarRecipes: Array<{
				recipe: Recipe
				differences: Array<{ paint: string; difference: number }>
			}> = []

			targetRecipes.forEach(targetRecipe => {
				comparisonRecipes.forEach(comparisonRecipe => {
					const differences: Array<{ paint: string; difference: number }> = []

					// Создаем карты процентов для обоих рецептов
					const targetPercentages = new Map<string, number>()
					const targetPaints = new Set<string>()
					targetRecipe.items.forEach(item => {
						const percentage = (item.amount / targetRecipe.totalAmount) * 100
						targetPercentages.set(item.paint, percentage)
						targetPaints.add(item.paint)
					})

					const comparisonPercentages = new Map<string, number>()
					const comparisonPaints = new Set<string>()
					comparisonRecipe.items.forEach(item => {
						const percentage =
							(item.amount / comparisonRecipe.totalAmount) * 100
						comparisonPercentages.set(item.paint, percentage)
						comparisonPaints.add(item.paint)
					})

					// Проверяем, что наборы компонентов идентичны
					const targetPaintsArray = Array.from(targetPaints)
					const comparisonPaintsArray = Array.from(comparisonPaints)

					if (
						targetPaintsArray.length === comparisonPaintsArray.length &&
						targetPaintsArray.every(paint => comparisonPaints.has(paint))
					) {
						// Если наборы компонентов совпадают, проверяем разницу в процентах
						let isRecipeSimilar = true

						targetPaintsArray.forEach(paint => {
							const targetPercentage = targetPercentages.get(paint) || 0
							const comparisonPercentage = comparisonPercentages.get(paint) || 0
							const difference = Math.abs(
								targetPercentage - comparisonPercentage
							)

							if (difference <= 3) {
								differences.push({ paint, difference })
							} else {
								isRecipeSimilar = false
							}
						})

						if (
							isRecipeSimilar &&
							differences.length === targetPaintsArray.length
						) {
							similarRecipes.push({ recipe: comparisonRecipe, differences })
						}
					}
				})
			})

			if (similarRecipes.length > 0) {
				similarRecipesResults.push({ color, similarRecipes })
			}
		})

	return similarRecipesResults
}
