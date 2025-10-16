export interface RecipeItem {
	paint: string
	amount: number
}

export interface Recipe {
	totalAmount: number
	material: string
	anilox?: string
	comment?: string
	items: RecipeItem[]
}
