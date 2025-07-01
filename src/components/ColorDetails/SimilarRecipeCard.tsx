import { useTheme } from '@contexts/ThemeContext'
import type { PantoneColor, Recipe } from '@/types'
import { Percent } from 'lucide-react'

interface SimilarRecipeCardProps {
	color: PantoneColor
	recipes: Array<{
		recipe: Recipe
		differences: Array<{ paint: string; difference: number }>
	}>
}

export default function SimilarRecipeCard({
	color,
	recipes,
}: SimilarRecipeCardProps) {
	const { isDark } = useTheme()

	return (
		<div
			className={`p-4 rounded-xl transition-all duration-200 ${
				isDark
					? 'bg-purple-900/20 border-purple-800/30'
					: 'bg-purple-50/80 border-purple-200'
			} border`}
		>
			<div className='flex items-center justify-between mb-4'>
				<div>
					<h3
						className={`font-medium ${
							isDark ? 'text-purple-200' : 'text-purple-900'
						}`}
					>
						{color.name}
					</h3>
					<p
						className={`text-sm font-mono ${
							isDark ? 'text-purple-300' : 'text-purple-700'
						}`}
					>
						{color.hex}
					</p>
				</div>
				<div
					className='w-12 h-12 rounded-lg border shadow-sm'
					style={{ backgroundColor: color.hex }}
				/>
			</div>

			<div className='space-y-4'>
				{recipes.map((recipeData, index) => (
					<div
						key={index}
						className={`p-3 rounded-lg ${
							isDark
								? 'bg-purple-900/30 border-purple-800/20'
								: 'bg-purple-50 border-purple-100'
						} border`}
					>
						<p
							className={`text-sm font-medium mb-2 ${
								isDark ? 'text-purple-300' : 'text-purple-700'
							}`}
						>
							Материал: {recipeData.recipe.material}
						</p>
						<div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
							{recipeData.differences.map((diff, diffIndex) => (
								<div
									key={diffIndex}
									className='flex items-center justify-between text-sm p-2 rounded-lg bg-purple-900/10'
								>
									<span
										className={`${
											isDark ? 'text-purple-200' : 'text-purple-800'
										}`}
									>
										{diff.paint}
									</span>
									<div className='flex items-center gap-1'>
										<Percent className='w-3.5 h-3.5' />
										<span
											className={`font-medium ${
												isDark ? 'text-purple-300' : 'text-purple-600'
											}`}
										>
											±{diff.difference.toFixed(1)}%
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
